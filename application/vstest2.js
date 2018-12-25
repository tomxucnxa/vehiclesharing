const winston = require('winston');
const fs = require('fs');
const path = require('path');
var logger = new (winston.Logger)({transports: [new (winston.transports.Console)()]});

const Client = require('fabric-client');

test();

async function test() {
    logger.info(__dirname);

    const client = Client.loadFromConfig(path.join(__dirname, './config2.json'));
    //logger.info(client.getPeersForOrg());
    //logger.info(client.getChannel('mychannel'));

    const channel = client.getChannel('mychannel');

    await client.initCredentialStores();
    //await channel.initialize();

    await client.createUser(initAdmin(client));

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
    result.forEach(res => {
        logger.info(Buffer.from(res).toString());
    });
    
}

function initAdmin(client) {
    // Get pem file from the config. And only use 1 key file and 1 cert file.
    
    const keyPath = "../fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/ae5b21ead4fa0954915a215b82f5ddc18dac94680c169ae577384d4b4ef89300_sk";
    const keyPEM = Buffer.from(fs.readFileSync(keyPath)).toString();
    const certPath = "../fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem";
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