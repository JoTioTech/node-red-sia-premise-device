// const { Iconv } = require('iconv');
 const tableCRC = [
        0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241,
0xc601, 0x06c0, 0x0780, 0xc741, 0x0500, 0xc5c1, 0xc481, 0x0440,
0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841,
0xd801, 0x18c0, 0x1980, 0xd941, 0x1b00, 0xdbc1, 0xda81, 0x1a40,
0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641,
0xd201, 0x12c0, 0x1380, 0xd341, 0x1100, 0xd1c1, 0xd081, 0x1040,
0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441,
0x3c00, 0xfcc1, 0xfd81, 0x3d40, 0xff01, 0x3fc0, 0x3e80, 0xfe41,
0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41,
0xee01, 0x2ec0, 0x2f80, 0xef41, 0x2d00, 0xedc1, 0xec81, 0x2c40,
0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041,
0xa001, 0x60c0, 0x6180, 0xa141, 0x6300, 0xa3c1, 0xa281, 0x6240,
0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41,
0xaa01, 0x6ac0, 0x6b80, 0xab41, 0x6900, 0xa9c1, 0xa881, 0x6840,
0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40,
0xb401, 0x74c0, 0x7580, 0xb541, 0x7700, 0xb7c1, 0xb681, 0x7640,
0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241,
0x9601, 0x56c0, 0x5780, 0x9741, 0x5500, 0x95c1, 0x9481, 0x5440,
0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841,
0x8801, 0x48c0, 0x4980, 0x8941, 0x4b00, 0x8bc1, 0x8a81, 0x4a40,
0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641,
0x8201, 0x42c0, 0x4380, 0x8341, 0x4100, 0x81c1, 0x8081, 0x4040
    ];

const deviceMap = new Map();


module.exports = function (RED) {
	function SIADeviceNode(config) {
		RED.nodes.createNode(this, config);

		// TODO: eventually we should disconnect from the server after each message as there shouldn't be a high volume of messages
		const server = RED.nodes.getNode(config.server);
		server.connectClient();

		const siaConfig = server.getSIAConfig();
		console.log('SIA Config:', siaConfig);


		function utf8toWin1252(str) {
			tmpBuf = Buffer.from(str, 'utf8');
			return tmpBuf.toString('latin1');
		}

		function calculateCRCIBM16(data){
			buffer = ArrayBuffer.from(data);
			let crc = 0x0000;
			for( const byte of buffer ){
				crc = crc >>> 8 ^ tableCRC[ ( crc ^ byte ) & 0xff ];
			}
			return crc;
		}

		function generateTimestamp(){
			const now = new Date();

			// Pad single-digit numbers with a leading zero
			const pad = (num) => num.toString().padStart(2, '0');

			const hours = pad(now.getHours());
			const minutes = pad(now.getMinutes());
			const seconds = pad(now.getSeconds());
			const month = pad(now.getMonth() + 1); // Months are 0-indexed
			const day = pad(now.getDate());
			const year = now.getFullYear();

			return `_${hours}:${minutes}:${seconds},${month}-${day}-${year}`;

		}

		function generatePadding(data){
			buffer = ArrayBuffer.from(data); // we need to get byte length of the message body, not string length
			let msgLength = buffer.length.toString(16).toUpperCase().padStart(3, '0');

			let padding = '';
			if(msgLength % 16 !== 0){
				const paddingNeeded = 16 - (msgLength % 16);
				// generate random uppercase letters (only letters) for paddingNeeded
				for(let i=0; i<paddingNeeded; i++){
					const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
					padding += randomChar;
				}
				// generate byte array
				console.log('Padding needed:', paddingNeeded, 'Generated padding:', padding);
			}

		}

		// utf8toWin1252("a test ñ");


		this.on('input', message => {
			// const payload = message.payload;

			let payload = {
				"events" : [
					{
						"CSD": "FA",
						"new" : true,
						"zone" : 2,
					}
				]

			}

			payload = {
				"events" : [
					{
						"group" : 0
					}
				]
			}
			const deviceAccount = message.account;
			const deviceAccountPrefix = message.accountPrefix || '0';

			// INPUT VALIDATION

			if(deviceAccount.length < 3 || deviceAccount.length > 16){ // between 3 and 16 characters
				this.error('Device account must be between 3 and 16 characters long');
				return;
			}
			if(!/^[0-9A-Fa-f]+$/.test(deviceAccount)){ // hexadecimal characters only
				this.error('Device account must be hexadecimal characters only (0-9, A-F)');
				return;
			}
			if(deviceAccount.length < 1 || deviceAccount.length > 6){ // between 1 and 6 characters
				this.error('Device account must be between 3 and 16 characters long');
				return;
			}
			if(!/^[0-9A-Fa-f]+$/.test(deviceAccountPrefix)){ // hexadecimal characters only
				this.error('Device account prefix must be "L" followed by 1 to 6 digits (e.g. L0, L123456)');
				return;
			}



			// PAYLOAD CREATION

			// deviceAccountprefix must be L followed by 1-6 digits
			// deviceAccount must be # followed by 3-16 HEX digits

			const deviceIdentifier = 'L'+ deviceAccountPrefix + '#' + deviceAccount;

			if(!deviceMap.has(deviceIdentifier)){
				deviceMap.set(deviceIdentifier, 1);
			}else{
				let count = deviceMap.get(deviceIdentifier);
				count = (count % 9999) + 1; // wrap around at 999
				deviceMap.set(deviceIdentifier, count);
			}



      // <"id"><seq><Rrcvr><Lpref><#acct>[ (ends before first data field)
			let messageBodyStart = '"';
			if(siaConfig.encryptionEnabled){
				messageBodyStart += '*';
			}

			messageBodyStart += 'SIA-DCS"' // ID placeholder
			messageBodyStart += deviceMap.get(deviceIdentifier).toString().padStart(4, '0'); // message sequence number
			messageBodyStart += deviceIdentifier;
			messageBodyStart += '[';
			let timestamp = generateTimestamp();



			// messageBody += 0x00 // Padding placeholder
			// messageBody += '|';

			let messageBodyData = '#'+deviceAccount + '|'; // before this there might be padding

			// data format
			// (N)(id-number)(DCS)(zone)
			// there's also a format of group-zone








			// check if we need to pad the payload





			// PAYLOAD FINALIZATION


			/// form message body, pad in case it's needed
			let messageBody = '';

			if(siaConfig.encryptionEnabled){
				messageBody += generatePadding(messageBodyData + messageBodyData + timestamp);
			}
			messageBody += messageBodyStart;
			messageBody += messageBodyData;
			messageBody += ']'; // end of data fields
			// optional extended data
			messageBody += timestamp;

			if(siaConfig.encryptionEnabled){

				// encrypt in AES, length depends on key length
			}




			// creation of final message
			msgCount = ArrayBuffer.from(messageBody).length;
			let message = 0x0A;
			message += calculateCRCIBM16(messageBody);
			message += '0'+msgCount; // Carriage return
			message += messageBody;
			message += '\r';

			// this.send(message);
		});
	}

	RED.nodes.registerType('SIA-device', SIADeviceNode);
};
