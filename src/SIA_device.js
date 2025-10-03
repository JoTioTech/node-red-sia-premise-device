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

		const siaConfig = server.getSIAConfig();
		console.log('SIA Config:', siaConfig);


		server.connect();



		function utf8toWin1252(str) {
			tmpBuf = Buffer.from(str, 'utf8');
			return tmpBuf.toString('latin1');
		}

		function calculateCRCIBM16(str){
			data = new Buffer.from(str);
			let len = data.length;
			let buffer = 0;
			let crc;
			while (len--) {
					crc = ((crc >>> 8) ^ (tableCRC[(crc ^ (data[buffer++])) & 0xff]));
			}
			return crc.toString(16).padStart(4, '0').toUpperCase();
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
			buffer = new Buffer.from(data); // we need to get byte length of the message body, not string length
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


		function validateHexString(str, strName, minLength, maxLength){ // NOTE LGTM
			if(str.length < minLength || str.length > maxLength){
				console.error(`${strName} must be between ${minLength} and ${maxLength} characters long`);
				return false;

			}

			if(str.length !=0 &&  !/^[0-9A-Fa-f]+$/.test(str)){
				console.error(`${strName} must be hexadecimal characters only (0-9, A-F)`);
				return false;
			}
			return true;
		}

		function iterateMsgCount(id){ // NOTE LGTM
			if(!deviceMap.has(id)){
				deviceMap.set(id, 1);
			}else{
				let count = deviceMap.get(id);
				count = (count % 9999) + 1; // wrap around at 999
				deviceMap.set(id, count);
			}
		}

		// utf8toWin1252("a test ñ");


		this.on('input', message => {
			// const payload = message.payload;

			let payload = {
				"account" : "AABBCC",
				"accountPrefix" : "5678"
			}
			siaConfig.receiverNumber = "1234";

			const deviceAccount = payload.account;
			const deviceAccountPrefix = payload.accountPrefix || '0';

			// INPUT VALIDATION

			if(!validateHexString(deviceAccount, 'Device account', 3, 16)) return;
			if(!validateHexString(deviceAccountPrefix, 'Device account prefix', 1, 6)) return;
			if(!validateHexString(siaConfig.receiverNumber, 'Receiver number', 0, 6)) return;

			const	deviceIdentifier = 'L'+ deviceAccountPrefix + '#' + deviceAccount;

			iterateMsgCount(deviceIdentifier);


      // PART: <"id"><seq><Rrcvr><Lpref><#acct>[
			let messageBodyStart = '"'; // <"id"><seq><Rrcvr><Lpref><#acct>[
			if(siaConfig.encryptionEnabled)
				messageBodyStart += '*';

			messageBodyStart += 'SIA-DCS"' // ID placeholder
			messageBodyStart += deviceMap.get(deviceIdentifier).toString().padStart(4, '0'); // message sequence number
			if(siaConfig.receiverNumber.length >0)
				messageBodyStart += 'R'+siaConfig.receiverNumber;
			messageBodyStart += deviceIdentifier;
			messageBodyStart += '[';


			// PART: #<acct>|<data>
			let messageBodyData = '#'+deviceAccount + '|';  // <pad>|...data...][x…data…]

			// data format
			// (N)(id-number)(DCS)(zone)
			// there's also a format of group-zone

			messageBodyData += "NFA129"; // fire zone, 129



			// PART: ]<timestamp>, finalization of body
			let messageBody = ''; // <"id"><seq><Rrcvr><Lpref><#acct>[<pad>|...data...][x…data…]<timestamp>
			messageBody += messageBodyStart;
			messageBody += messageBodyData;
			messageBody += ']'; // end of data fields
			// optional extended data
			let timestamp = generateTimestamp(); // TODO: this should be optional
			messageBody += timestamp;

			if(siaConfig.encryptionEnabled){ // everything past [ till <CR> is to be encrypted
				messageBody = generatePadding(messageBodyData + messageBodyData + timestamp)+messageBody;
				// encrypt in AES, length depends on key length
			}




			// Append <LF><crc><>
			msgCount = (new Buffer.from(messageBody)).length; // TODO: this will not work outside of ASCII, this doesn't matter UNLESS support for extended data is added;

			let msg = '\n'; // <LF><crc><0LLL><"id"><seq><Rrcvr><Lpref><#acct>[<pad>|...data...][x…data…]<timestamp><CR>
			msg += calculateCRCIBM16(messageBody); // CRC is 4 ASCII characters
			msg += '0'+msgCount.toString(16).toUpperCase().padStart(3, '0'); // Carriage return
			msg += messageBody;
			msg += '\r';

			// print message in hex
			let hexMsg = '';
			for(let i=0; i<msg.length; i++){
				hexMsg += msg.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase() + ' ';
			}
			console.log('Final message in hex: ', hexMsg);



			server.write(msg);
		});
	}

	RED.nodes.registerType('SIA-device', SIADeviceNode);
};
