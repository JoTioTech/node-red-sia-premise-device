module.exports = function (RED) {
	'use strict';
	// SOURCE-MAP-REQUIRED

	const Net = require('node:net');

	function SIAServer(config) {
		RED.nodes.createNode(this, config);

		this.receiverHost = config.receiverHost;
		this.receiverPort = Number.parseInt(config.receiverPort) || 5093;
		this.receiverNumber = config.receiverNumber || '';
		// this.siaAccount = config.siaAccount;
		// this.siaAccountPrefix = config.siaAccountPrefix || 'L0';
		this.encryptionKey = config.encryptionKey;
		this.encryptionEnabled = config.encryptionEnabled || false;
		this.passwordInHex = config.passwordInHex || false;

		this.

		const client = new Net.Socket();

		this.connectClient = function () {
			console.log('Connecting to SIA server at ' + this.receiverHost + ':' + this.receiverPort);
			// client.connect(this.receiverPort, this.receiverHost, function () {
			// 	console.log('Connected to SIA server at ' + this.receiverHost + ':' + this.receiverPort);
			// });
		};

		this.getSIAConfig = function () {
			return {
				// siaAccount: this.siaAccount,
				// siaAccountPrefix: this.siaAccountPrefix,
				receiverNumber: this.receiverNumber,
				encryptionKey: this.encryptionKey,
				encryptionEnabled: this.encryptionEnabled,
				passwordInHex: this.passwordInHex
			};
		}

		// handle sending of data
		// handle failure to connect
		// payload won't be prepared here but in SIA device


	// client.write('Hello, server.');

	}

	RED.nodes.registerType('SIA-server', SIAServer);

	/* istanbul ignore next */
};
