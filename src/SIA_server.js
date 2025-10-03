module.exports = function (RED) {
	'use strict';
	// SOURCE-MAP-REQUIRED

	const Net = require('node:net');

	function SIAServer(config) {
		RED.nodes.createNode(this, config);

		this.receiverHost = config.receiverHost;
		this.receiverPort = Number.parseInt(config.receiverPort) || 5093;
		this.receiverNumber = config.receiverNumber || "";
		// This.siaAccount = config.siaAccount;
		// this.siaAccountPrefix = config.siaAccountPrefix || 'L0';
		this.encryptionKey = config.encryptionKey || "";
		this.encryptionEnabled = this.encryptionKey.length > 0;

		const client = new Net.Socket();

		this.connectClient = function () {

			if(!client.destroyed && client.readyState == 'open') {
				// already connected
				return;
			}
			if(!this.receiverHost || !this.receiverPort) {
				console.error('Receiver host or port not set');
				return;
			}

			console.log('Connecting to SIA server at ' + this.receiverHost + ':' + this.receiverPort);
			try {
				client.connect(this.receiverPort, this.receiverHost, function () {
					console.log('Connected to SIA server at ' + this.receiverHost + ':' + this.receiverPort);
				});
			} catch (error) {
				console.error('Error connecting to SIA server:', error);
			}
		};

		this.getSIAConfig = function () {
			return {
				// SiaAccount: this.siaAccount,
				// siaAccountPrefix: this.siaAccountPrefix,
				receiverNumber: this.receiverNumber,
				encryptionKey: this.encryptionKey,
				encryptionEnabled: this.encryptionEnabled,
			};
		};

		this.write = function (data) {
			if (!client.destroyed && socket.readyState == 'open') {
				client.write(data);
			}
		};

		this.close = function () {
			if (!client.destroyed) {
				client.end();
			}
		};

		// Handle sending of data
		// handle failure to connect
		// payload won't be prepared here but in SIA device

		// client.write('Hello, server.');
	}

	RED.nodes.registerType('SIA-server', SIAServer);

	/* istanbul ignore next */
};
