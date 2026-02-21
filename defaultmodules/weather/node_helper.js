const path = require("node:path");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	providers: {},

	start () {
		Log.log(`Starting node helper for: ${this.name}`);
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "INIT_WEATHER") {
			Log.log(`[weather] Received INIT_WEATHER for instance ${payload.instanceId}`);
			this.initWeatherProvider(payload);
		}
		// FETCH_WEATHER is no longer needed - HTTPFetcher handles periodic fetching
	},

	/**
	 * Initialize a weather provider
	 * @param {object} config The configuration object
	 */
	async initWeatherProvider (config) {
		const identifier = config.weatherProvider.toLowerCase();
		const instanceId = config.instanceId;

		Log.log(`[weather] Attempting to initialize provider ${identifier} for instance ${instanceId}`);

		if (this.providers[instanceId]) {
			Log.log(`Weather provider ${identifier} already initialized for instance ${instanceId}`);
			return;
		}

		try {
			// Dynamically load the provider module
			const providerPath = path.join(__dirname, "providers", `${identifier}.js`);
			Log.log(`[weather] Loading provider from: ${providerPath}`);
			const ProviderClass = require(providerPath);

			// Create provider instance
			const provider = new ProviderClass(config);

			// Set up callbacks before initializing
			provider.setCallbacks(
				(data) => {
					// On data received
					this.sendSocketNotification("WEATHER_DATA", {
						instanceId,
						type: config.type,
						data
					});
				},
				(errorInfo) => {
					// On error
					this.sendSocketNotification("WEATHER_ERROR", {
						instanceId,
						error: errorInfo.message || "Unknown error",
						translationKey: errorInfo.translationKey
					});
				}
			);

			await provider.initialize();
			this.providers[instanceId] = provider;

			this.sendSocketNotification("WEATHER_INITIALIZED", {
				instanceId,
				locationName: provider.locationName
			});

			// Start periodic fetching
			provider.start();

			Log.log(`Weather provider ${identifier} initialized for instance ${instanceId}`);
		} catch (error) {
			Log.error(`Failed to initialize weather provider ${identifier}:`, error);
			this.sendSocketNotification("WEATHER_ERROR", {
				instanceId,
				error: error.message
			});
		}
	}
});
