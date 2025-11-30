const https = require("https");
const NodeHelper = require("node_helper");
const Log = require("logger");

module.exports = NodeHelper.create({
	// Override start method.
	start () {
		Log.log(`Starting node helper for: ${this.name}`);
		this.schedulerTimer = null;
		this.schedulerConfig = null;
		this.lastEnabledState = null;
		this.enabledAtTime = null; // Track when module was enabled (for duration mode)
	},

	stop () {
		// Clean up scheduler timer
		if (this.schedulerTimer) {
			clearInterval(this.schedulerTimer);
			this.schedulerTimer = null;
		}
	},

	// Override socketNotificationReceived.
	socketNotificationReceived (notification, payload) {
		if (notification === "FETCH_TRAFFIC") {
			this.fetchTrafficData(payload);
		} else if (notification === "SCHEDULER_CONFIG_UPDATED") {
			this.updateScheduler(payload);
		}
	},

	/**
	 * Fetch traffic data from Google Routes API
	 * @param {object} config Module configuration
	 */
	async fetchTrafficData (config) {
		try {
			Log.info(`[Traffic] Fetching traffic data for route: ${config.origin} → ${config.destination}`);

			// Build request body
			const requestBody = this.buildRequestBody(config);

			// Make API request
			const response = await this.makeApiRequest(config.apiKey, requestBody);

			// Process and send response
			const processedData = this.processApiResponse(response);
			this.sendSocketNotification("TRAFFIC_DATA", processedData);

			Log.info("[Traffic] Successfully fetched traffic data");
		} catch (error) {
			Log.error("[Traffic] Error fetching traffic data:", error);
			this.sendSocketNotification("TRAFFIC_ERROR", {
				error: error.message || "Failed to fetch traffic data"
			});
		}
	},

	/**
	 * Build request body for Google Routes API
	 * @param {object} config Module configuration
	 * @returns {object} Request body
	 */
	buildRequestBody (config) {
		const requestBody = {
			origin: this.buildWaypoint(config.origin, config.originLat, config.originLng),
			destination: this.buildWaypoint(config.destination, config.destinationLat, config.destinationLng),
			travelMode: "DRIVE",
			routingPreference: config.routingPreference || "TRAFFIC_AWARE_OPTIMAL",
			computeAlternativeRoutes: config.showAlternatives || false,
			languageCode: config.language || "en",
			units: config.units === "imperial" ? "IMPERIAL" : "METRIC",
			extraComputations: config.extraComputations || []
		};

		// Add departure time for traffic-aware routing
		// if (config.departureTime) {
		// requestBody.departureTime = config.departureTime;
		// } else {
		// Use current time
		// const timeNow = new Date();
		// timeNow.setMinutes(timeNow.getMinutes() + 1);
		// requestBody.departureTime = timeNow.toISOString();
		// }

		// Add traffic model
		if (config.trafficModel) {
			requestBody.trafficModel = config.trafficModel.toUpperCase();
		}

		// Add route modifiers (avoid options)
		if (config.avoid && config.avoid.length > 0) {
			requestBody.routeModifiers = {};
			config.avoid.forEach((avoid) => {
				const upperAvoid = avoid.toUpperCase();
				if (upperAvoid === "TOLLS") {
					requestBody.routeModifiers.avoidTolls = true;
				} else if (upperAvoid === "HIGHWAYS") {
					requestBody.routeModifiers.avoidHighways = true;
				} else if (upperAvoid === "FERRIES") {
					requestBody.routeModifiers.avoidFerries = true;
				} else if (upperAvoid === "INDOOR") {
					requestBody.routeModifiers.avoidIndoor = true;
				}
			});
		}

		return requestBody;
	},

	/**
	 * Build waypoint object from address or coordinates
	 * @param {string} address Address string
	 * @param {number} lat Latitude (optional)
	 * @param {number} lng Longitude (optional)
	 * @returns {object} Waypoint object
	 */
	buildWaypoint (address, lat, lng) {
		if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
			return {
				location: {
					latLng: {
						latitude: parseFloat(lat),
						longitude: parseFloat(lng)
					}
				}
			};
		} else if (address) {
			return {
				address: address
			};
		} else {
			throw new Error("Waypoint requires either address or coordinates");
		}
	},

	/**
	 * Make API request to Google Routes API
	 * @param {string} apiKey Google API key
	 * @param {object} requestBody Request body
	 * @returns {Promise<object>} API response
	 */
	makeApiRequest (apiKey, requestBody) {
		return new Promise((resolve, reject) => {
			const postData = JSON.stringify(requestBody);
			// const fieldMask = "routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.staticDuration,routes.legs.distanceMeters,routes.legs.steps,routes.summary,routes.warnings,routes.routeLabels,routes.polyline";
			const fieldMask = "routes.duration,routes.staticDuration,routes.distanceMeters,routes.travelAdvisory,routes.warnings";
			const options = {
				hostname: "routes.googleapis.com",
				path: "/directions/v2:computeRoutes",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Length": Buffer.byteLength(postData),
					"X-Goog-Api-Key": apiKey,
					"X-Goog-FieldMask": fieldMask
				}
			};

			const req = https.request(options, (res) => {
				let data = "";

				res.on("data", (chunk) => {
					data += chunk;
				});

				res.on("end", () => {
					if (res.statusCode === 200) {
						try {
							const response = JSON.parse(data);
							resolve(response);
						} catch (error) {
							reject(new Error(`Failed to parse API response: ${error.message}`));
						}
					} else {
						try {
							const errorResponse = JSON.parse(data);
							reject(new Error(errorResponse.error?.message || `API error: ${res.statusCode}`));
						} catch (error) {
							reject(new Error(`API error: ${res.statusCode} - ${data}`));
						}
					}
				});
			});

			req.on("error", (error) => {
				reject(new Error(`Request failed: ${error.message}`));
			});

			req.write(postData);
			req.end();
		});
	},

	/**
	 * Process API response and format for frontend
	 * @param {object} response API response
	 * @returns {object} Processed data
	 */
	processApiResponse (response) {
		if (!response.routes || response.routes.length === 0) {
			throw new Error("No routes found");
		}

		return {
			routes: response.routes,
			timestamp: new Date().toISOString()
		};
	},

	/**
	 * Update scheduler configuration and restart scheduler
	 * @param {object} config Scheduler configuration
	 */
	updateScheduler (config) {
		// Clear existing timer
		if (this.schedulerTimer) {
			clearInterval(this.schedulerTimer);
			this.schedulerTimer = null;
		}

		// Reset state when config changes
		this.lastEnabledState = null;
		this.enabledAtTime = null;

		this.schedulerConfig = config;

		// If scheduler is disabled, stop here
		if (!config || !config.schedulerEnabled) {
			Log.info("[Traffic] Scheduler disabled");
			return;
		}

		Log.info("[Traffic] Starting scheduler");
		// Check immediately
		this.checkScheduler();
		// Check every minute
		this.schedulerTimer = setInterval(() => {
			this.checkScheduler();
		}, 60 * 1000);
	},

	/**
	 * Check scheduler and enable/disable module as needed
	 */
	checkScheduler () {
		if (!this.schedulerConfig || !this.schedulerConfig.schedulerEnabled) {
			return;
		}

		const now = new Date();
		const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
		let shouldBeEnabled = false;

		if (this.schedulerConfig.schedulerMode === "duration") {
			// Duration mode: enable for a specific duration after enableTime
			const enableTime = this.parseTime(this.schedulerConfig.enableTime);
			const duration = this.schedulerConfig.enabledDuration || 90;

			// Check if we're at the enable time (within 1 minute window)
			if (currentTime >= enableTime && currentTime < enableTime + 1) {
				// Time to enable - mark the enable time
				this.enabledAtTime = currentTime;
				shouldBeEnabled = true;
			} else if (this.enabledAtTime !== null) {
				// Check if we're still within the duration window
				let timeSinceEnable;
				if (currentTime >= this.enabledAtTime) {
					timeSinceEnable = currentTime - this.enabledAtTime;
				} else {
					// Wrapped around midnight
					timeSinceEnable = (24 * 60 - this.enabledAtTime) + currentTime;
				}

				if (timeSinceEnable < duration) {
					shouldBeEnabled = true;
				} else {
					// Duration expired, reset
					this.enabledAtTime = null;
					shouldBeEnabled = false;
				}
			} else {
				// Not enabled yet and not at enable time
				shouldBeEnabled = false;
			}
		} else {
			// Time range mode: enable between enableTime and disableTime
			const enableTime = this.parseTime(this.schedulerConfig.enableTime);
			let disableTime = this.parseTime(this.schedulerConfig.disableTime);

			// If disableTime is not set, calculate it as enableTime + 90 minutes
			if (!disableTime && enableTime) {
				disableTime = enableTime + 90;
				// Handle wrap-around past midnight
				if (disableTime >= 24 * 60) {
					disableTime = disableTime % (24 * 60);
				}
			}

			if (enableTime < disableTime) {
				// Normal case: enableTime < disableTime (e.g., 08:00 to 18:00)
				shouldBeEnabled = currentTime >= enableTime && currentTime < disableTime;
			} else {
				// Wraps around midnight (e.g., 22:00 to 06:00)
				shouldBeEnabled = currentTime >= enableTime || currentTime < disableTime;
			}
		}

		// Send notification if state should change
		// We'll track the last state to avoid sending duplicate notifications
		if (shouldBeEnabled && this.lastEnabledState !== true) {
			Log.info("[Traffic] Scheduler: Enabling module");
			this.sendSocketNotification("SCHEDULER_ENABLED", {});
			this.lastEnabledState = true;
		} else if (!shouldBeEnabled && this.lastEnabledState !== false) {
			Log.info("[Traffic] Scheduler: Disabling module");
			this.sendSocketNotification("SCHEDULER_DISABLED", {});
			this.lastEnabledState = false;
			// Reset enabledAtTime when disabling
			if (this.schedulerConfig.schedulerMode === "duration") {
				this.enabledAtTime = null;
			}
		}
	},

	/**
	 * Parse time string (HH:MM) to minutes since midnight
	 * @param {string} timeStr Time string in HH:MM format
	 * @returns {number} Minutes since midnight
	 */
	parseTime (timeStr) {
		if (!timeStr || typeof timeStr !== "string") {
			return 0;
		}
		const parts = timeStr.split(":");
		if (parts.length !== 2) {
			return 0;
		}
		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);
		if (isNaN(hours) || isNaN(minutes)) {
			return 0;
		}
		return hours * 60 + minutes;
	}
});

