# valueFormat

As of version 2.1 of the module it is possible to format the MQTT messages or notification payloads before they get further processed.

:information_source: The MQTT message or notification payload will be in the variable `value` which you can access in the `valueFormat` with `${value}`.

:warning: As formatting of newlines causes problems you need to configure a `newlineReplacement` either in the global module configuration or in the configuration of the messages/payloads.

You can define the `valueFormat` option for `mqttPayload` elements in the `mqttDictionary.js` or in the elments of `notiPayload` in `notiDictionary.js` like in the following examples:

```js
    notiPayload: [
        {
            newlineReplacement: "#",
            valueFormat: "\"${value}\".replace(\"test\",\"\").replace(\"abc\",\"\")",
            notiMqttCmd: ["Command 0"],
        }
    ]
```

```js
    mqttPayload: [
        {
            valueFormat: "Number(${value}).toFixed(2)",
            mqttNotiCmd: ["Command 0"]
        },
    ],
```

Let's look at some examples now.

Let us assume we do have the following notification configuration:

```js
    notiPayload: [
        {
            valueFormat: "Number(${value}).toFixed(2)",
            notiMqttCmd: ["Command 0"],
        }
    ]
```

Now we receive the corresponding notification with the payload:

```js
10.123456
```

The result will be:

* The command `Command 0` will be called with the value `10.12`.

Now lets assume we do have the configuration:

```js
    notiPayload: [
        {
            valueFormat: "Number(${value.output}).toFixed(2)",
            notiMqttCmd: ["Command 0"],
        }
    ]
```

And the notification payload is:

```js
{
    output: 10.12345
}
```

The result will be the same as before as we selected `${value.output}` in the configuration.

Now lets assume the following configuration:

```js
    notiPayload: [
        {
            newlineReplacement: "#",
            valueFormat: "\"${value}\".replace(\"test\",\"\").replace(\"abc\",\"\").replace(\"#\",\"\")",
            notiMqttCmd: ["Command 0"],
        }
    ]
```

And the notification payload is the following string with new line characters:

```text
test
123
abc
```

As newline charcters will be replaced with `#` and then `test`, `abc` and `#` will be replaced by nothing the result will be `123`.

The way to format MQTT messages is the same as for the notification payload but if you want to select sub elements like `output` in the example before you need to use the `jsonpath` option first. See [jsonpath.md](jsonpath.md) for more details but let us look at a simple example now.

The MQTT configuration contains:

```js
    mqttPayload: [
        {
          jsonpath: "output",
          valueFormat: "Number(${value}).toFixed(2)",
          mqttNotiCmd: ["Command 0"]
        },
    ],
```

The received MQTT message is:

```json
{
    "output": 10.12345
}
```

And again the result will be the same as in the notification example. The `Command 0` will be called with value `10.12`.

## Further examples

### valueFormat: "\"${value}\".replace(\"test\",\"\").replace(\"abc\",\"\")"

The value will be interpreted as strint, `test` and `abc` in the string will be replaced with nothing. So if the input will be something like `test123abc` the result will be `123`.

### valueFormat: "\"${value.myInput}\".replace(\"test\",\"\").replace(\"abc\",\"\")"

The `myInput` of the value will be selected, `test` and `abc` will be replaced with nothing. So fi the input is something like `{myInput: test123abc}` the result will be `123`.
