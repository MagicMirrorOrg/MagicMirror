const path = require("node:path");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	providers: {},
	lastData: {},

	start () {
		Log.log(`Starting node helper for: ${this.name}`);
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "INIT_WEATHER") {
			Log.log(`Received INIT_WEATHER for instance ${payload.instanceId}`);
			this.initWeatherProvider(payload);
		} else if (notification === "STOP_WEATHER") {
			Log.log(`Received STOP_WEATHER for instance ${payload.instanceId}`);
			this.stopWeatherProvider(payload.instanceId);
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

		Log.log(`Attempting to initialize provider ${identifier} for instance ${instanceId}`);

		if (this.providers[instanceId]) {
			Log.log(`Weather provider ${identifier} already initialized for instance ${instanceId}, re-sending WEATHER_INITIALIZED`);
			// Client may have restarted (e.g. page reload) - re-send so it recovers location name
			this.sendSocketNotification("WEATHER_INITIALIZED", {
				instanceId,
				locationName: this.providers[instanceId].locationName
			});
			// Push cached data immediately so reconnecting clients don't wait for next scheduled fetch
			if (this.lastData[instanceId]) {
				this.sendSocketNotification("WEATHER_DATA", this.lastData[instanceId]);
			}
			return;
		}

		try {
			// Dynamically load the provider module
			const providerPath = path.join(__dirname, "providers", `${identifier}.js`);
			Log.log(`Loading provider from: ${providerPath}`);
			const ProviderClass = require(providerPath);

			// Create provider instance
			const provider = new ProviderClass(config);

			// Set up callbacks before initializing
			provider.setCallbacks(
				(data) => {
					// On data received
					const payload = { instanceId, type: config.type, data };
					this.lastData[instanceId] = payload;
					this.sendSocketNotification("WEATHER_DATA", payload);
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
	},

	/**
	 * Stop and cleanup a weather provider
	 * @param {string} instanceId The instance identifier
	 */
	stopWeatherProvider (instanceId) {
		const provider = this.providers[instanceId];

		if (provider) {
			Log.log(`Stopping weather provider for instance ${instanceId}`);
			provider.stop();
			delete this.providers[instanceId];
			delete this.lastData[instanceId];
		} else {
			Log.warn(`No provider found for instance ${instanceId}`);
		}
	}
});
