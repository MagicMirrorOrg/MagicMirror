# JSONPath-plus

As of version 2.1 of the module it is possible to parse the MQTT messages as JSON and select single values of the JSON with [JSONPath-Plus](https://github.com/JSONPath-Plus/JSONPath).

:warning:
If the MQTT message is not a valid JSON the parsing will fail and so does the [JSONPath-Plus](https://github.com/JSONPath-Plus/JSONPath) selection. As a result the raw message will be further processed!

You can define the `jsonpath` option for `mqttPayload` elements in the `mqttDictionary.js` like in the following example:

```js
    {
        mqttTopic: "test/test1",
        mqttPayload: [
            {
                jsonpath: "output",
                mqttNotiCmd: ["Command 0"]
            },
            {
                jsonpath: "output2",
                mqttNotiCmd: ["Command 1"]
                payloadValue: '{"state": "ON"}',
            },
            {
                jsonpath: "output2",
                mqttNotiCmd: ["Command 2"]
                payloadValue: '{"state": "OFF"}',
            },
        ],
    },
```

Lets assume the message looks like:

```json
{
    "output": 10.1,
    "output2": {
        "state": "OFF"
    }
}
```

With the above configuration this will be the result:

* The messages of the topic `test/test1` will be processed
* `Command 0` will be called with `10.1` cause no `payloadValue` is specified to compare the value to
* `Command 1` will NOT be called as the value of `output2` is `{"state": "OFF"}`
* `Command 2` will be called as the value of `output2` is `{"state": "OFF"}`

Lets look at a second example...

The configuration is:

```js
    {
        mqttTopic: "test/test1",
        mqttPayload: [
            {
                jsonpath: "output.myValue",
                mqttNotiCmd: ["Command 0"]
            },
        ],
    },
```

Lets assume the message looks like:

```json
{
    "output": {
        "myValue": 10.1,
    },
    "output2": {
        "state": "OFF"
    }
}
```

The result will be:

* The messages of the topic `test/test1` will be processed
* `Command 0` will be called with `10.1` cause no `payloadValue` is specified to compare the value to

For the full power of the selection mechanism please look at the [JSONPath-Plus](https://github.com/JSONPath-Plus/JSONPath) page.