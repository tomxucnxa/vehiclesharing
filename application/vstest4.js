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
 * It will utilze InMemoryWallet and Gateway, what is from fabric-network module.
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
    default: logger.error(`Please run command likes: 'node vstest4.js query [id]' or 'node vstest4.js add'`);
}

async function queryFindVehicle(vid) {
    if (vid == undefined) {
        logger.info('Please speficy a vehicle id for search.')
        return;
    }
    const identityLabel = 'alice@sharing.example.com';
    const wallet = await initUserWallet(identityLabel);
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

    const network = await gateway.getNetwork('vschannel');
    const contract = await network.getContract('vehiclesharing');
    let result = await contract.evaluateTransaction('findVehicle', vid);
    gateway.disconnect();
    
    result = Buffer.from(result).toString()
    logger.info(result == '' ? vid + ' not found' : result)
}

async function invokeAddVehicle(vehicleId, brand) {
    logger.info('Begin to add vehicle [%s-%s]', vehicleId, brand);
    const identityLabel = 'alice@sharing.example.com';
    const wallet = await initUserWallet(identityLabel);
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
        const network = await gateway.getNetwork('vschannel');
        const contract = await network.getContract('vehiclesharing');
        const transaction = contract.createTransaction('createVehicle');
        const transactionId = transaction.getTransactionID().getTransactionID();
    
        logger.info('Create a transaction ID: ', transactionId);
        
        const sharingOrgEventHub = await getFirstEventHubForOrg(network, 'SharingMSP');
        //const vehicleEventHub = await getFirstEventHubForOrg(network, 'VehicleMSP');
        //const onlinePayEventHub = await getFirstEventHubForOrg(network, 'OnlinePayMSP');
    
        let eventFired = 0;
        sharingOrgEventHub.registerTxEvent('all', (txId, code) => {
            logger.info('Event', txId, code);
            if (code === 'VALID' && txId === transactionId) {
                eventFired++;
            }
        }, 
        () => {
            //logger.info('EventHub error.');
        });
        
        const response = await transaction.submit(vehicleId, brand);
        const succ = (eventFired == 1);
        if (succ) {
            logger.info('A new vehicle [%s] was created. Response: %s', vehicleId, response.toString());
        }    
        else {
            logger.error('Adding vehicle got failed.');
        }
            
    } 
    catch (err) {
		logger.error('Failed to invoke transaction chaincode on channel. ' + err.stack ? err.stack : err);
    } 
    finally {
		gateway.disconnect();
		logger.info('Gateway disconnected.');
	}

}

async function getFirstEventHubForOrg(network, orgMSP) {
    const channel = network.getChannel();
    const orgPeer = channel.getPeersForOrg(orgMSP)[0];
	return channel.getChannelEventHub(orgPeer.getName());
}

function getRandomId() {
    return Math.random().toString().substring(2).substring(0,8);
}

async function initUserWallet(identityLabel) {
    // Hardcode crypto materials of user alice@sharing.example.com.
    const keyPath = path.join(__dirname, "../deployed/client/mymsp/localmsp/alice@sharing.example.com/msp/keystore/alice@sharing.example.com.key");
    const keyPEM = Buffer.from(fs.readFileSync(keyPath)).toString();
    const certPath = path.join(__dirname, "../deployed/client/mymsp/localmsp/alice@sharing.example.com/msp/signcerts/alice@sharing.example.com.pem");
    const certPEM = Buffer.from(fs.readFileSync(certPath)).toString();

    const mspId = 'SharingMSP';
    const identity = X509WalletMixin.createIdentity(mspId, certPEM, keyPEM)

    //const wallet = new FileSystemWallet('/tmp/wallet/alice.sharing');
    const wallet = new InMemoryWallet();
    await wallet.import(identityLabel, identity);

    if (await wallet.exists(identityLabel)) {
        logger.info('Identity %s exists.', identityLabel);
    }
    else {
        logger.error('Identity %s does not exist.', identityLabel);
    }
    return wallet;
}