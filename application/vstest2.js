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
 */

'use strict';
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const Client = require('fabric-client');

var logger = new (winston.Logger)({transports: [new (winston.transports.Console)()]});

// Call the only test function.
test();


async function test() {
    const client = Client.loadFromConfig(path.join(__dirname, './connprofile.json'));
    const channel = client.getChannel('mychannel');
    await client.initCredentialStores();

    const mspId = client.getMspid();
    const org1Peers = client.getPeersForOrg(mspId);
    const peer0 = client.getPeer('peer0.org1.example.com');
    logger.info('The current client instance belongs to organization: %s', mspId);
    logger.info('%s has %d peers: %s', mspId, org1Peers.length, org1Peers.map(peer => peer.getName()));
    logger.info('An expected peer0 is found: %s %s', peer0.getName(), peer0.getUrl());

    const channelName = channel.getName();
    const channelOrderers = channel.getOrderers();
    const channelPeers = channel.getPeers();
    logger.info('The channel name: %s', channelName);
    logger.info('The channel orderers: %s', channelOrderers.map(ord => ord.getName()));
    logger.info('The channel peers: %s', channelPeers.map(peer => peer.getName()));


    // Creata  user object and set as userContext.
    await client.createUser(initAdmin());

    const request = {
        chaincodeId : 'vehiclesharing',
        txId: null,    // No txId for query.
        fcn: 'findVehicle',
        args: ['C123'],
        request_timeout: 30000,
        // Empty list [] will cause exception. and 'null' leads to send to all peers.
        targets: null
    };

    const result = await channel.queryByChaincode(request); 
    result.forEach((res, idx) => {
        logger.info('Query result %d', idx, Buffer.from(res).toString());
    });
}

function initAdmin() {
    // Hardcode crypto materials of Admin@org1.example.com.
    const keyPath = path.join(__dirname, "../../fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/ae5b21ead4fa0954915a215b82f5ddc18dac94680c169ae577384d4b4ef89300_sk");
    const keyPEM = Buffer.from(fs.readFileSync(keyPath)).toString();
    const certPath = path.join(__dirname, "../../fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem");
    const certPEM = Buffer.from(fs.readFileSync(certPath)).toString();

    // Create a new user object.
    return {
        username: 'Admin@org1.example.com',
        mspid: 'Org1MSP',
        cryptoContent: {
            privateKeyPEM: keyPEM,
            signedCertPEM: certPEM
        }
    };
}