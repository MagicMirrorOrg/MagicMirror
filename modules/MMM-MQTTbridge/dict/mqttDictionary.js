var mqttHook = [
    {
      mqttTopic: "greetings/face_added",
      mqttPayload: [
        {
          mqttNotiCmd: ["Face added"]
        },
      ],
    },
    {
      mqttTopic: "greetings/face_removed",
      mqttPayload: [
        {
          mqttNotiCmd: ["Face removed"]
        },
      ],
    },
  ];
// The payload of the MQTT message must contain an array of strings called 'names'
// that contains the name of the persons that have been recognized
var mqttNotiCommands = [
    {
      commandId: "Face added",
      notiID: "FACE_ADDED"
    },
    {
      commandId: "Face removed",
      notiID: "FACE_REMOVED"
    },
  ];

  module.exports = { mqttHook,  mqttNotiCommands};
