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
const os = require('os');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const {Gateway, FileSystemWallet, X509WalletMixin} = require('fabric-network');

var logger = new (winston.Logger)({transports: [new (winston.transports.Console)()]});

// Call the only test function.
test();


async function test() {
    const identityLabel = 'Admin@org1.example.com';
    const wallet = await initAdminWallet(identityLabel);
    const gateway = new Gateway();

    await gateway.connect(path.join(__dirname, './connprofile.json'),
        {
            wallet: wallet,
            identity: identityLabel
        });

    logger.info('Gateway connects get succeed.');

    const network = await gateway.getNetwork('mychannel');
    const contract = await network.getContract('vehiclesharing');
    const result = await contract.evaluateTransaction('findVehicle', 'C123');
    gateway.disconnect();
    
    logger.info('Result', Buffer.from(result).toString());
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