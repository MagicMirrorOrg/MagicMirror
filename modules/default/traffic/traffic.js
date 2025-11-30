/* global L */
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
	map: null,
	mapInitialized: false,
	routeLayer: null,
	markers: [],

	// Define required styles.
	getStyles () {
		return ["traffic.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"];
	},

	// Define required scripts.
	getScripts () {
		return ["https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];
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
			// Initialize map after DOM update
			setTimeout(() => {
				if (!this.mapInitialized && typeof L !== "undefined") {
					this.initializeMap();
				}
			}, 2500);
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
		// Update map if initialized
		if (this.mapInitialized) {
			this.updateMap();
		}
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
			alternatives: this.config.showAlternatives ? this.routes.slice(1) : [],
			showMap: true
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
		// Clean up map
		if (this.map) {
			this.map.remove();
			this.map = null;
			this.mapInitialized = false;
			this.routeLayer = null;
			this.markers = [];
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
		// Initialize map if not already done
		setTimeout(() => {
			if (!this.mapInitialized && this.loaded && !this.disabled && this.routes.length > 0 && typeof L !== "undefined") {
				this.initializeMap();
			}
		}, 100);
	},

	/**
	 * Initialize Leaflet map
	 */
	initializeMap () {
		if (typeof L === "undefined") {
			Log.warn("[Traffic] Leaflet library not loaded yet");
			return;
		}

		const moduleWrapper = document.getElementById(this.identifier);
		if (!moduleWrapper) {
			Log.warn("[Traffic] Module wrapper not found");
			return;
		}

		const mapContainer = moduleWrapper.querySelector(".traffic-map-container");
		if (!mapContainer) {
			Log.warn("[Traffic] Map container not found");
			return;
		}

		try {
			// Get route bounds or use default center
			let center = [37.7749, -122.4194]; // Default to San Francisco
			let zoom = 10;

			if (this.routes.length > 0 && this.routes[0].polyline) {
				// Decode polyline to get route bounds
				const polyline = this.routes[0].polyline.encodedPolyline;
				if (polyline) {
					const decoded = this.decodePolyline(polyline);
					if (decoded.length > 0) {
						// Calculate bounds
						const bounds = this.calculateBounds(decoded);
						center = [(bounds.north + bounds.south) / 2, (bounds.east + bounds.west) / 2];
						zoom = this.calculateZoom(bounds);
					}
				}
			}

			// Initialize map
			this.map = L.map(mapContainer, {
				zoomControl: false,
				attributionControl: false,
				scrollWheelZoom: false,
				doubleClickZoom: false,
				dragging: false,
				touchZoom: false,
				boxZoom: false,
				keyboard: false
			});

			// Add tile layer (OpenStreetMap)
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				maxZoom: 19,
				attribution: ""
			}).addTo(this.map);

			// Set view
			this.map.setView(center, zoom);

			this.mapInitialized = true;
			Log.info("[Traffic] Map initialized");

			// Update map with route data
			this.updateMap();
		} catch (error) {
			Log.error("[Traffic] Error initializing map:", error);
		}
	},

	/**
	 * Update map with current route data
	 */
	updateMap () {
		if (!this.map || !this.mapInitialized || this.routes.length === 0) {
			return;
		}

		try {
			// Remove existing route layer and markers
			if (this.routeLayer) {
				this.map.removeLayer(this.routeLayer);
				this.routeLayer = null;
			}
			this.markers.forEach((marker) => {
				this.map.removeLayer(marker);
			});
			this.markers = [];

			const primaryRoute = this.routes[0];
			if (!primaryRoute.polyline || !primaryRoute.polyline.encodedPolyline) {
				return;
			}

			// Decode polyline
			const decoded = this.decodePolyline(primaryRoute.polyline.encodedPolyline);
			if (decoded.length === 0) {
				return;
			}

			// Add route polyline
			const latlngs = decoded.map((point) => [point.lat, point.lng]);
			this.routeLayer = L.polyline(latlngs, {
				color: this.getRouteColor(primaryRoute),
				weight: 4,
				opacity: 0.8
			}).addTo(this.map);

			// Add origin marker
			if (decoded.length > 0) {
				const origin = decoded[0];
				const originMarker = L.marker([origin.lat, origin.lng], {
					icon: L.divIcon({
						className: "traffic-marker traffic-marker-origin",
						html: "●",
						iconSize: [12, 12]
					})
				}).addTo(this.map);
				this.markers.push(originMarker);
			}

			// Add destination marker
			if (decoded.length > 1) {
				const destination = decoded[decoded.length - 1];
				const destMarker = L.marker([destination.lat, destination.lng], {
					icon: L.divIcon({
						className: "traffic-marker traffic-marker-destination",
						html: "●",
						iconSize: [12, 12]
					})
				}).addTo(this.map);
				this.markers.push(destMarker);
			}

			// Fit map to route bounds
			const bounds = this.calculateBounds(decoded);
			this.map.fitBounds([
				[bounds.south, bounds.west],
				[bounds.north, bounds.east]
			], {
				padding: [20, 20]
			});
		} catch (error) {
			Log.error("[Traffic] Error updating map:", error);
		}
	},

	/**
	 * Decode Google encoded polyline
	 * @param {string} encoded Encoded polyline string
	 * @returns {Array} Array of {lat, lng} objects
	 */
	decodePolyline (encoded) {
		const points = [];
		let index = 0;
		const len = encoded.length;
		let lat = 0;
		let lng = 0;

		while (index < len) {
			let b;
			let shift = 0;
			let result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			const dlat = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
			lat += dlat;

			shift = 0;
			result = 0;
			do {
				b = encoded.charCodeAt(index++) - 63;
				result |= (b & 0x1f) << shift;
				shift += 5;
			} while (b >= 0x20);
			const dlng = ((result & 1) !== 0) ? ~(result >> 1) : (result >> 1);
			lng += dlng;

			points.push({
				lat: lat * 1e-5,
				lng: lng * 1e-5
			});
		}

		return points;
	},

	/**
	 * Calculate bounds from decoded polyline points
	 * @param {Array} points Array of {lat, lng} objects
	 * @returns {object} Bounds object with north, south, east, west
	 */
	calculateBounds (points) {
		if (points.length === 0) {
			return { north: 0, south: 0, east: 0, west: 0 };
		}

		let north = points[0].lat;
		let south = points[0].lat;
		let east = points[0].lng;
		let west = points[0].lng;

		points.forEach((point) => {
			north = Math.max(north, point.lat);
			south = Math.min(south, point.lat);
			east = Math.max(east, point.lng);
			west = Math.min(west, point.lng);
		});

		return { north, south, east, west };
	},

	/**
	 * Calculate appropriate zoom level from bounds
	 * @param {object} bounds Bounds object
	 * @returns {number} Zoom level
	 */
	calculateZoom (bounds) {
		const latDiff = bounds.north - bounds.south;
		const lngDiff = bounds.east - bounds.west;
		const maxDiff = Math.max(latDiff, lngDiff);

		if (maxDiff > 10) return 5;
		if (maxDiff > 5) return 6;
		if (maxDiff > 2) return 7;
		if (maxDiff > 1) return 8;
		if (maxDiff > 0.5) return 9;
		if (maxDiff > 0.2) return 10;
		if (maxDiff > 0.1) return 11;
		if (maxDiff > 0.05) return 12;
		if (maxDiff > 0.02) return 13;
		return 14;
	},

	/**
	 * Get route color based on traffic level
	 * @param {object} route Route object
	 * @returns {string} Color hex code
	 */
	getRouteColor (route) {
		// Calculate traffic delay percentage
		const totalDuration = this.parseDuration(route.duration || "0s");
		const totalStaticDuration = this.parseDuration(route.staticDuration || "0s");
		const delayPercent = totalStaticDuration > 0 ? ((totalDuration - totalStaticDuration) / totalStaticDuration) * 100 : 0;

		if (delayPercent >= 50) {
			return "#f44336"; // Red - Severe
		} else if (delayPercent >= 30) {
			return "#ff9800"; // Orange - Heavy
		} else if (delayPercent >= 10) {
			return "#ffeb3b"; // Yellow - Moderate
		}
		return "#4caf50"; // Green - Light
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

		// Clean up map
		if (this.map) {
			this.map.remove();
			this.map = null;
			this.mapInitialized = false;
			this.routeLayer = null;
			this.markers = [];
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

