module.exports = function (RED) {
	'use strict';
	// SOURCE-MAP-REQUIRED

	const Net = require('node:net');
	const Retry = require('retry');

	function SIAServer(config) {
		RED.nodes.createNode(this, config);

		this.receiverHost = config.receiverHost;
		this.receiverPort = Number.parseInt(config.receiverPort);
		this.receiverNumber = config.receiverNumber || '';
		// This.siaAccount = config.siaAccount;
		// this.siaAccountPrefix = config.siaAccountPrefix || 'L0';
		this.encryptionKey = config.encryptionKey || '';
		this.encryptionEnabled = this.encryptionKey.length > 0;

		switch (this.encryptionKey.length) {
			case 32: {
				this.encryptionType = 'aes-128-cbc';
				break;
			}

			case 48: {
				this.encryptionType = 'aes-192-cbc';
				break;
			}
			case 64: {
				this.encryptionType = 'aes-256-cbc';
				break;
			}
			default: {
				this.encryptionType = '';
			}
		}

		const client = new Net.Socket();

		process.on('uncaughtException', error => {
			console.error('Uncaught Exception:', error);
			client.destroy();
		});

		this.connect = function () {
			// If(!client.destroyed && client.readyState == 'open') {
			// 	console.log('Already connected to SIA server at ' + this.receiverHost + ':' + this.receiverPort);
			// 	return;
			// }

			if (!this.receiverHost || !this.receiverPort) {
				console.error('Receiver host or port not set');
				return;
			}

			console.log('Connecting to SIA server at', this.receiverHost, this.receiverPort);

			const operation = Retry.operation({
				retries: 5,
				factor: 2,
				minTimeout: 1000,
				maxTimeout: 20_000,
				randomize: true,
			});

			const temporaryRef = this;

			let errorListener = null;

			const connectCallback = () => {
				console.log('Connected to SIA server at', temporaryRef.receiverHost, temporaryRef.receiverPort);
			};

			operation.attempt(currentAttempt => {
				if (errorListener) { // Will not be active on first attempt
					client.off('error', errorListener);
					client.off('connect', connectCallback);
				}

				errorListener = error => {
					console.log(`Connection error: ${error.message}`);
					if (operation.retry(error)) {
						console.log(`Retrying connection to SIA server, attempt number: ${currentAttempt}`);
						return;
					}

					console.error('Failed to connect to SIA server:', error);
				};

				client.once('error', errorListener);

				client.connect(temporaryRef.receiverPort, temporaryRef.receiverHost, connectCallback);
			});
		};

		this.getSIAConfig = function () {
			return {
				receiverNumber: this.receiverNumber,
				encryptionKey: this.encryptionKey,
				encryptionEnabled: this.encryptionEnabled,
				encryptionType: this.encryptionType,
			};
		};

		this.write = function (data) {
			if (!client.destroyed && client.readyState == 'open') {
				console.log('Sending data to SIA server:', data);
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
