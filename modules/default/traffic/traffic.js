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
		fadePoint: 0.25,
		disabled: false,
		// Scheduler configuration
		schedulerEnabled: false,
		schedulerMode: "timeRange", // "timeRange" or "duration"
		enableTime: "06:30", // HH:MM format
		disableTime: "08:00", // HH:MM format
		enabledDuration: 90 // minutes (used when schedulerMode is "duration")
	},

	// Module properties.
	trafficData: null,
	routes: [],
	lastUpdate: null,
	error: null,
	updateTimer: null,
	loaded: false,
	disabled: false,

	// Define required styles.
	getStyles () {
		return ["traffic.css"];
	},

	// Define start sequence.
	start () {
		Log.info(`Starting module: ${this.name}`);

		// Check if module is disabled
		this.disabled = this.config.disabled || false;
		if (this.disabled) {
			Log.info("[Traffic] Module is disabled");
			this.loaded = true;
			this.updateDom();
			return;
		}

		// Validate configuration
		if (!this.config.apiKey) {
			this.error = "API key is required";
			Log.error("[Traffic] API key is missing in configuration");
			this.disabled = true;
			this.loaded = true;
			this.updateDom();
			return;
		}

		if (!this.config.origin || !this.config.destination) {
			Log.warn("[Traffic] Origin and destination are missing in configuration - disabling module");
			this.disabled = true;
			this.loaded = true;
			this.updateDom();
			return;
		}

		// Initialize data
		this.trafficData = null;
		this.routes = [];
		this.error = null;
		this.loaded = false;

		// Send initial request to node helper
		this.sendSocketNotification("FETCH_TRAFFIC", this.config);

		// Initialize scheduler if enabled
		if (this.config.schedulerEnabled) {
			// Calculate disableTime if not set (enableTime + 90 minutes)
			let disableTime = this.config.disableTime;
			if (!disableTime && this.config.enableTime) {
				disableTime = this.calculateDisableTime(this.config.enableTime, 90);
			}

			this.sendSocketNotification("SCHEDULER_CONFIG_UPDATED", {
				schedulerEnabled: this.config.schedulerEnabled,
				schedulerMode: this.config.schedulerMode || "timeRange",
				enableTime: this.config.enableTime || "08:00",
				disableTime: disableTime || "09:30",
				enabledDuration: this.config.enabledDuration || 90
			});
		}

		// Schedule periodic updates
		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override socket notification handler.
	socketNotificationReceived (notification, payload) {
		if (notification === "TRAFFIC_DATA") {
			if (this.disabled) return;
			this.processTrafficData(payload);
			this.loaded = true;
			this.error = null;
			this.updateDom(this.config.animationSpeed);
		} else if (notification === "TRAFFIC_ERROR") {
			if (this.disabled) return;
			this.error = payload.error || "Failed to fetch traffic data";
			this.loaded = true;
			Log.error(`[Traffic] Error: ${this.error}`);
			this.updateDom(this.config.animationSpeed);
			// Schedule retry
			this.scheduleUpdate();
		} else if (notification === "MODULE_CONFIG_UPDATED") {
			this.handleConfigUpdate(payload);
		} else if (notification === "MODULE_DISABLED") {
			this.handleDisabled();
		} else if (notification === "MODULE_ENABLED") {
			this.handleEnabled();
		} else if (notification === "SCHEDULER_ENABLED") {
			this.handleEnabled();
		} else if (notification === "SCHEDULER_DISABLED") {
			this.handleDisabled();
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
		// Check if module is disabled
		if (this.disabled) {
			return {
				disabled: true,
				loaded: true
			};
		}

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
	 * Calculate disable time from enable time + duration in minutes
	 * @param {string} enableTime Time string in HH:MM format
	 * @param {number} durationMinutes Duration in minutes
	 * @returns {string} Disable time in HH:MM format
	 */
	calculateDisableTime (enableTime, durationMinutes) {
		if (!enableTime || typeof enableTime !== "string") {
			return "09:30"; // Default fallback
		}
		const parts = enableTime.split(":");
		if (parts.length !== 2) {
			return "09:30"; // Default fallback
		}
		const hours = parseInt(parts[0], 10);
		const minutes = parseInt(parts[1], 10);
		if (isNaN(hours) || isNaN(minutes)) {
			return "09:30"; // Default fallback
		}

		// Calculate total minutes since midnight
		let totalMinutes = hours * 60 + minutes + durationMinutes;

		// Handle wrap-around past midnight
		if (totalMinutes >= 24 * 60) {
			totalMinutes = totalMinutes % (24 * 60);
		}

		const disableHours = Math.floor(totalMinutes / 60);
		const disableMinutes = totalMinutes % 60;

		// Format as HH:MM
		return `${String(disableHours).padStart(2, "0")}:${String(disableMinutes).padStart(2, "0")}`;
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
		if (!this.updateTimer && this.loaded && !this.disabled) {
			this.scheduleUpdate();
		}
	},

	/**
	 * Handle configuration update from admin page
	 * @param {object} updates Configuration updates
	 */
	handleConfigUpdate (updates) {
		Log.info("[Traffic] Configuration updated via admin page");

		// Update config values
		if (updates.destination !== undefined) {
			this.config.destination = updates.destination;
		}
		if (updates.trafficModel !== undefined) {
			this.config.trafficModel = updates.trafficModel;
		}
		if (updates.updateInterval !== undefined) {
			this.config.updateInterval = updates.updateInterval;
		}

		// Update scheduler config
		if (updates.schedulerEnabled !== undefined) {
			this.config.schedulerEnabled = updates.schedulerEnabled;
		}
		if (updates.schedulerMode !== undefined) {
			this.config.schedulerMode = updates.schedulerMode;
		}
		if (updates.enableTime !== undefined) {
			this.config.enableTime = updates.enableTime;
		}
		if (updates.disableTime !== undefined) {
			this.config.disableTime = updates.disableTime;
		}
		if (updates.enabledDuration !== undefined) {
			this.config.enabledDuration = updates.enabledDuration;
		}

		// Send scheduler config update to node_helper
		if (updates.schedulerEnabled !== undefined || updates.schedulerMode !== undefined) {
			// Calculate disableTime if not set (enableTime + 90 minutes)
			let disableTime = this.config.disableTime;
			if (!disableTime && this.config.enableTime) {
				disableTime = this.calculateDisableTime(this.config.enableTime, 90);
			}

			this.sendSocketNotification("SCHEDULER_CONFIG_UPDATED", {
				schedulerEnabled: this.config.schedulerEnabled || false,
				schedulerMode: this.config.schedulerMode || "timeRange",
				enableTime: this.config.enableTime || "08:00",
				disableTime: disableTime || "09:30",
				enabledDuration: this.config.enabledDuration || 90
			});
		}

		// Check if we have required config (origin and destination)
		if (!this.config.origin || !this.config.destination) {
			Log.warn("[Traffic] Origin or destination missing after update - disabling module");
			this.disabled = true;
			if (this.updateTimer) {
				clearTimeout(this.updateTimer);
				this.updateTimer = null;
			}
			this.updateDom();
			return;
		}

		// Restart updates with new interval if module is enabled
		if (!this.disabled) {
			if (this.updateTimer) {
				clearTimeout(this.updateTimer);
				this.updateTimer = null;
			}
			// Re-validate and restart
			if (this.config.apiKey && this.config.origin && this.config.destination) {
				this.sendSocketNotification("FETCH_TRAFFIC", this.config);
				this.scheduleUpdate();
			}
		}

		this.updateDom();
	},

	/**
	 * Handle module being disabled
	 */
	handleDisabled () {
		Log.info("[Traffic] Module disabled via admin page");
		this.disabled = true;
		this.config.disabled = true;

		// Stop updates
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
			this.updateTimer = null;
		}

		this.updateDom();
	},

	/**
	 * Handle module being enabled
	 */
	handleEnabled () {
		Log.info("[Traffic] Module enabled via admin page");

		// Check if we have required config (origin and destination)
		if (!this.config.origin || !this.config.destination) {
			Log.warn("[Traffic] Origin or destination missing - cannot enable module");
			this.disabled = true;
			this.loaded = true;
			this.updateDom();
			return;
		}

		this.disabled = false;
		this.config.disabled = false;

		// Restart if we have valid config
		if (this.config.apiKey && this.config.origin && this.config.destination) {
			this.loaded = false;
			this.error = null;
			this.sendSocketNotification("FETCH_TRAFFIC", this.config);
			this.scheduleUpdate(this.config.initialLoadDelay);
		} else {
			this.error = "API key, origin, and destination are required";
			this.disabled = true;
			this.loaded = true;
		}

		this.updateDom();
	}
});

