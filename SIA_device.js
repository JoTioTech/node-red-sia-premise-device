const clientModule = __importDefault(require('./src/SIA_device.js'));

module.exports = function (RED) {
	function SIADeviceNode(config) {
		RED.nodes.createNode(this, config);

		const siaSever = RED.nodes.getNode(config.server)
		const siaModule = new clientModule.default(siaSever);
		siaModule.connect();

		this.on('input', message => {
			parsedPayload = message.payload;

			// Const parser = new parserModule.default(message.statusSchema, parserConfig);
			// message.payload.outJson = parser.processPayload(parsedPayload);

			if (parsedPayload === undefined) {
				this.send(message);
				return;
			}

			if (message.payload.parsingError == true) {
				this.send(message);
				return;
			}

			this.send(message);
		});
	}

	RED.nodes.registerType('SIA-device', SIADeviceNode);

};
