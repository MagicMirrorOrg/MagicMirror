# Module: Greetings

The purpose of the `greetings` module is to display a message to greet a certain person whenever a notification "FACE_ADDED" is received.

It works alongside the MMM-MQTTbridge module that subscribes to certain topics of a MQTT broker.
For example: if a MQTT message with topic `greetings/face_added` is received, the linked command will be executed. In this case the command `Face added` will be executed which will send a `FACE_ADDED` notification to all modules. This notification will then be intercepted by this module.
