/**
  * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is an example based on fabric-sdk-node, it refers content of:
 * https://fabric-sdk-node.github.io/master/index.html
 * https://github.com/hyperledger/fabric-sdk-node
 * but not totally same as that, it simplifies the code and figure out some important items. 
 */

'use strict';
const os = require('os');
const path = require('path');
const fs = require('fs');
const util = require('util');
const winston = require('winston');
const Client = require('fabric-client');

var logger = new (winston.Logger)({transports: [new (winston.transports.Console)({timestamp:true, colorize: true})]});

////////// Run testQuery ///////////
let arg = process.argv[2];

switch (arg) {
    case 'query' : queryFindVehicle(); break;
    case 'invoke' : invokeAddVehicle(); break;
    default: logger.error(`Please run command likes: 'node vstest.js query' or 'node vstest.js invoke'`);
}

async function queryFindVehicle() {
    logger.info('=================================== Begin queryFindVehicle ===================================');

    // Load the config.json, what describes the network.
    const networkCfg = initNetworkCfg();
    const channelName = 'mychannel';
        
    try {        
        let result = await queryChaincode(networkCfg, channelName, 'org1', 'admin', ['peer0.org1.example.com'], 'findVehicle', ['C123'], 'vehiclesharing');
        if (result) {
            result.forEach((res,idx) => {
                logger.info('Result %d', idx, Buffer.from(res).toString());
            });
        }
    } 
    catch(err) {        
        logger.error('Failed to query java chaincode on the channel. ', err.stack);
    }
    logger.info('==============================================================================================');
}

async function invokeAddVehicle() {
    logger.info('=================================== Begin invokeAddVehicle ===================================');

    // Load the config.json, what describes the network.
    const networkCfg = initNetworkCfg();
    const channelName = 'mychannel';
    
    try {
        const vehicleId = getRandomId();
        //let result = await invokeChaincode(networkCfg, channelName, 'org1', 'admin', ['peer0.org1.example.com', 'peer0.org2.example.com'], 'createVehicle', [vehicleId, 'FORD'], 'vehiclesharing');
        let result = await invokeChaincode(networkCfg, channelName, 'org1', 'admin', [], 'createVehicle', [vehicleId, 'FORD'], 'vehiclesharing');
        logger.info(JSON.stringify(result));
    } 
    catch(err) {        
        logger.error('Failed to query java chaincode on the channel. ', err.stack);
    }
    logger.info('==============================================================================================');
}

async function queryChaincode(networkCfg, channelName, orgId, userId, targets, fcn, args, chaincodeId) {
    const orgName = networkCfg[orgId].name;
    const userName = networkCfg[orgId][userId].userName;

    logger.info(util.format('Channel:%s    Chaincode:%s    Org:%s    User:%s    Peer:%s    Function:%s    Args:%s', 
                             channelName,  chaincodeId,    orgName,  userName,  targets,   fcn,           args));

    // Initialize the client of the channel.
    const client = new Client();
    const channel = client.newChannel(channelName);

    // Initialize state store.
    const store = await Client.newDefaultKeyValueStore({path: storePathForOrg(orgName)});
    client.setStateStore(store);

    // Create a new user object, set to the client instance as the current userContext.
    await client.createUser(initUser(networkCfg, client, orgId, userId));

    // Collect all peers from the configuration. For this demo only.
    const peersList = getAllPeers(networkCfg);
    peersList.forEach(peer => {
        channel.addPeer(peer);
    });

    // Get target peers from all peers, identified by the hostName.
    const targetPeers = getTargetPeers(channel.getPeers(), targets);

    const request = {
        chaincodeId : chaincodeId,
        txId: null,    // No txId for query.
        fcn: fcn,
        args: args,
        request_timeout: 30000,
        // Empty list [] will cause exception. and 'null' leads to send to all peers.
        targets: targetPeers === null || targetPeers.length === 0 ? null : targetPeers
    };

    return channel.queryByChaincode(request);    
}

function getTargetPeers(peers, targets) {
    const targetPeers = peers.filter(peer => {
        return targets.includes(peer.getName());
    });
    
    if (targetPeers.length != targets.length) {
        throw new Error('Target doesnot exist.');
    }
    return targetPeers;    
}

function initNetworkCfg() {
    Client.addConfigFile(path.join(__dirname, './config.json'));
    return Client.getConfigSetting('vehiclesharing-network');
}

function storePathForOrg(orgName) {
    return path.join(os.tmpdir(), 'hfc', 'kv'+'_'+orgName);    
}

function initUser(networkCfg, client, orgId, userId) {
    // Get pem file from the config. And only use 1 key file and 1 cert file.
    const user = networkCfg[orgId][userId];
    const keyPath = path.join(__dirname, user.keyStore);
    const keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
    const certPath = path.join(__dirname, user.signCerts);
    const certPEM = Buffer.from(readAllFiles(certPath)[0]).toString();

    // Initialize crypto related.
    const cryptoSuite = Client.newCryptoSuite();
    cryptoSuite.setCryptoKeyStore(Client.newCryptoKeyStore({path: storePathForOrg(networkCfg[orgId].name)}));
    client.setCryptoSuite(cryptoSuite);
    
    // Create a new user object.
    return {
        username: user.userName,
        mspid: networkCfg[orgId].mspid,
        cryptoContent: {
            privateKeyPEM: keyPEM,
            signedCertPEM: certPEM
        }
    };
}

function readAllFiles(dir) {
    const files = fs.readdirSync(dir);
    const certs = [];
    files.forEach((file_name) => {
        const file_path = path.join(dir,file_name);
        const data = fs.readFileSync(file_path);
        certs.push(data);
    });
    return certs;
}

function getAllPeers(networkCfg) {
    const peersList = [];
    for (const key in networkCfg) {
        // TODO If conclude by peers? For demo only.
        if (networkCfg[key].peers !== undefined) {
            networkCfg[key].peers.forEach(peerCfg => {
                const data = fs.readFileSync(path.join(__dirname, peerCfg.tlsCaCerts));
                const peer = new Client.Peer(
                    peerCfg.requests,
                    {
                        'pem': Buffer.from(data).toString(),
                        'ssl-target-name-override': peerCfg.hostName,
                        // Use hostName for unique peer name.
                        'name': peerCfg.hostName
                    });
                peersList.push(peer);
            });
        }
    }
    return peersList;
}

function getOrderer(networkCfg) {
    return new Client.Orderer(
        networkCfg.orderer.url,
        {
            'pem': Buffer.from(fs.readFileSync(path.join(__dirname, networkCfg.orderer.tlsCaCerts))).toString(),
            'ssl-target-name-override': networkCfg.orderer.hostName
        }
    );
}

function getRandomId() {
    return Math.random().toString().substring(2).substring(0,8);
}

async function invokeChaincode(networkCfg, channelName, orgId, userId, targets, fcn, args, chaincodeId) {
    const orgName = networkCfg[orgId].name;
    const userName = networkCfg[orgId][userId].userName;

    logger.info(util.format('Channel:%s    Chaincode:%s    Org:%s    User:%s    Peer:%s    Function:%s    Args:%s', 
                             channelName,  chaincodeId,    orgName,  userName,  targets,   fcn,           args));

    // Initialize the client of the channel.
    const client = new Client();
    const channel = client.newChannel(channelName);

    // Initialize state store.
    const store = await Client.newDefaultKeyValueStore({path: storePathForOrg(orgName)});
    client.setStateStore(store);

    // Create a new user object, set to the client instance as the current userContext.
    await client.createUser(initUser(networkCfg, client, orgId, userId));

    // Collect all peers from the configuration. For this demo only.
    const peersList = getAllPeers(networkCfg);
    peersList.forEach(peer => {
        channel.addPeer(peer);
    });

    // Get target peers from all peers, identified by the hostName.
    const targetPeers = getTargetPeers(channel.getPeers(), targets);

    // Add orderer.
    channel.addOrderer(getOrderer(networkCfg));

    await channel.initialize();

    const txId = client.newTransactionID();
    logger.info('Get a new transaction ID: %s', txId.getTransactionID());

    const proposalRequest = {
        chaincodeId : chaincodeId,
        fcn: fcn,
        args: args,
        txId: txId,
        // Empty list [] will cause exception. and 'null' leads to send to all peers.
        targets: targetPeers === null || targetPeers.length === 0 ? null : targetPeers
    };
    
    // Send transaction proposal (ChaincodeInvokeRequest) to endorsing peers, get back result (ProposalResponseObject).
    const proposalResults = await channel.sendTransactionProposal(proposalRequest);

    // n responses from endorsing peers, per targets of proposalRequest.
    const proposalResponses = proposalResults[0];
    logger.info('There are all [%d] proposal responses returned.', proposalResponses.length);
    
    // The original Proposal object needed when sending the transaction request to the orderer
    const proposal = proposalResults[1];
    
    // Make sure each proposal response is valid.
    let resValid = proposalResponses.map(propRes => {
        return propRes.response && propRes.response.status === 200 && channel.verifyProposalResponse(propRes);
    }).every(valid => valid);

    if (!resValid) {
        throw Error('At least 1 proposal response is invalid.');
    }

    // Make sure the proposalResponses are same.
    if(!channel.compareProposalResponseResults(proposalResponses)){
        throw Error('At least 1 proposal response is not same.');
    }

    const transactionRequest = {
        proposalResponses: proposalResponses,
        proposal: proposal
    };

    // Send the proposal responses that contain the endorsements of a transaction proposal to the orderer for further processing. 
    const sendPromise = channel.sendTransaction(transactionRequest);
    
    const allPromises = [sendPromise];
    const eventHubs = [];

    // Uncomment/comment below section to enable/disable event hub to monitor peers event.
    // Begin event.
    peersList.forEach(peer => {
        eventHubs.push(channel.newChannelEventHub(peer));
    });
    handleEvents(eventHubs, txId).forEach(p => allPromises.push(p));
    // End event.

    // Promise.all with order
    const transactionResult = await Promise.all(allPromises);

    // Disconnect event hubs if connected.
    eventHubs.forEach((eh) => {
        if (eh.isconnected()) {
            eh.disconnect();
        }
    });

    return transactionResult[0];
}

// Register transaction event of each channel event hub, what created per peer.
function handleEvents(eventHubs, txId) {
    const eventPromises = [];
    const plainId = txId.getTransactionID();
    eventHubs.forEach((eh) => {
        // begin txPromise
        const txPromise = new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(reject, 120000);
            eh.registerTxEvent(
                // txid
                plainId,
                // on event
                (tx, code) => {
                    clearTimeout(timeoutHandle);
                    eh.unregisterTxEvent(plainId);
                    if (code !== 'VALID') {
                        logger.error('ChannelEventHub - transaction is not valid:', code, tx);
                        reject();
                    } 
                    else {
                        logger.info('ChannelEventHub - transaction succeed on peer', eh.getPeerAddr(), tx);
                        resolve();
                    }
                },
                // on error
                () => {
                    clearTimeout(timeoutHandle);
                    logger.error('ChannelEventHub - error occurred', plainId);
                    resolve();
                }
            );
        });
        // end txPromise
        eh.connect();
        eventPromises.push(txPromise);
    });
    return eventPromises;
}