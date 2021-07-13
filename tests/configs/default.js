/* Magic Mirror Test default config for modules
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
exports.configFactory = function (options) {
	return Object.assign(
		{
			port: 8080,
			ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],

			language: "en",
			timeFormat: 24,
			units: "metric",
			electronOptions: {
				webPreferences: {
					nodeIntegration: true,
					enableRemoteModule: true,
					contextIsolation: false
				}
			},

			modules: []
		},
		options
	);
};
