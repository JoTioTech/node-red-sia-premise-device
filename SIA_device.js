const clientModule = __importDefault(require('./src/SIA_device.js'));


module.exports = function (RED) {


	function ParserNode(config) {
		RED.nodes.createNode(this, config);

		this.serverConfig = RED.nodes.getNode(config.server);
		const siaModule = new clientModule.default(serverConfig);
		siaModule.connect();

		this.on('input', message => {
			parsedPayload = message.payload;


				// const parser = new parserModule.default(message.statusSchema, parserConfig);
				// message.payload.outJson = parser.processPayload(parsedPayload);


			if(parsedPayload === undefined){
				this.send(message);
				return;
			}
			if(message.payload.parsingError == true){
				this.send(message);
				return;
			}

			this.send(message);
		});
	}

	RED.nodes.registerType('SIA-device', ParserNode);
	RED.nodes.registerType('SIA-server', require('./sia-server.js'));


};




