/**
 Copyright (c) since the year 2016 Klaus Landsdorf (http://plus4nodered.com/)
 Copyright 2016 - Jason D. Harper, Argonne National Laboratory
 Copyright 2015,2016 - Mika Karaila, Valmet Automation Inc.
 All rights reserved.
 node-red-contrib-modbus

 @author <a href="mailto:klaus.landsdorf@bianco-royal.de">Klaus Landsdorf</a> (Bianco Royal)
 */

/**
 * Modbus connection node.
 * @module NodeRedModbusClient
 *
 * @param RED
 */
module.exports = function (RED) {
  'use strict'
  // SOURCE-MAP-REQUIRED
  // const mbBasics = require('./modbus-basics')
  // const coreModbusClient = require('./core/SIA-server-core')
  // const coreModbusQueue = require('./core/modbus-queue-core')
  // const internalDebugLog = require('debug')('contribModbus:config:clienta')
  // const _ = require('underscore')

  function SIAServer (config) {
    RED.nodes.createNode(this, config)

		this.serverHost = config.serverHost;
		this.serverPort = parseInt(config.serverPort) || 5093;
		this.siaAccount = config.siaAccount;
		this.siaPassword = config.siaPassword;
		this.encryptionEnabled = config.encryptionEnabled || false;
		this.passwordInHex  = config.passwordInHex || false;

    // create an empty modbus clienta
    // const ModbusRTU = require('@openp4nr/modbus-serial')

    // const unlimitedListeners = 0
    // const minCommandDelayMilliseconds = 1
    // const defaultUnitId = 1
    // const defaultTcpUnitId = 0
    // const serialConnectionDelayTimeMS = 500
    // const timeoutTimeMS = 1000
    // const reconnectTimeMS = 2000
    // const logHintText = ' Get More About It By Logging'
    // const serialAsciiResponseStartDelimiter = '0x3A'
    //
    // this.clientatype = config.clientatype
    //
    // if (config.parallelUnitIdsAllowed === undefined) {
    //   this.bufferCommands = true
    // } else {
    //   this.bufferCommands = config.bufferCommands
    // }
    //
    // this.queueLogEnabled = config.queueLogEnabled
    // this.stateLogEnabled = config.stateLogEnabled
    // this.failureLogEnabled = config.failureLogEnabled
    //
    // this.tcpHost = config.tcpHost
    // this.tcpPort = parseInt(config.tcpPort) || 502
    // this.tcpType = config.tcpType
    //


    // this.serialPort = config.serialPort
    // this.serialBaudrate = config.serialBaudrate
    // this.serialDatabits = config.serialDatabits
    // this.serialStopbits = config.serialStopbits
    // this.serialParity = config.serialParity
    // this.serialType = config.serialType
    // this.serialConnectionDelay = parseInt(config.serialConnectionDelay) || serialConnectionDelayTimeMS
    // this.serialAsciiResponseStartDelimiter = config.serialAsciiResponseStartDelimiter || serialAsciiResponseStartDelimiter
    //
    // this.unit_id = parseInt(config.unit_id)
    // this.commandDelay = parseInt(config.commandDelay) || minCommandDelayMilliseconds
    // this.clientaTimeout = parseInt(config.clientaTimeout) || timeoutTimeMS
    // this.reconnectTimeout = parseInt(config.reconnectTimeout) || reconnectTimeMS
    // this.reconnectOnTimeout = config.reconnectOnTimeout
    //
    // if (config.parallelUnitIdsAllowed === undefined) {
    //   this.parallelUnitIdsAllowed = true
    // } else {
    //   this.parallelUnitIdsAllowed = config.parallelUnitIdsAllowed
    // }
    //
    // this.showErrors = config.showErrors
    // this.showWarnings = config.showWarnings
    // this.showLogs = config.showLogs
    //
    // const node = this
    // node.isFirstInitOfConnection = true
    // node.closingModbus = false
    // node.clienta = null
    // node.bufferCommandList = new Map()
    // node.sendingAllowed = new Map()
    // node.unitSendingAllowed = []
    // node.messageAllowedStates = coreModbusClient.messageAllowedStates
    // node.serverInfo = ''
    //
    // node.stateMachine = null
    // node.stateService = null
    // node.stateMachine = coreModbusClient.createStateMachineService()
    // node.actualServiceState = node.stateMachine.initialState
    // node.actualServiceStateBefore = node.actualServiceState
    // node.stateService = coreModbusClient.startStateService(node.stateMachine)
    // node.reconnectTimeoutId = 0
    // node.serialSendingAllowed = false
    // node.internalDebugLog = internalDebugLog
    //
    // coreModbusQueue.queueSerialLockCommand(node)
    //
  }

  RED.nodes.registerType('SIA-server', SIAServer)

  /* istanbul ignore next */
}
