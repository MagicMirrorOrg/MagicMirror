
/* MagicMirror² Config Sample
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information on how you can configure this file
 * see https://docs.magicmirror.builders/configuration/introduction.html
 * and https://docs.magicmirror.builders/modules/configuration.html
 *
 * You can use environment variables using a `config.js.template` file instead of `config.js`
 * which will be converted to `config.js` while starting. For more information
 * see https://docs.magicmirror.builders/configuration/introduction.html#enviromnent-variables
 */
let config = {
	address: "0.0.0.0",	// Address to listen on, can be:
							// - "localhost", "127.0.0.1", "::1" to listen on loopback interface
							// - another specific IPv4/6 to listen on a specific interface
							// - "0.0.0.0", "::" to listen on any interface
							// Default, when address config is left out or empty, is "localhost"
	port: 8080,
	basePath: "/",			// The URL path where MagicMirror² is hosted. If you are using a Reverse proxy
					  		// you must set the sub path here. basePath must end with a /
	ipWhitelist: ["192.168.1.1/24", "127.0.0.1", "::ffff:127.0.0.1", "::1"],	// Set [] to allow all IP addresses
															// or add a specific IPv4 of 192.168.1.5 :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
															// or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
															// ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

	useHttps: false, 		// Support HTTPS or not, default "false" will use HTTP
	httpsPrivateKey: "", 	// HTTPS private key path, only require when useHttps is true
	httpsCertificate: "", 	// HTTPS Certificate path, only require when useHttps is true

	language: "de",
	locale: "de-CH",
	logLevel: ["INFO", "LOG", "WARN", "ERROR"], // Add "DEBUG" for even more logging
	timeFormat: 24,
	units: "metric",

	modules: [

	{
			module: 'MMM-DailyBibleVerse',
			position: 'middle_center',	// This can be any of the regions. Best result is in the bottom_bar as verses can take multiple lines in a day.
			config: {
				version: 'NIV', // This can be changed to any version you want that is offered by Bible Gateway. For a list, go here: https://www.biblegateway.com/versions/,
	    			size: 'small' // default value is medium, but can be changed.
				}
		},
		{
			module: "alert",
		},
		{
			module: "updatenotification",
			position: "top_bar"
		},
		{
			module: "clock",
			position: "top_left"
		},
		{
			module: "calendar",
			header: "Holidays",
				position: "top_left",
			config: {
				calendars: [
					{
						fetchInterval: 7 * 24 * 60 * 60 * 1000,
						symbol: "calendar-check",
						url: "https://www.ferienwiki.ch/exports/ferien/2026/ch/st-gallen"
					}
				]
			}
		},
		{

	module: "MMM-cryptocurrency",
	position: "top_left",
	config: {
		apikey: '87eb4329-5491-4216-9676-8fdf38175e70',
		currency: ['bitcoin'],
		conversion: 'CHF',
		headers: ['change24h', 'change1h', 'change7d'],
		displayType: 'logoWithChanges',
		showGraphs: false
		}
	},
		{
			module: "compliments",
			position: "middle_center"
		},
		{
			module: "weather",
			position: "top_right",
			config: {
				weatherProvider: "openweathermap",
				type: "current",
				location: "St. Gallen, CH",
				locationID: "2658822", //ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
				apiKey: "8c276ac781f19f1491e881cd9ce99c0c"
			}
		},
    		{
			module: "weather",
			position: "top_right",
			header: "Weather Forecast",
			config: {
				weatherProvider: "openweathermap",
				type: "forecast",
				location: "St. Gallen, CH",
				locationID: "2658822", //ID from http://bulk.openweathermap.org/sample/city.list.json.gz; unzip the gz file and find your city
				apiKey: "8c276ac781f19f1491e881cd9ce99c0c"
			}
		},
		{
    		module: "newsfeed",
    		position: "bottom_bar", // This can be any of the regions. Best results in center regions.
    		config: {
    		  feeds: [
        			{
          				title: "The Hacker News",
          				url: "https://feeds.feedburner.com/TheHackersNews"
        			}
      			],
    		}
		},
		{
			module: 'MMM-Remote-Control',
			position: 'bottom_left', // Required to show URL/QR code on mirror
			// you can hide this module afterwards from the remote control itself
			config: {
				customCommand: {},  // Optional, See "Using Custom Commands" below
				secureEndpoints: true, // Optional, See API/README.md
				// uncomment any of the lines below if you're gonna use it
				// customMenu: "custom_menu.json", // Optional, See "Custom Menu Items" below
				// apiKey: "", // Optional, See API/README.md for details
				// classes: {}, // Optional, See "Custom Classes" below
				// showModuleApiMenu: false, // Optional, disable the Module Controls menu
				// showNotificationMenu: false, // Optional, disable the Notification menu

				// QR Code options (new!)
				// showQRCode: true, // Optional, display QR code for easy mobile access (default: true)
				// qrCodeSize: 150, // Optional, size of QR code in pixels (default: 150)
				// qrCodePosition: "below" // Optional:
				//   "below" - Show URL above, QR code below (default)
				//   "above" - Show QR code above, URL below
				//   "replace" - Show only QR code, no URL text
			}
		},	
]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {module.exports = config;}
