// Const { Iconv } = require('iconv');

module.exports = function (RED) {
	const deviceSeqNumbers = new Map();
	const crypto = require('node:crypto');
	const tableCRC = require('./table_crc.js');

	function SIADeviceNode(config) {
		RED.nodes.createNode(this, config);

		// TODO: eventually we should disconnect from the server after each message as there shouldn't be a high volume of messages
		const server = RED.nodes.getNode(config.server);
		const pendingMessages = new Map();
		const siaConfig = server.getSIAConfig();
		const node = this;
		console.log('SIA Config:', siaConfig);

		// Cleanup on close

		// --- LISTENER FUNCTION ---
		const dataListener = data => {
			const response = data.toString();
			let seq; let type;

			// Format: <LF><CRC><OLLL><"ID"><seq>...
			const match = response.match(/"(\*?ACK|\*?DUH|NAK)"(\d{4})/);
			console.log('-----------------------------------------\n'
				+ '            SERVER RESPONSE                \n'
				+ '-----------------------------------------');

			console.log('Received message:', response);

			if (!match) {
				return;
			}

			type = match[1].replace('*', ''); // "ACK", "DUH", or "NAK"
			seq = match[2]; // The 4-digit sequence number as a string

			// Handle uncorrectable NAK (seq 0000), likely for a timestamp error
			if (type === 'NAK' && seq === '0000') {
				node.warn('Received uncorrelatable NAK (seq 0000). Erroring all pending requests for this node.');
				for (const [key, pending] of pendingMessages.entries()) {
					if (pending.node === node) {
						clearTimeout(pending.timeoutTimer);
						pending.node.error('Received uncorrelatable NAK (seq 0000) from server', pending.originalMsg);
						pendingMessages.delete(key);
					}
				}
				return;
			}

			if (pendingMessages.has(seq)) {
				const pending = pendingMessages.get(seq);
				if (pending.node !== node) {
					return;
				} // Just in case we ever run multiple nodes

				clearTimeout(pending.timeoutTimer);
				switch (type) {
					case 'ACK': { // Success!
						pending.node.log(`ACK received for seq ${seq}`);
						pending.node.send([null, {payload:{
							error : false,
							status : "received ACK",
							response: response
						}
						}]); // Send to second output
						break;
					}

					case 'NAK': { // NAK response
						pending.node.error(`Received NAK from server for seq ${seq}`, pending.originalMsg);
						break;
					}

					case 'DUH': { // DUH response
						pending.node.error(`Received DUH from server for seq ${seq}`, pending.originalMsg);
						break;
					}
				}

				pendingMessages.delete(seq);
			} else {
				node.log(`Received unknown or stale response for seq ${seq}`);
			}
		};

		node.on('close', done => {
			if (server) {
				server.removeListener('data', dataListener);
			}

			for (const [key, pending] of pendingMessages.entries()) {
				if (pending.node === node) {
					clearTimeout(pending.timeoutTimer);
					pendingMessages.delete(key);
				}
			}

			done();
		});

		server.connect();
		server.on('data', dataListener);

		// --- HELPER FUNCTIONS ---
		function utf8toWin1252(string_) {
			tmpBuf = Buffer.from(string_, 'utf8');
			return tmpBuf.toString('latin1');
		}

		function calculateCRCIBM16(string_) {
			data = new Buffer.from(string_);
			let {length} = data;
			let buffer = 0;
			let crc;
			while (length--) {
				crc = ((crc >>> 8) ^ (tableCRC[(crc ^ (data[buffer++])) & 0xFF]));
			}

			return crc.toString(16).padStart(4, '0').toUpperCase();
		}

		function encrypt(encryptionType, encryptionKey, string_) {
			try {
				const encryptionKeyBuf = new Buffer.from(encryptionKey, 'hex');
				const iv = new Buffer.alloc(16);
				iv.fill(0);
				const cipher = crypto.createCipheriv(encryptionType, encryptionKeyBuf, iv);
				cipher.setAutoPadding(false);
				let encoded = cipher.update(string_, 'utf8', 'hex');
				encoded += cipher.final('hex');
				return (encoded ? encoded : undefined);
			} catch {
				return undefined;
			}
		}

		function generateTimestamp() {
			const now = new Date();

			// Pad single-digit numbers with a leading zero
			const pad = number_ => number_.toString().padStart(2, '0');

			const hours = pad(now.getHours());
			const minutes = pad(now.getMinutes());
			const seconds = pad(now.getSeconds());
			const month = pad(now.getMonth() + 1); // Months are 0-indexed
			const day = pad(now.getDate());
			const year = now.getFullYear();

			return `_${hours}:${minutes}:${seconds},${month}-${day}-${year}`;
		}

		function generatePadding(data) {
			buffer = new Buffer.from(data); // We need to get byte length of the message body, not string length
			const messageLength = buffer.length;

			let padding = '';
			if (messageLength % 16 !== 0) {
				const paddingNeeded = 15 - (messageLength % 16);
				// Generate random uppercase letters (only letters) for paddingNeeded
				for (let i = 0; i < paddingNeeded; i++) {
					const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
					padding += randomChar;
				}

				// Generate byte array
				console.log('Padding needed:', paddingNeeded, 'Generated padding:', padding);
				return padding + '|';
			}

			return '';
		}

		function validateHexString(string_, stringName, minLength, maxLength) {
			if (string_.length < minLength || string_.length > maxLength) {
				console.error(`${stringName} must be between ${minLength} and ${maxLength} characters long`);
				return false;
			}

			if (string_.length > 0 && !/^[\dA-Fa-f]+$/.test(string_)) {
				console.error(`${stringName} must be hexadecimal characters only (0-9, A-F)`);
				return false;
			}

			return true;
		}

		function iterateMessageCount(id) {
			if (deviceSeqNumbers.has(id)) {
				let count = deviceSeqNumbers.get(id);
				count = (count % 9999) + 1; // Wrap around at 999
				deviceSeqNumbers.set(id, count);
			} else {
				deviceSeqNumbers.set(id, 1);
			}
		}

		// --- PROCESS NEW MESSAGE ---
		node.on('input', message => {
			console.log('-----------------------------------------\n'
				+ '            MESSAGE START                \n'
				+ '-----------------------------------------');
			const payload = message.payload;

			const deviceAccount = payload.account;
			const deviceAccountPrefix = payload.accountPrefix || '0';

			// INPUT VALIDATION
			if (!validateHexString(deviceAccount, 'Device account', 3, 16)) {
				return;
			}

			if (!validateHexString(deviceAccountPrefix, 'Device account prefix', 1, 6)) {
				return;
			}

			if (!validateHexString(siaConfig.receiverNumber, 'Receiver number', 0, 6)) {
				return;
			}

			const	deviceIdentifier = 'L' + deviceAccountPrefix + '#' + deviceAccount;

			iterateMessageCount(deviceIdentifier);

			// PART: <"id"><seq><Rrcvr><Lpref><#acct>[
			let messageBodyStart = '"'; // <"id"><seq><Rrcvr><Lpref><#acct>[
			if (siaConfig.encryptionEnabled) {
				messageBodyStart += '*';
			}

			messageBodyStart += 'SIA-DCS"'; // ID placeholder
			const seqNumber = deviceSeqNumbers.get(deviceIdentifier).toString().padStart(4, '0');

			messageBodyStart += seqNumber; // Message sequence number
			if (siaConfig.receiverNumber.length > 0) {
				messageBodyStart += 'R' + siaConfig.receiverNumber;
			}

			messageBodyStart += deviceIdentifier;
			messageBodyStart += '[';

			// PART: #<acct>|<data>][<extende data>]
			let messageBodyData = '#' + deviceAccount + '|'; // <pad>|...data...][x…data…]

			// data format
			// (N)(id-number)(DCS)(zone)
			// there's also a format of group-zone

			// messageBodyData += "Nri129^FA"; //
			messageBodyData += payload.body;
			// messageBodyData += 'Nri129/FA1234'; //
			// optional extended data can be added here, for example

			// PART: ]<timestamp>, finalization of body
			let messageBody = ''; // <"id"><seq><Rrcvr><Lpref><#acct>[<pad>|...data...][x…data…]<timestamp>
			const timestamp = generateTimestamp(); // TODO: this should be optional

			if (siaConfig.encryptionEnabled) { // Everything past [ till <CR> is to be encrypted
				let toEncrypt = messageBodyData + ']' + timestamp;
				toEncrypt = generatePadding(toEncrypt) + toEncrypt;
				messageBody = messageBodyStart + encrypt(siaConfig.encryptionType, siaConfig.encryptionKey, toEncrypt);
			} else {
				messageBody += messageBodyStart;
				messageBody += messageBodyData;
				messageBody += ']'; // End of data fields
				// optional extended data
				messageBody += timestamp;
			}

			// Append <LF><crc><>
			msgCount = (new Buffer.from(messageBody)).length;

			let message_ = '\n'; // <LF><crc><0LLL><"id"><seq><Rrcvr><Lpref><#acct>[<pad>|...data...][x…data…]<timestamp><CR>
			const crc = calculateCRCIBM16(messageBody);
			console.log("Final message CRC: ", crc);

			message_ += crc; // CRC is 4 ASCII characters
			message_ += '0' + msgCount.toString(16).toUpperCase().padStart(3, '0'); // Carriage return
			message_ += messageBody;
			message_ += '\r';

			console.log('Final message:', message_);
			console.log('Sending message to server');

			pendingMessages.set(seqNumber, {
				node,
				originalMsg: message,
				timestamp: Date.now(),
				timeoutTimer: setTimeout(() => {
					if (pendingMessages.has(seqNumber)) {
						node.error(`Timeout waiting for ACK on seq ${seqNumber}`, message);
						node.status({fill: 'red', shape: 'dot', text: 'Timeout ' + seqNumber});
						node.send([null, {
							payload: {
								error: true,
								status: 'timeout on message',
								message: message
							},
						}]);
						pendingMessages.delete(seqNumber);
					}
				}, 5000), // 5 Second timeout
			});

			node.log(`Sending SIA message seq: ${seqNumber}`);
			node.status({fill: 'blue', shape: 'dot', text: 'Sent ' + seqNumber});


			server.write(message_);

			node.send([{
				payload: {
					error: false,
					status: 'sent message',
					message: message_
				},
			}, null]); // Send to first output
		});
	}

	RED.nodes.registerType('SIA-device', SIADeviceNode);
};
