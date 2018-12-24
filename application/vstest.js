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

var logger = new (winston.Logger)({transports: [new (winston.transports.Console)()]});

////////// Run testQuery ///////////
testQuery();


async function testQuery() {
	logger.info('Begin testQuery.');

	// Load the config.json, what describes the network.
	const networkCfg = initNetworkCfg();
	const channelName = 'mychannel';
		
	try {		
		let result = await queryChaincode(networkCfg, channelName, 'org1', 'admin', ['peer0.org1.example.com'], 'findVehicle', ['C123'], 'vehiclesharing');
		logger.info('---------- The result ----------');
		logger.info(result.toString());
	} 
	catch(err) {		
		logger.error('Failed to query java chaincode on the channel. ', err.stack);
	}
}

async function queryChaincode(networkCfg, channelName, orgId, userId, targets, fcn, args, chaincodeId) {
	const orgName = networkCfg[orgId].name;

	logger.info(util.format('Channel:%s    Chaincode:%s    Org:%s    Peer:%s    Function:%s    Args:%s', 
							 channelName,  chaincodeId,    orgName,  targets,   fcn,           args));

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
		txId: null,	// No txId for query.
		fcn: fcn,
		args: args,
		request_timeout: 30000,
		// Empty list [] will cause exception.
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
						pem: Buffer.from(data).toString(),
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
