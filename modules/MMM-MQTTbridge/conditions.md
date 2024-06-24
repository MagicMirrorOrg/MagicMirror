# Conditions

As of version 2.1 of the module it is possible to configure complex conditions instead of a simple compare to deceide which commands shuld be called depending of the content of notification payloads or MQTT messages.

As the compare is done after selecting elements with jsonpath (look to [jsonpath.md](jsonpath.md) for further details ) and after the value formatting (look to [valueFormat.md](valueFormat.md) for further details) you only need to care about the current pre-processed value at this point.

You can define the `conditions` option for `mqttPayload` elements in the `mqttDictionary.js` or in the elments of `notiPayload` in `notiDictionary.js` like in the following examples:

```js
    mqttPayload: [
        {
          jsonpath: "output.myValue",
          valueFormat: "{value}",
          conditions: [
            {
              type: "gt",
              value: 10.1
            },
            {
              type: "lt",
              value: 12.1
            }
          ],
          mqttNotiCmd: ["Command 0"]
        },
    ],
```

```js
    notiPayload: [
        {
            newlineReplacement: "#",
            valueFormat: "\"${value}\".replace(\"test\",\"\").replace(\"abc\",\"\")",
            conditions: [
              {
                type: "tdiff",
                value: 30000
              },
            ],
            notiMqttCmd: ["Command 0"],
        }
    ]
```

:information_source: All conditions defined need to match for the commands to be processed (AND condition)!

The following types are possible:

* `lt` - The current value needs to be lower than the configured one
* `le` - The current value needs to be lower or equal than the configured one
* `gt` - The current value needs to be greater than the configured one
* `ge` - The current value needs to be greater or equal than the configured one
* `eq` - The current value needs to be equal to the configured one
* `incl` - The current value needs to include the configured one
* `mt` - The current value needs to match the configured [Regex pattern](https://www.w3schools.com/jsref/jsref_obj_regexp.asp)
* `time` - Only send the message / notification if the time between the last send one and the current one is greater than the amount of milliseconds configured
* `tdiff`- Only send the message / notification if the current value is different to the last send one or if the configured amount of milliseconds is reached. If the `value` is set to `0` or lower the time does not matter and the values only message / notification will only be send if the content changed

Let's look at some examples now.

Let us assume we do have the following MQTT message configuration:

```js
    mqttPayload: [
        {
          conditions: [
            {
              type: "gt",
              value: 10.1
            },
            {
              type: "lt",
              value: 12.1
            }
          ],
          mqttNotiCmd: ["Command 0"]
        },
    ],
```

Now we receive the message with the payload:

```js
10.2
```

As the value is greater than 10.1 and lower than 12.1 the command `Command 0` will be initiated.

Now we receive the message with the payload:

```js
12.2
```

As the value is greater than 12.2 nothing will happen.

Let us assume we do have the following MQTT message configuration:

```js
    mqttPayload: [
        {
          conditions: [
            {
              type: "mt",
              value: ".*test[2-4].*"
            },
          ],
          mqttNotiCmd: ["Command 0"]
        },
    ],
```

Now we receive the message with the payload:

```text
mystringstart test123abc
```

Although the string has a sub string that starts with `test` nothing will happen cause only if `test` is followed by the digits `2`, `3` or `4` the string matches.

Now we receive the message with the payload:

```text
myotherstringtest test24 and some more text
```

As the string `test` is followed by `2` the command `Command 0` is issued.

Let us assume we do have the following Notification configuration:

```js
    notiPayload: [
        {
            conditions: [
              {
                type: "tdiff",
                value: 30000
              },
            ],
            notiMqttCmd: ["Command 0"],
        }
    ]
```

If we receive a notification `test` the notiMqttCmd `Command 0` will be initiated.  
If we receive a notification `test` with a different payload the `Command 0` will be initiated again.  
If we receive a notification `test` with the same payload WITHIN 30 seconds the command `Command 0` will NOT be initated.  
If we receive a notification `test` with the same payload AFTER 30 seconds the command `Command 0` will be initiated.  

Let us assume we do have the following Notification configuration:

```js
    notiPayload: [
        {
            conditions: [
              {
                type: "time",
                value: 20000
              },
            ],
            notiMqttCmd: ["Command 0"],
        }
    ]
```

If we receive a notification `test` the notiMqttCmd `Command 0` will be initiated.  
If we receive a notification `test` again WITHIN 20 seconds the command `Command 0` will NOT be initated.  
If we receive a notification `test` again AFTER 20 seconds the command `Command 0` will be initated.  
