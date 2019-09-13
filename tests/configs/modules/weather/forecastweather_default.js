/* Magic Mirror Test config default weather
 *
 * By fewieden https://github.com/fewieden
 *
 * MIT Licensed.
 */

let config = {
    port: 8080,
    ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

    language: "en",
    timeFormat: 12,
    units: "metric",
    electronOptions: {
        webPreferences: {
            nodeIntegration: true,
        },
    },

    modules: [
        {
            module: "weather",
            position: "bottom_bar",
            config: {
                type: "forecast",
                location: "Munich",
                apiKey: "fake key",
                weatherEndpoint: "/forecast/daily",
                initialLoadDelay: 3000
            }
        }
    ]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
