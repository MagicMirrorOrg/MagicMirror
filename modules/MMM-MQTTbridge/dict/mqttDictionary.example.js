var mqttHook = [
    {
      mqttTopic: "myhome/smartmirror/led/set",
      mqttPayload: [
        {
          payloadValue: '{"state": "ON"}',
          mqttNotiCmd: ["Command 1"]
        },
        {
          payloadValue: '{"state": "OFF"}',
          mqttNotiCmd: ["Command 2"]
        },
      ],
    },
    {
      mqttTopic: "magicmirror/state",
      mqttPayload: [
        {
          payloadValue: "1",
          mqttNotiCmd: ["Command 1", "Command 2"]
        },
      ],
    },
  ];
var mqttNotiCommands = [
    {
      commandId: "Command 1",
      notiID: "REMOTE_ACTION",
      notiPayload: {action: 'MONITORON'}
    },
    {
      commandId: "Command 2",
      notiID: "REMOTE_ACTION",
      notiPayload: {action: 'MONITOROFF'}
    },
  ];

  module.exports = { mqttHook,  mqttNotiCommands};
