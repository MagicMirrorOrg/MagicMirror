
var notiHook = [
  {
    notiId: "USER_PRESENCE",
    notiPayload: [
      {
        payloadValue: true, 
        notiMqttCmd: ["SCREENON"]
      },
      {
        payloadValue: false, 
        notiMqttCmd: ["SCREENOFF"]
      },
    ],
  },
  {
    notiId: "INDOOR_TEMPERATURE",
    notiPayload: [
      {
        payloadValue: '', 
        notiMqttCmd: ["Command 2"]
      },
    ],
  },
];
var notiMqttCommands = [
    {
    commandId: "SCREENON",
    mqttTopic: "magicmirror/state",
    mqttMsgPayload: '{"state":"ON"}'
    },
    {
    commandId: "SCREENOFF",
    mqttTopic: "magicmirror/state",
    mqttMsgPayload: '{"state":"OFF"}'
  },
  {
    commandId: "Command 1",
    mqttTopic: "magicmirror/state",
    mqttMsgPayload: '{"state":"OFF"}'
  },
  {
    commandId: "Command 2",
    mqttTopic: "magicmirror/state",
    mqttMsgPayload: ''
  },
];

module.exports = { notiHook, notiMqttCommands };
