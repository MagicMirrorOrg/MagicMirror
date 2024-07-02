/* eslint-disable indent */
/* global Module */

/* MagicMirror²
 * Module: MMM-MQTTbridge
 * MIT Licensed.
 */

Module.register("MMM-MQTTbridge", {
  defaults: {
    mqttDictConf: "./dict/mqttDictionary.js",
    notiDictConf: "./dict/notiDictionary.js",
    mqttServer: "mqtt://mqtt_broker:1883",
    stringifyPayload: true,
    newlineReplacement: null,
    notiConfig: {}, //default values will be set in start function
    mqttConfig: {}, //default values will be set in start function
  },

  getScripts: function () {
		return [this.file('node_modules/jsonpath-plus/dist/index-browser-umd.js')];
	},

  start: function () {
    const self = this
    Log.info("Starting module: " + self.name);
    self.config.mqttConfig = Object.assign({
      qos: 0,
      retain: false,
      clean: true,
      rejectUnauthorized: true,
      listenMqtt: false,
      interval: 300000,
      onConnectMessages: []
    },self.config.mqttConfig)
    
    self.config.notiConfig = Object.assign({
      qos: 0,
      listenNoti: false,
      ignoreNotiId: [],
      ignoreNotiSender: [],
      onConnectNotifications: []
    },self.config.notiConfig)

    self.sendSocketNotification("CONFIG", self.config);
    self.loaded = false;
    self.mqttVal = "";
    setTimeout(() => {
      self.updateMqtt();
    }, 500);
    self.cnotiHook = {}
    self.cnotiMqttCommands = {}
    self.cmqttHook = {}
    self.cmqttNotiCommands = {}
    self.ctopicsWithJsonpath = {}
    self.lastNotiValues = {}
    self.lastMqttValues = {}
  },

  isAString: function(x) {
    return Object.prototype.toString.call(x) === "[object String]"
  },

  validateCondition: function(source, value, type, lastValue){
    if (type == "eq"){
      if ((typeof source === "number") || (this.isAString(source))){
        return source === value
      } else {
        return JSON.stringify(source) === value
      }
    } else if (type == "incl"){
      if (this.isAString(source)){
        return source === value
      } else {
        return JSON.stringify(source).includes(value)
      }
    } else if (type == "mt") {
      if (this.isAString(source)){
        return new RegExp(value).test(source)
      } else {
        return new RegExp(value).test(JSON.stringify(source))
      }
    } else if (type == "lt"){
      return source < value
    } else if (type == "le"){
      return source <= value
    } else if (type == "gt"){
      return source > value
    } else if (type == "ge"){
      return source >= value
    } else if (type == "time") {
      if (lastValue != null) {
        if ((Date.now() - lastValue[1]) > value){
          return true
        } else {
          return false
        }
      } else {
        return true
      }
    } else if (type == "tdiff") {
      if (lastValue != null) {
        if (JSON.stringify(source) != lastValue[0]){
          return true
        } else {
          if (value > 0){
            if ((Date.now() - lastValue[1]) > value){
              return true
            } else {
              return false
            }
          } else {
            return false
          }
        }
      } else {
        return true
      }
    }

    return false
  },

  //https://stackoverflow.com/questions/3710204/how-to-check-if-a-string-is-a-valid-json-string
	tryParseJSONObject: function (jsonString) {
		try {
			var o = JSON.parse(jsonString);

			// Handle non-exception-throwing cases:
			// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
			// but... JSON.parse(null) returns null, and typeof null === "object",
			// so we must check for that, too. Thankfully, null is falsey, so this suffices:
			if (o && typeof o === "object") {
				return o;
			}
		}
		catch (e) { }

		return false;
	},

  updateMqtt: function () {
    const self = this
    self.sendSocketNotification("MQTT_BRIDGE_CONNECT"); //request to connect to the MQTT broker

    setTimeout(() => {
      self.updateMqtt();
    }, self.config.mqttConfig.interval);
  },

  publishNotiToMqtt: function(topic, payload, options = {}) {
    const self = this

    if (self.isAString(payload)){
      self.sendSocketNotification("MQTT_MESSAGE_SEND", {
        mqttServer: self.config.mqttServer,
        topic: topic,
        payload: payload,
        options: options
      });
    } else {
      self.sendSocketNotification("MQTT_MESSAGE_SEND", {
        mqttServer: self.config.mqttServer,
        topic: topic,
        payload: JSON.stringify(payload),
        options: options
      });
    }
  },

  mqttToNoti: function (payload) {
    const self = this
    let msg = payload.data
    let curMqttHook = self.cmqttHook[payload.topic]

    // Parse the data of the payload as a JSON and send all of it in an object
    // We suppose we only have one mqtt hook for each topic and one notification command for each hook
    let curCmdConf = self.cmqttNotiCommands[curMqttHook[0].mqttNotiCmd[0]][0]
    let value = self.tryParseJSONObject(msg)
      if (value != false) {
    self.sendNotification(curCmdConf.notiID, value)
    this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + curCmdConf.notiID + ", payload: "+ value);
    }
    // Skip the rest of the default implementation
    return;

    //if there are configured jsonpath settings for this topic we create the json object and the jsonpath values
    //this way they only get calculated once even if they are used by more than one element
    if (typeof self.ctopicsWithJsonpath[payload.topic] !== "undefined"){
      let jsonObj = self.tryParseJSONObject(msg)
      if (jsonObj != false){
        for(let curPath in self.ctopicsWithJsonpath[payload.topic]){
          let value  = JSONPath.JSONPath({ path: curPath, json: jsonObj });
          if(Array.isArray(value) && (value.length == 1)){
            value = value[0]
          }

          self.ctopicsWithJsonpath[payload.topic][curPath] = value
        }
      }
    }

    for(let curHookIdx=0; curHookIdx < curMqttHook.length; curHookIdx++){
      let curHookConfig = curMqttHook[curHookIdx]
      // {
      //   payloadValue: '{"state": "ON"}',
      //   mqttNotiCmd: ["Command 1"]
      // },
      let value = msg
      //if a jsonpath is configured in commad configuration we use the pre-calculated value now
      //if the message was not a valid JSON we still use the raw value and write a message to the log instead
      if(typeof curHookConfig.jsonpath !== "undefined") {
        value = self.ctopicsWithJsonpath[payload.topic][curHookConfig.jsonpath]
        if(value == null){
          this.sendSocketNotification("LOG","[MQTT bridge] Invalid JSON: There is configured a jsonpath setting for topic "+payload.topic + " but the message: "+msg+" is not a valid JSON. Using original value instead!");
          value = msg
        }
      }

      //now we need to replace all new lines in the message if "newlineReplacement" is configured
      //either in the global option or special in this configuration
      if (typeof curHookConfig.valueFormat !== "undefined") {
        let newlineReplacement = curHookConfig.newlineReplacement || self.config.newlineReplacement
        if (newlineReplacement != null) {
          value = String(value).replace(/(?:\r\n|\r|\n)/g, newlineReplacement)
        }
        value = eval(eval("`" + curHookConfig.valueFormat + "`"))
      }

      //now that we have the parsed and replaced value we can check if the payloadValue is matched (if payloadValue is present)
      if ( 
        (typeof curHookConfig.payloadValue === "undefined") ||
        (curHookConfig.payloadValue == value)
      ){
        //if additional conditions are configured we will now check if all of them match
        //only if all of them match further processing is done
        let conditionsValid = true
        if (typeof curHookConfig.conditions !== "undefined"){
          let curLastValues = self.lastMqttValues[payload.topic][curHookIdx] || null
          for(let curCondIdx = 0; curCondIdx < curHookConfig.conditions.length; curCondIdx++){
            let curCondition = curHookConfig.conditions[curCondIdx]
            if((typeof curCondition["type"] !== "undefined") && (typeof curCondition["value"] !== "undefined")){
              if(!self.validateCondition(value,curCondition["value"],curCondition["type"],curLastValues)){
                conditionsValid = false
                break
              }
            }
          }
        }

        //if all preconditions met we process the command configurations now
        if (conditionsValid){
          self.lastMqttValues[payload.topic][curHookIdx] = [JSON.stringify(value), Date.now()]
          let mqttCmds = curHookConfig.mqttNotiCmd || []
          for(let curCmdIdx = 0; curCmdIdx < mqttCmds.length; curCmdIdx++){
            let curCmdConfigs = self.cmqttNotiCommands[mqttCmds[curCmdIdx]]
            for(let curCmdConfIdx = 0; curCmdConfIdx < curCmdConfigs.length; curCmdConfIdx++){
              let curCmdConf = curCmdConfigs[curCmdConfIdx]
              // {
              //   commandId: "Command 1",
              //   notiID: "REMOTE_ACTION",
              //   notiPayload: {action: 'MONITORON'}
              // },
              if (typeof curCmdConf.notiID !== "undefined"){
                if (typeof curCmdConf.notiPayload === "undefined") {
                  self.sendNotification(curCmdConf.notiID, value)
                  this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + curCmdConf.notiID + ", payload: "+ value);
                } else {
                  self.sendNotification(curCmdConf.notiID, curCmdConf.notiPayload)
                  this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI issued: " + curCmdConf.notiID + ", payload: "+ JSON.stringify(curCmdConf.notiPayload));
                }
              } else {
                this.sendSocketNotification("LOG","[MQTT bridge] MQTT -> NOTI error: Skipping notification cause \"notiID\" is missing. "+JSON.stringify(curCmdConf));
              }
            }
          }
        }
      }
    }
  },

  notiToMqtt: function(notification, payload) {
    const self = this
    let curNotiHooks = self.cnotiHook[notification]
    for(let curHookIdx = 0; curHookIdx < curNotiHooks.length; curHookIdx++){
      let curHookConfig = curNotiHooks[curHookIdx]
      // {
      //   payloadValue: true, 
      //   notiMqttCmd: ["SCREENON"]
      // },

      //now we need to replace all new lines in the message if "newlineReplacement" is configured
      //either in the global option or special in this configuration
      let value = payload
      if (typeof curHookConfig.valueFormat !== "undefined") {
        let newlineReplacement = curHookConfig.newlineReplacement || self.config.newlineReplacement
        if (newlineReplacement != null) {
          value = String(value).replace(/(?:\r\n|\r|\n)/g, newlineReplacement)
        }
        value = eval(eval("`" + curHookConfig.valueFormat + "`"))
      }

      if ( 
        (typeof curHookConfig.payloadValue === "undefined") ||
        (JSON.stringify(curHookConfig.payloadValue) == JSON.stringify(value))
      ){
        //if additional conditions are configured we will now check if all of them match
        //only if all of them match further processing is done
        let conditionsValid = true
        if (typeof curHookConfig.conditions !== "undefined"){
          let curLastValues = self.lastNotiValues[notification][curHookIdx] || null
          for(let curCondIdx = 0; curCondIdx < curHookConfig.conditions.length; curCondIdx++){
            let curCondition = curHookConfig.conditions[curCondIdx]
            if(typeof curCondition["type"] !== "undefined"){
              if (typeof curCondition["value"] !== "undefined") {
                if(!self.validateCondition(value,curCondition["value"],curCondition["type"],curLastValues)){
                  conditionsValid = false
                  break
                }
              }
            }
          }
        }

        //if all preconditions met we process the command configurations now
        if(conditionsValid){
          self.lastNotiValues[notification][curHookIdx] = [JSON.stringify(value),Date.now()]
          let notiCmds = curHookConfig.notiMqttCmd || []
          for(let curCmdIdx = 0; curCmdIdx < notiCmds.length; curCmdIdx++){
            let curCmdConfigs = self.cnotiMqttCommands[notiCmds[curCmdIdx]]
            for(let curCmdConfIdx = 0; curCmdConfIdx < curCmdConfigs.length; curCmdConfIdx++){
              let curCmdConf = curCmdConfigs[curCmdConfIdx]
              // {
              //   commandId: "SCREENON",
              //   mqttTopic: "magicmirror/state",
              //   mqttMsgPayload: '{"state":"ON"}',
              //   options: {"qos": 1, "retain": false},
              //   retain: true,
              //   qos: 0
              // },
              if (typeof curCmdConf.mqttTopic !== "undefined"){
                let curStringifyPayload
                if(typeof curCmdConf.stringifyPayload !== "undefined"){
                  curStringifyPayload = curCmdConf.stringifyPayload
                } else {
                  curStringifyPayload = self.config.stringifyPayload
                }
                let msg
                if (typeof curCmdConf.mqttMsgPayload === "undefined") {
                  if(curStringifyPayload){
                    msg = JSON.stringify(value)
                  } else {
                    msg = value
                  }
                } else {
                  if(curStringifyPayload){
                    msg = JSON.stringify(curCmdConf.mqttMsgPayload)
                  } else {
                    msg = curCmdConf.mqttMsgPayload
                  }
                }

                let curOptions = curCmdConf.options || {}
                
                if (typeof curCmdConf.retain !== "undefined"){
                  curOptions["retain"] = curCmdConf.retain
                } else {
                  curOptions["retain"] = self.config.mqttConfig.retain
                }
                if (typeof curCmdConf.qos !== "undefined"){
                  curOptions["qos"] = curCmdConf.qos
                } else {
                  curOptions["qos"] = self.config.mqttConfig.qos
                }

                self.publishNotiToMqtt(curCmdConf.mqttTopic, msg, curOptions);
              } else {
                this.sendSocketNotification("LOG","[MQTT bridge] NOTI -> MQTT error: Skipping mqtt publish cause \"mqttTopic\" is missing. " + JSON.stringify(curCmdConf));
              }
            }
          }
        }
      }
    }
  },

  socketNotificationReceived: function (notification, payload) {
    const self = this
    switch (notification) {
      // START MQTT to NOTI logic
      case "MQTT_MESSAGE_RECEIVED":
        self.mqttToNoti(payload);
        break;
      // END of MQTT to NOTI logic
      case "ERROR":
        self.sendNotification("SHOW_ALERT", payload);
        break;
      case "DICTIONARIES": //use dictionaries from external files at module sturt-up
        self.cnotiHook = payload.cnotiHook;
        self.cnotiMqttCommands = payload.cnotiMqttCommands;
        self.cmqttHook = payload.cmqttHook;
        self.cmqttNotiCommands = payload.cmqttNotiCommands;
        self.ctopicsWithJsonpath = payload.ctopicsWithJsonpath;

        for (let curNotification in self.cnotiHook) {
          self.lastNotiValues[curNotification] = {};
        }

        for (let curTopic in self.cmqttHook) {
          self.lastMqttValues[curTopic] = {};
        }
        break;
      case "CONNECTED_AND_SUBSCRIBED":
        for (let curMsg of self.config.mqttConfig.onConnectMessages){
          self.publishNotiToMqtt(curMsg.topic, curMsg.msg, curMsg.options || {})
        }
        
        for (let curNoti of self.config.notiConfig.onConnectNotifications){
          if (typeof curNoti.payload !== "undefined"){
            self.sendNotification(curNoti.notification, curNoti.payload)
          } else {
            self.sendNotification(curNoti.notification)
          }
        }
    }
  },

  notificationReceived: function (notification, payload, sender) {
    const self = this
    // START of NOTIFICATIONS to MQTT logic

    // Filtering...
    if (!self.config.notiConfig.listenNoti) { return; } // check whether we need to listen for the NOTIFICATIONS. Return if "false"
    var sndname = "system"; //sender name default is "system"

    if (!sender === false) { sndname = sender.name; }; //if no SENDER specified in NOTIFICATION, the SENDER is left as "system" (according to MM documentation), otherwise - use sender name
    
    // exclude NOTIFICATIONS where SENDER in ignored list
    for (var x in self.config.notiConfig.ignoreNotiSender) 
    {
      if (sndname == self.config.notiConfig.ignoreNotiSender[x]) { return; }
    }
    // exclude NOTIFICATIONS where NOTIFICATION ID in ignored list
    for (var x in self.config.notiConfig.ignoreNotiId) 
    {
      if (notification == self.config.notiConfig.ignoreNotiId[x]) { return; }
    }

    if (typeof self.cnotiHook[notification] !== "undefined"){
      if (typeof payload !== "undefined"){
        self.notiToMqtt(notification, payload);
      } else {
        self.notiToMqtt(notification, "");
      }
    }
  }
  // END of NOTIFICATIONS to MQTT logic
});
