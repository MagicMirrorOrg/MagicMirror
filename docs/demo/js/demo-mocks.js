/* MagicMirror² Demo - Mock Implementations
 * Simulates server components and APIs for the browser demo
 */

// ============================================
// Global Logging Mock
// ============================================
window.Log = {
	info (...args) { console.info("[INFO]", ...args); },
	log (...args) { console.log("[LOG]", ...args); },
	error (...args) { console.error("[ERROR]", ...args); },
	warn (...args) { console.warn("[WARN]", ...args); },
	debug (...args) { console.debug("[DEBUG]", ...args); }
};

// ============================================
// Translator Mock
// ============================================
window.Translator = {
	translations: {
		LOADING: "Loading …",
		DAYBEFOREYESTERDAY: "Day Before Yesterday",
		YESTERDAY: "Yesterday",
		TODAY: "Today",
		TOMORROW: "Tomorrow",
		DAYAFTERTOMORROW: "Day After Tomorrow",
		RUNNING: "ends in",
		EMPTY: "No upcoming events.",
		WEEK: "Week {weekNumber}",
		WEEK_SHORT: "W{weekNumber}"
	},
	coreTranslations: {},

	loadCoreTranslations (lang) {
		return Promise.resolve();
	},

	translate (module, key, variables) {
		// Handle being called with just (key, variables) or (module, key, variables)
		if (typeof module === "string") {
			variables = key;
			key = module;
		}

		let translation = this.translations[key] || key;

		// Replace variables in translation
		if (variables && typeof variables === "object") {
			Object.keys(variables).forEach((varKey) => {
				translation = translation.replace(`{${varKey}}`, variables[varKey]);
			});
		}

		return translation;
	},

	load (module, file, force, callback) {
		if (callback) callback();
		return Promise.resolve();
	}
};

// ============================================
// Nunjucks Mock
// ============================================
if (!window.nunjucks) {
	window.nunjucks = {};
}

// Mock WebLoader for module.js compatibility
window.nunjucks.WebLoader = function (baseURL, opts) {
	this.baseURL = baseURL;
	this.async = opts && opts.async;

	this.getSource = function (name, callback) {
		// Return empty template for demo
		if (callback) {
			callback(null, { src: "", path: name, noCache: false });
		}
		return { src: "", path: name, noCache: false };
	};
};

// Mock Environment
window.nunjucks.Environment = function (loader, opts) {
	this.loader = loader;
	this.opts = opts || {};
	this.filters = {};

	this.addFilter = function (name, fn) {
		this.filters[name] = fn;
		return this;
	};

	this.renderString = function (template, data, callback) {
		const result = template; // Simple passthrough for demo
		if (callback) {
			callback(null, result);
			return;
		}
		return result;
	};

	this.render = function (name, data, callback) {
		const result = `<div>Template: ${name}</div>`; // Mock render
		if (callback) {
			callback(null, result);
			return;
		}
		return result;
	};
};

// Mock runtime
window.nunjucks.runtime = {
	markSafe (val) {
		return val;
	}
};

// Mock configure
window.nunjucks.configure = function (baseURL, opts) {
	return new window.nunjucks.Environment(
		new window.nunjucks.WebLoader(baseURL, opts),
		opts
	);
};

// ============================================
// Socket.IO Mock
// ============================================
window.io = function () {
	return {
		on (event, callback) {
			console.log("Socket event registered:", event);
		},
		emit (event, data) {
			console.log("Socket emit:", event, data);
		}
	};
};

// ============================================
// MMSocket Mock (for module.js socket() method)
// ============================================
window.MMSocket = function (moduleName) {
	this.moduleName = moduleName;
	this.notificationCallback = null;

	this.setNotificationCallback = function (callback) {
		this.notificationCallback = callback;
	};

	this.sendNotification = function (notification, payload) {
		console.log(`Socket notification from ${moduleName}:`, notification, payload);
		// In demo mode, socket notifications are ignored
	};

	return this;
};

// ============================================
// Module Manager Mock
// ============================================
window.MM = {
	modules: [],

	getModules () {
		return this.modules;
	},

	sendNotification (notification, payload, sender) {
		console.log("Notification:", notification, payload);
		// Broadcast to all modules
		this.modules.forEach((module) => {
			if (module !== sender && typeof module.notificationReceived === "function") {
				module.notificationReceived(notification, payload, sender);
			}
		});
	}
};

// ============================================
// Mock Weather Data Provider
// ============================================
const mockWeatherData = {
	current: {
		temperature: 8,
		feelsLike: 5,
		weatherType: "cloudy",
		humidity: 75,
		windSpeed: 15,
		windDirection: 230,
		sunrise: new Date(Date.now() - 3 * 60 * 60 * 1000),
		sunset: new Date(Date.now() + 5 * 60 * 60 * 1000)
	},
	forecast: [
		{ date: Date.now() + 86400000, tempMin: 4, tempMax: 9, weatherType: "rain", precipitation: 5 },
		{ date: Date.now() + 2 * 86400000, tempMin: 2, tempMax: 7, weatherType: "rain", precipitation: 8 },
		{ date: Date.now() + 3 * 86400000, tempMin: 3, tempMax: 11, weatherType: "cloudy", precipitation: 2 },
		{ date: Date.now() + 4 * 86400000, tempMin: 5, tempMax: 10, weatherType: "cloudy", precipitation: 0 },
		{ date: Date.now() + 5 * 86400000, tempMin: 1, tempMax: 6, weatherType: "snow", precipitation: 10 }
	]
};

// ============================================
// Mock Calendar Events
// ============================================
const mockCalendarEvents = [
	{
		title: "Team Meeting",
		startDate: Date.now() + 2 * 60 * 60 * 1000,
		endDate: Date.now() + 3 * 60 * 60 * 1000,
		fullDayEvent: false
	},
	{
		title: "Dentist Appointment",
		startDate: Date.now() + 5 * 60 * 60 * 1000,
		endDate: Date.now() + 6 * 60 * 60 * 1000,
		fullDayEvent: false
	},
	{
		title: "Sarah's Birthday",
		startDate: Date.now() + 86400000,
		fullDayEvent: true
	},
	{
		title: "Project Deadline",
		startDate: Date.now() + 2 * 86400000,
		endDate: Date.now() + 2 * 86400000 + 60 * 60 * 1000,
		fullDayEvent: false
	},
	{
		title: "Yoga Class",
		startDate: Date.now() + 3 * 86400000 + 18 * 60 * 60 * 1000,
		endDate: Date.now() + 3 * 86400000 + 19 * 60 * 60 * 1000,
		fullDayEvent: false
	}
];

// ============================================
// Mock News Feed
// ============================================
const mockNewsItems = [
	{
		title: "New Technologies Revolutionize Daily Life",
		description: "Innovative solutions are changing our daily habits.",
		url: "#",
		pubdate: Date.now() - 2 * 60 * 60 * 1000
	},
	{
		title: "Weather Forecast: Cold Wave Expected",
		description: "Meteorologists warn of dropping temperatures.",
		url: "#",
		pubdate: Date.now() - 4 * 60 * 60 * 1000
	},
	{
		title: "Local Events This Weekend",
		description: "An overview of events in your city.",
		url: "#",
		pubdate: Date.now() - 6 * 60 * 60 * 1000
	},
	{
		title: "Scientists Make Groundbreaking Discovery",
		description: "New findings could change everything.",
		url: "#",
		pubdate: Date.now() - 8 * 60 * 60 * 1000
	},
	{
		title: "Sports: Exciting Games This Weekend",
		description: "Results from the most important matches.",
		url: "#",
		pubdate: Date.now() - 10 * 60 * 60 * 1000
	}
];

// Export for use in modules
window.mockData = {
	weather: mockWeatherData,
	calendar: mockCalendarEvents,
	news: mockNewsItems
};

console.log("Demo mocks loaded successfully");
