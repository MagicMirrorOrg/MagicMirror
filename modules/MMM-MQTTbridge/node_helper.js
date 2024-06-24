/* eslint-disable indent */
'use strict';

/* MagicMirror²
 * Module: MMM-MQTTbridge
 * MIT Licensed.
 */

const NodeHelper = require('node_helper');
const mqtt = require('mqtt');

const fs = require('fs')
const path = require('path')
const moduleDir = __dirname

module.exports = NodeHelper.create({
  start: function () {
    const self = this;
    console.log('[MQTT bridge] Module started');
    self.clients = [];
    self.started = false;
    self.config = {};

    self.notiHook = {}
    self.notiMqttCommands = {}
    self.mqttHook = {}
    self.mqttNotiCommands = {}
    self.converted = {}
    self.converted.notiHook = {}
    self.converted.notiMqttCommands = {}
    self.converted.mqttHook = {}
    self.converted.topicsWithJsonpath = {}
    self.converted.notisWithJsonpath = {}
    self.converted.mqttNotiCommands = {}
  },

  connectMqtt: function () {
    const self = this;
    if (self.started){
      var client;

      if (typeof self.clients[self.config.mqttServer] === "undefined" || self.clients[self.config.mqttServer].connected == false) {
        let options = { "clean": self.config.mqttConfig.clean }
        if (typeof self.config.mqttConfig.will !== "undefined"){
          options["will"] = self.config.mqttConfig.will
        }

        if (typeof self.config.mqttConfig.clientId !== "undefined"){
          options["clientId"] = self.config.mqttConfig.clientId
        }

        options = Object.assign(options, self.config.mqttConfig.options)

        if (typeof self.config.mqttConfig.mqttClientKey === "undefined"){
          console.log("[MQTT bridge] MQTT broker uses unencrypted connection with options: "+JSON.stringify(options));
          client = mqtt.connect(self.config.mqttServer, options);
        } else {
          if (typeof self.config.mqttConfig.mqttClientKey !== "undefined") {
            options["key"] = fs.readFileSync(self.config.mqttConfig.mqttClientKey);
          }

          if (typeof self.config.mqttConfig.mqttClientCert !== "undefined") {
            options["cert"] = fs.readFileSync(self.config.mqttConfig.mqttClientCert);
          }

          if (typeof self.config.mqttConfig.caCert !== "undefined") {
            options["ca"] = fs.readFileSync(self.config.mqttConfig.caCert);
          }

          options["rejectUnauthorized"] = self.config.mqttConfig.rejectUnauthorized;

          console.log("[MQTT bridge] MQTT broker uses encrypted connection with options: "+JSON.stringify(options));
          client = mqtt.connect(self.config.mqttServer, options);
        }

        self.clients[self.config.mqttServer] = client;

        client.on('connect', function () {
          if (self.config.mqttConfig.listenMqtt){
            for (var i = 0; i < self.mqttHook.length; i++) {
              let curQos = self.mqttHook[i].qos || self.config.mqttConfig.qos
              let curOptions = self.mqttHook[i].options || {}
              curOptions["qos"] = curQos
              client.subscribe(self.mqttHook[i].mqttTopic, curOptions);
              console.log("[MQTT bridge] Subscribed to the topic: " + self.mqttHook[i].mqttTopic +" with options: "+JSON.stringify(curOptions));
            }
          }

          self.sendSocketNotification('CONNECTED_AND_SUBSCRIBED')
        })

        client.on('error', function (error) { //MQTT library function. Returns ERROR when connection to the broker could not be established.
          console.log("[MQTT bridge] MQTT broker error: " + error);
          self.sendSocketNotification('ERROR', { type: 'notification', title: '[MMM-MQTTbridge]', message: 'MQTT broker rised the following error: ' + error });
        });

        client.on('offline', function () { //MQTT library function. Returns OFFLINE when the client (our code) is not connected.
          console.log("[MQTT bridge] Could not establish connection to MQTT broker");
          self.sendSocketNotification('ERROR', { type: 'notification', title: '[MMM-MQTTbridge]', message: "MQTT broker can't be reached" });
          client.end();
        });

        client.on('message', function (topic, message) {  //MQTT library function. Returns message topic/payload when it arrives to subscribed topics.
          console.log('[MQTT bridge] MQTT message received. Topic: ' + topic + ', message: ' + message);
          self.sendSocketNotification('MQTT_MESSAGE_RECEIVED', { 'topic': topic, 'data': message.toString() }); // send mqtt mesage payload for further converting to NOTI to MMM-MQTTbridge.js file
        });

      } else {
        client = self.clients[self.config.mqttServer];
      }
    } else {
      setTimeout(() => {
        self.connectMqtt();
      }, 500);
    }
  },

  // check all messages arrived from MMM-MQTTbridge.js
  socketNotificationReceived: function (notification, payload) {
    const self = this
    switch (notification) {
      case 'MQTT_BRIDGE_CONNECT': //case which appear at sturt-up.It sends pre-read arrays of custom dictionaries
        self.connectMqtt();
        self.sendSocketNotification("DICTIONARIES", { "cnotiHook": self.converted.notiHook,
                                                      "cmqttHook": self.converted.mqttHook,
                                                      "cnotiMqttCommands": self.converted.notiMqttCommands,
                                                      "cmqttNotiCommands": self.converted.mqttNotiCommands,
                                                      "ctopicsWithJsonpath": self.converted.topicsWithJsonpath
                                                    });
        break;
      case 'MQTT_MESSAGE_SEND': // if this message arrived, commands below send MQTT message using payload information
        var client = self.clients[payload.mqttServer];
        if (typeof client !== "undefined") {
          client.publish(payload.topic, payload.payload, payload.options || {});
        };
        console.log("[MQTT bridge] NOTI->MQTT. Topic: " + payload.topic + ", payload: " + payload.payload);
        break;
      case 'LOG':
        console.log(payload); //just to display LOG in Terminal, not console.
        break;
      case 'CONFIG':
        if ( self.started === false) {
          self.config = payload
          self.started = true

          let notiDictPath = path.join(moduleDir,self.config.notiDictConf)
          try{
            console.log("[MQTT bridge] Info: Reading notification configuration: "+notiDictPath)
            const { notiHook, notiMqttCommands } = require(notiDictPath); //read the custom NOTI->MQTT rules from external files (they are in a config.notiDictionary )
            self.notiHook = notiHook
            self.notiMqttCommands = notiMqttCommands
          } catch {
            console.log("[MQTT bridge] ERROR: Could not read configuration "+notiDictPath+". Starting without configuration!")
          }

          let mqttDictPath = path.join(moduleDir,self.config.mqttDictConf)
          try{
            console.log("[MQTT bridge] Info: Reading mqtt configuration: "+mqttDictPath)
            const { mqttHook, mqttNotiCommands } = require(mqttDictPath); //read the custom NOTI->MQTT rules from external files (they are in a config.notiDictionary )
            self.mqttHook = mqttHook
            self.mqttNotiCommands = mqttNotiCommands
          } catch {
            console.log("[MQTT bridge] ERROR: Could not read configuration "+mqttDictPath+". Starting without configuration!")
          }

          for (let idx = 0; idx < self.notiHook.length; idx ++){
            let curId = self.notiHook[idx].notiId || null
            if ((curId != null) && (typeof self.notiHook[idx].notiPayload !== "undefined")){
              let curArray = self.converted.notiHook[curId] || []
              curArray = curArray.concat(self.notiHook[idx].notiPayload)
              self.converted.notiHook[curId] = curArray
            }
          }
      
          for (let idx = 0; idx < self.notiMqttCommands.length; idx ++){
            let curId = self.notiMqttCommands[idx].commandId || null
            if (curId != null){
              let curArray = self.converted.notiMqttCommands[curId] || []
              curArray.push(self.notiMqttCommands[idx])
              self.converted.notiMqttCommands[curId] = curArray
            }
          }
      
          for (let idx = 0; idx < self.mqttHook.length; idx ++){
            let curId = self.mqttHook[idx].mqttTopic || null
            if ((curId != null) && (typeof self.mqttHook[idx].mqttPayload !== "undefined")){
              let curArray = self.converted.mqttHook[curId] || []
              curArray = curArray.concat(self.mqttHook[idx].mqttPayload)
              self.converted.mqttHook[curId] = curArray

              for (let curPayloadIdx = 0; curPayloadIdx < self.mqttHook[idx].mqttPayload.length; curPayloadIdx++){
                let curPayloadObj = self.mqttHook[idx].mqttPayload[curPayloadIdx]
                if(typeof curPayloadObj.jsonpath !== "undefined"){
                  
                  let curResultObj = self.converted.topicsWithJsonpath[curId] || {}
                  curResultObj[curPayloadObj.jsonpath] = null
                  self.converted.topicsWithJsonpath[curId] = curResultObj
                }
              }
            }
          }
      
          for (let idx = 0; idx < self.mqttNotiCommands.length; idx ++){
            let curId = self.mqttNotiCommands[idx].commandId || null
            if (curId != null){
              let curArray = self.converted.mqttNotiCommands[curId] || []
              curArray.push(self.mqttNotiCommands[idx])
              self.converted.mqttNotiCommands[curId] = curArray
            }
          }
        }
    }
  }
});
