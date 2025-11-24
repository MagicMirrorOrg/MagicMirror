Module.register("traffic", {
	// Default module config.
	defaults: {
		apiKey: "",
		origin: "",
		destination: "",
		updateInterval: 5 * 60 * 1000, // 5 minutes
		initialLoadDelay: 0,
		showAlternatives: false,
		extraComputations: [], // TRAFFIC_ON_POLYLINE, TRAFFIC_ON_ROUTE
		trafficModel: "BEST_GUESS", // BEST_GUESS, PESSIMISTIC, OPTIMISTIC
		routingPreference: "TRAFFIC_AWARE_OPTIMAL", // TRAFFIC_AWARE, TRAFFIC_AWARE_OPTIMAL
		avoid: [], // ["TOLLS", "HIGHWAYS", "FERRIES", "INDOOR"]
		units: config.units, // metric or imperial
		showDistance: true,
		showDuration: true,
		showTrafficDelay: true,
		showTrafficLevel: true,
		header: "Traffic",
		animationSpeed: 1000,
		fade: true,
		fadePoint: 0.25
	},

	// Module properties.
	trafficData: null,
	routes: [],
	lastUpdate: null,
	error: null,
	updateTimer: null,
	loaded: false,

	// Define required styles.
	getStyles () {
		return ["traffic.css"];
	},

	// Define start sequence.
	start () {
		Log.info(`Starting module: ${this.name}`);

		// Validate configuration
		if (!this.config.apiKey) {
			this.error = "API key is required";
			Log.error("[Traffic] API key is missing in configuration");
			return;
		}

		if (!this.config.origin || !this.config.destination) {
			this.error = "Origin and destination are required";
			Log.error("[Traffic] Origin and destination are missing in configuration");
			return;
		}

		// Initialize data
		this.trafficData = null;
		this.routes = [];
		this.error = null;
		this.loaded = false;

		// Send initial request to node helper
		this.sendSocketNotification("FETCH_TRAFFIC", this.config);

		// Schedule periodic updates
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override socket notification handler.
	socketNotificationReceived (notification, payload) {
		if (notification === "TRAFFIC_DATA") {
			this.processTrafficData(payload);
			this.loaded = true;
			this.error = null;
			this.updateDom(this.config.animationSpeed);
		} else if (notification === "TRAFFIC_ERROR") {
			this.error = payload.error || "Failed to fetch traffic data";
			this.loaded = true;
			Log.error(`[Traffic] Error: ${this.error}`);
			this.updateDom(this.config.animationSpeed);
			// Schedule retry
			this.scheduleUpdate();
		}
	},

	/**
	 * Process traffic data received from node helper
	 * @param {object} data Traffic data from API
	 */
	processTrafficData (data) {
		this.trafficData = data;
		this.routes = data.routes || [];
		this.lastUpdate = new Date();
		Log.info(`[Traffic] Received traffic data: ${this.routes.length} route(s)`);
	},

	/**
	 * Schedule the next update
	 * @param {number} delay Optional delay in milliseconds
	 */
	scheduleUpdate (delay = null) {
		// Clear existing timer
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}

		let nextLoad = this.config.updateInterval;
		if (delay !== null && delay >= 0) {
			nextLoad = delay;
		}

		this.updateTimer = setTimeout(() => {
			// Request fresh data from node helper
			this.sendSocketNotification("FETCH_TRAFFIC", this.config);
			// Schedule next update (recursive)
			this.scheduleUpdate();
		}, nextLoad);
	},

	// Override getTemplate method.
	getTemplate () {
		return "traffic.njk";
	},

	// Override getTemplateData method.
	getTemplateData () {
		if (this.error) {
			return {
				error: this.error,
				loaded: this.loaded
			};
		}

		if (!this.loaded || !this.trafficData || this.routes.length === 0) {
			return {
				loading: true,
				loaded: this.loaded
			};
		}

		// Get primary route (first route)
		const primaryRoute = this.routes[0];
		if (!primaryRoute) {
			return {
				error: "No route data available",
				loaded: this.loaded
			};
		}

		// Calculate traffic metrics
		const metrics = this.calculateTrafficMetrics(primaryRoute);

		return {
			loaded: true,
			config: this.config,
			route: primaryRoute,
			metrics: metrics,
			lastUpdate: this.lastUpdate,
			alternatives: this.config.showAlternatives ? this.routes.slice(1) : []
		};
	},

	/**
	 * Calculate traffic metrics from route data
	 * @param {object} route Route object from API
	 * @returns {object} Traffic metrics
	 */
	calculateTrafficMetrics (route) {
		if (!route) {
			return null;
		}

		// Get duration and staticDuration from route (API returns at top level)
		const totalDuration = this.parseDuration(route.duration || "0s");
		const totalStaticDuration = this.parseDuration(route.staticDuration || "0s");
		const totalDistance = route.distanceMeters || 0;

		// Calculate delay
		const delaySeconds = totalDuration - totalStaticDuration;
		const delayPercent = totalStaticDuration > 0 ? (delaySeconds / totalStaticDuration) * 100 : 0;

		// Determine traffic level
		let trafficLevel = "light";
		let trafficLevelLabel = "Light";
		if (delayPercent >= 50) {
			trafficLevel = "severe";
			trafficLevelLabel = "Severe";
		} else if (delayPercent >= 30) {
			trafficLevel = "heavy";
			trafficLevelLabel = "Heavy";
		} else if (delayPercent >= 10) {
			trafficLevel = "moderate";
			trafficLevelLabel = "Moderate";
		}

		// Format distance
		const distance = this.formatDistance(totalDistance);

		// Format durations
		const duration = this.formatDuration(totalDuration);
		const staticDuration = this.formatDuration(totalStaticDuration);
		const delay = this.formatDuration(delaySeconds);

		return {
			duration: duration,
			staticDuration: staticDuration,
			delay: delay,
			delaySeconds: delaySeconds,
			delayPercent: delayPercent.toFixed(1),
			trafficLevel: trafficLevel,
			trafficLevelLabel: trafficLevelLabel,
			distance: distance,
			distanceMeters: totalDistance
		};
	},

	/**
	 * Parse duration object from API (e.g., "3600s" or {seconds: 3600})
	 * @param {string|object} duration Duration from API
	 * @returns {number} Duration in seconds
	 */
	parseDuration (duration) {
		if (typeof duration === "string") {
			// Format: "3600s"
			const match = duration.match(/(\d+)s/);
			return match ? parseInt(match[1], 10) : 0;
		} else if (duration && typeof duration === "object") {
			// Format: {seconds: 3600} or {seconds: 3600, nanos: 0}
			return duration.seconds || 0;
		}
		return 0;
	},

	/**
	 * Format duration in seconds to human-readable string
	 * @param {number} seconds Duration in seconds
	 * @returns {string} Formatted duration (e.g., "45 min", "1h 30 min")
	 */
	formatDuration (seconds) {
		if (seconds < 60) {
			return `${seconds} sec`;
		}

		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return minutes > 0 ? `${hours}h ${minutes} min` : `${hours}h`;
		}
		return `${minutes} min`;
	},

	/**
	 * Format distance in meters to human-readable string
	 * @param {number} meters Distance in meters
	 * @returns {string} Formatted distance
	 */
	formatDistance (meters) {
		if (this.config.units === "imperial") {
			const miles = meters / 1609.34;
			if (miles < 0.1) {
				const feet = meters * 3.28084;
				return `${Math.round(feet)} ft`;
			}
			return `${miles.toFixed(1)} mi`;
		} else {
			// metric
			if (meters < 1000) {
				return `${Math.round(meters)} m`;
			}
			const km = meters / 1000;
			return `${km.toFixed(1)} km`;
		}
	},

	/**
	 * Called when module is about to be hidden
	 */
	suspend () {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}
	},

	/**
	 * Called when module is about to be shown
	 */
	resume () {
		// Resume updates if needed
		if (!this.updateTimer && this.loaded) {
			this.scheduleUpdate();
		}
	}
});

