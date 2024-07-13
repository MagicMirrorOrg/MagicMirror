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
    {
      mqttTopic: "temperature/internal",
      mqttPayload: [
        {
          mqttNotiCmd: ["Internal Temperature"]
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
    {
      commandId: "Internal Temperature",
      notiID: "INDOOR_TEMPERATURE"
    },
  ];

  module.exports = { mqttHook,  mqttNotiCommands};
