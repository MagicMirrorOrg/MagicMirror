if (typeof exports === "object") {
	// running in nodejs (not in browser)
	exports.configFactory = (options) => {
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
}
