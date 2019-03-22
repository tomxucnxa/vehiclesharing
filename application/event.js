/**
  * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is an example based on fabric-sdk-node, it refers content of:
 * https://fabric-sdk-node.github.io/master/index.html
 * https://github.com/hyperledger/fabric-sdk-node
 * https://fabric-sdk-node.github.io/master/tutorial-network-config.html
 * 
 * This program uses connprofile.json, what is a common connection profile.
 * It will utilze FileSystemWallet and Gateway, what is from fabric-network module.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const {Gateway, FileSystemWallet, InMemoryWallet, X509WalletMixin} = require('fabric-network');

var logger = new (winston.Logger)({transports: [new (winston.transports.Console)()]});

let arg = process.argv[2];
switch (arg) {
    case 'query' : queryFindVehicle(process.argv[3]); break;
    case 'add' : invokeAddVehicle(getRandomId(), 'FBC'); break;
    case 'listen' : listenEvent(); break;
    default: logger.error(`Please run command likes: 'node vstest4.js query [id]' or 'node vstest4.js add'`);
}

async function queryFindVehicle(vid) {
    if (vid == undefined) {
        logger.info('Please speficy a vehicle id for search.')
        return;
    }
    const identityLabel = 'Admin@org1.example.com';
    const wallet = await initAdminWallet(identityLabel);
    const gateway = new Gateway();

    await gateway.connect(path.join(__dirname, './connprofile.json'),
        {
            wallet: wallet,
            identity: identityLabel,
            discovery: {
				enabled: false,
			}
        });

    logger.info('Gateway connects get succeed.');

    const network = await gateway.getNetwork('mychannel');
    const contract = await network.getContract('vehiclesharing');
    let result = await contract.evaluateTransaction('findVehicle', vid);
    gateway.disconnect();
    
    result = Buffer.from(result).toString()
    logger.info(result == '' ? vid + ' not found' : result)
}

async function invokeAddVehicle(vehicleId, brand) {
    logger.info('Begin to add vehicle [%s-%s]', vehicleId, brand);
    const identityLabel = 'Admin@org1.example.com';
    const wallet = await initAdminWallet(identityLabel);
    const gateway = new Gateway();
    await gateway.connect(path.join(__dirname, './connprofile.json'),
        {
            wallet: wallet,
            identity: identityLabel,
            discovery: {
				enabled: false,
			}
        });

    logger.info('Gateway connects get succeed.');

    try {
        const network = await gateway.getNetwork('mychannel');
        const contract = await network.getContract('vehiclesharing');
        const transaction = contract.createTransaction('createVehicle');
        const transactionId = transaction.getTransactionID().getTransactionID();
    
        logger.info('Create a transaction ID: ', transactionId);
        
        // const org1EventHub = await getFirstEventHubForOrg(network, 'Org1MSP');
        // org1EventHub.connect();
    
        
        // let eventFired = 0;
        // org1EventHub.registerTxEvent('all', (txId, code) => {
        //     logger.info('Event', txId, code);
        //     if (code === 'VALID') {
        //         eventFired++;
        //     }
        // }, 
        // (err) => {
        //     //org1EventHub.disconnect();
        //     //logger.info('EventHub error.', err);
        // },
        // {disconnect: false}
        // );
        
        const response = await transaction.submit(vehicleId, brand);
        logger.info(response.toString());
        // logger.info(`eventFired ${eventFired}`);
        // const succ = (eventFired >= 1);
        // if (succ) {
        //     logger.info('A new vehicle [%s] was created. Response: %s', vehicleId, response.toString());
        // }    
        // else {
        //     logger.error('Adding vehicle got failed.');
        // }
        // org1EventHub.disconnect();
            
    } 
    catch (err) {
		logger.error('Failed to invoke transaction chaincode on channel. ' + err.stack ? err.stack : err);
    } 
    finally {
		gateway.disconnect();
		logger.info('Gateway disconnected.');
	}

}

async function listenEvent() {
    const identityLabel = 'Admin@org1.example.com';
    const wallet = await initAdminWallet(identityLabel);
    const gateway = new Gateway();
    await gateway.connect(path.join(__dirname, './connprofile.json'),
        {
            wallet: wallet,
            identity: identityLabel,
            discovery: {
				enabled: false,
			}
        });

    logger.info('Gateway connects get succeed.');

    try {
        const network = await gateway.getNetwork('mychannel');
        
        //const eventHub = await getFirstEventHubForOrg(network, 'Org1MSP');

        const eventHubs = [network.getChannel().newChannelEventHub('peer0.org1.example.com'),
                            network.getChannel().newChannelEventHub('peer0.org2.example.com'),
                            network.getChannel().newChannelEventHub('peer1.org1.example.com'),
                            network.getChannel().newChannelEventHub('peer1.org2.example.com')];

        eventHubs.forEach(eventHub => {
            listen(eventHub);
        });
        
        
        
            
    } 
    catch (err) {
		logger.error('Failed to invoke transaction chaincode on channel. ' + err.stack ? err.stack : err);
    } 
    finally {
		//gateway.disconnect();
		logger.info('Gateway disconnected.');
	}

}

function listen(eventHub) {
    // eventHub.registerTxEvent('all', (txId, code) => {
    //         logger.info('TxEvent', eventHub.getName(), txId.substring(0,6)+'...', code);
    //     }, 
    //     (err) => {
    //         //logger.info('EventHub error.', err);
    //     },
    //     {disconnect: false}
    // );

    // QueryEvent won't be got, since there is not any transaction submitted. (I think so...)
    // eventHub.registerChaincodeEvent('vehiclesharing', '.*',  (event, block_num, txnid, status) => {
    //     logger.info('CCEvent', event, block_num, txnid.substring(0,6)+'...', status);
    // } );

    eventHub.registerBlockEvent((block) => {
        logger.info('BLOCKEvent', block);
    });

    eventHub.connect();
    logger.info('Begin to listen to event with: ' + eventHub.getName());
}

async function getFirstEventHubForOrg(network, orgMSP) {
    const channel = network.getChannel();
    const orgPeer = channel.getPeersForOrg(orgMSP)[0];
    //return channel.getChannelEventHub(orgPeer.getName());
    return channel.newChannelEventHub(orgPeer);
}

function getRandomId() {
    return Math.random().toString().substring(2).substring(0,8);
}

async function initAdminWallet(identityLabel) {
    // Hardcode crypto materials of Admin@org1.example.com.
    const keyPath = path.join(__dirname, "../../fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/01737fc0b3850518ff1ef05fbd81d1675582089ba66ac35fb7e5109da483e3aa_sk");
    const keyPEM = Buffer.from(fs.readFileSync(keyPath)).toString();
    const certPath = path.join(__dirname, "../../fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem");
    const certPEM = Buffer.from(fs.readFileSync(certPath)).toString();

    const mspId = 'Org1MSP';
    const identity = X509WalletMixin.createIdentity(mspId, certPEM, keyPEM)

    const wallet = new FileSystemWallet('/tmp/wallet/test1');
    await wallet.import(identityLabel, identity);

    if (await wallet.exists(identityLabel)) {
        logger.info('Identity %s exists.', identityLabel);
    }
    else {
        logger.error('Identity %s does not exist.', identityLabel);
    }
    return wallet;
}