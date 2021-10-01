/* Magic Mirror Test default config for modules
 *
 * By Rodrigo Ramírez Norambuena https://rodrigoramirez.com
 * MIT Licensed.
 */
exports.configFactory = function (options) {
	return Object.assign(
		{
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
