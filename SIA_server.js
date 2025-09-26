module.exports = function(RED) {
    function SIAServerNode(config) {
        RED.nodes.createNode(this, config);
        // Store the configuration values
        this.name = config.name;
        this.receiverIP = config.receiverIP;
        this.receiverPort = config.receiverPort;
        this.siaAccount = config.siaAccount;
        this.siaPassword = config.siaPassword;
        this.encryptionEnabled = config.encryptionEnabled;
        this.passwordInHex = config.passwordInHex;
    }
    RED.nodes.registerType("SIA-server", SIAServerNode);
};
