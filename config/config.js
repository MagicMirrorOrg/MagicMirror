/* Config Sample
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/configuration/introduction.html
 * and https://docs.magicmirror.builders/modules/configuration.html
 *
 * You can use environment variables using a `config.js.template` file instead of `config.js`
 * which will be converted to `config.js` while starting. For more information
 * see https://docs.magicmirror.builders/configuration/introduction.html#enviromnent-variables
 */
const config = {
	address: "localhost",	// Address to listen on, can be:
							// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
							// - another specific IPv4/6 to listen on a specific interface
							// - "0.0.0.0", "::" to listen on any interface
							// Default, when address config is left out or empty, is "localhost"
	port: 8080,
	basePath: "/",	// The URL path where MagicMirror² is hosted. If you are using a Reverse proxy
									// you must set the sub path here. basePath must end with a /
	ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],	// Set [] to allow all IP addresses
									// or add a specific IPv4 of 192.168.1.5 :
									// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
									// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
									// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],
	trustedProxies: [],	// Reverse proxy address(es) allowed to provide client IPs via X-Forwarded-For.
											// Leave empty (default) if MagicMirror is not behind a reverse proxy.

	useHttps: false,			// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "",	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "",	// HTTPS Certificate path, only require when useHttps is true

	language: "en",
	locale: "en-US",   // this variable is provided as a consistent location
			   // it is currently only used by 3rd party modules. no MagicMirror code uses this value
			   // as we have no usage, we  have no constraints on what this field holds
			   // see https://en.wikipedia.org/wiki/Locale_(computer_software) for the possibilities

	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 24,
	units: "metric",

	modules: [
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "calendar",
			header: "US Holidays",
			//position: "top_left",
			config: {
				dateFormat: "Do MMMM",
				calendars: [
					{
							url: 'webcal://p132-caldav.icloud.com/published/2/MTMxODU2NjIyNDEzMTg1NnYsSsr5GwVOUWy8njRdd3YMJeEDIvkeRXiEjLne3lIF',
							symbol: 'calendar',
							name: "Luke"
					},
					{
							url: 'webcal://p132-caldav.icloud.com/published/2/MTMxODU2NjIyNDEzMTg1NnYsSsr5GwVOUWy8njRdd3YYHqo-1HZb3GUKvaew2U_MIXM6ju3vYoWTKKrBp-tBqU9EH-NIpAKPgdMWCCw5uJk',
							symbol: 'calendar',
							name: "Life"
					},
					{
							url: 'webcal://p155-caldav.icloud.com/published/2/NTUzMTY1MTIyNTUzMTY1Md-4H2bWvona8Y_vC0QHymz6LvEDcIHgH3JGisUGBQev',
							symbol: 'calendar',
							name: "Birthdays"
					},
					{
							url: 'webcal://p132-caldav.icloud.com/published/2/MTMxODU2NjIyNDEzMTg1NnYsSsr5GwVOUWy8njRdd3YIRgHTUVXRpTn6VoUZeiS0gossbEpM0vKA2_EtCutghsS7XUxAR77QreUZfrhPTps',
							symbol: 'calendar',
							name: "Meals"
					},
				]
			}
		},
		{
			module: "MMM-FamilyAgenda",
			position: "top_left",
			config: {
			maximumEventDays: 14,
			title: "Agenda",
			people: {
			"Birthdays": { emoji: "🎂", color: "#f43f5e" },
			"Life":   { emoji: "🔴", color: "#3b82f6" },
			"Luke":   { emoji: "🟣", color: "#3b82f6" },
			"Meals":   { emoji: "🟢", color: "#3b82f6" },
			},
				calendarAliases: { "Alice Sport": "Alice" }
			},
		},
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
