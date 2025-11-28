module.exports = function (RED) {
	'use strict';
	// SOURCE-MAP-REQUIRED

	const Net = require('node:net');
	const Retry = require('retry');

	function SIAServer(config) {
		RED.nodes.createNode(this, config);

		const node = this;

		node.receiverHost = config.receiverHost;
		node.receiverPort = Number.parseInt(config.receiverPort);
		node.receiverNumber = config.receiverNumber || '';
		// This.siaAccount = config.siaAccount;
		// node.siaAccountPrefix = config.siaAccountPrefix || 'L0';
		node.encryptionKey = config.encryptionKey || '';
		node.encryptionEnabled = node.encryptionKey.length > 0;

		switch (node.encryptionKey.length) {
			case 32: {
				node.encryptionType = 'aes-128-cbc';
				break;
			}

			case 48: {
				node.encryptionType = 'aes-192-cbc';
				break;
			}

			case 64: {
				node.encryptionType = 'aes-256-cbc';
				break;
			}

			default: {
				node.encryptionType = '';
			}
		}

		const client = new Net.Socket();

		process.on('uncaughtException', error => {
			console.error('Uncaught Exception:', error);
			client.destroy();
		});

		client.on('data', data => {
			// Emits to any SIA-device listening via server.on('data', ...)
			console.log("Received some message", data);
			node.emit('data', data);
		});

		client.on('error', error => {
			console.error('SIA Socket Error:', error.message);
			node.emit('socketError', error); // Notify devices if needed
		});

		client.on('connect', () => {
			node.emit('connected');
		});

		client.on('close', () => {
			node.emit('closed');
		});

		// -------------

		node.connect = function () {
			// If(!client.destroyed && client.readyState == 'open') {
			// 	console.log('Already connected to SIA server at ' + node.receiverHost + ':' + node.receiverPort);
			// 	return;
			// }

			if (!node.receiverHost || !node.receiverPort) {
				console.error('Receiver host or port not set');
				return;
			}

			console.log('Connecting to SIA server at', node.receiverHost, node.receiverPort);

			const operation = Retry.operation({
				retries: 5,
				factor: 2,
				minTimeout: 1000,
				maxTimeout: 20_000,
				randomize: true,
			});

			const temporaryRef = node;

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

		node.getSIAConfig = function () {
			return {
				receiverNumber: node.receiverNumber,
				encryptionKey: node.encryptionKey,
				encryptionEnabled: node.encryptionEnabled,
				encryptionType: node.encryptionType,
			};
		};

		node.write = function (data) {
			if (!client.destroyed && client.readyState == 'open') {
				console.log('Sending data to SIA server:', data);
				client.write(data);
			}
		};

		node.close = function () {
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
