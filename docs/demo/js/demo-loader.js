/* MagicMirror² Demo - Module Loader
 * Loads and initializes real MagicMirror modules for the demo mode
 */

(function () {
	"use strict";

	// Extend Module class with demo-specific overrides
	const originalModuleRegister = Module.register;

	Module.register = function (name, moduleDefinition) {
		console.log("Registering module:", name);

		// Override specific methods for demo mode
		const originalStart = moduleDefinition.start;
		moduleDefinition.start = async function () {
			console.log(`Starting module: ${name}`);

			// Call original start if exists
			if (originalStart) {
				await originalStart.call(this);
			}

			// Module-specific demo setups AFTER starting (so weatherProvider exists)
			if (name === "weather") {
				setupWeatherDemo.call(this);
			} else if (name === "calendar") {
				setupCalendarDemo.call(this);
			} else if (name === "newsfeed") {
				setupNewsfeedDemo.call(this);
			}
		};

		// Call original register
		return originalModuleRegister.call(this, name, moduleDefinition);
	};

	// ============================================
	// Weather Demo Setup
	// ============================================
	/**
	 *
	 */
	function setupWeatherDemo () {
		const self = this;
		const provider = this.weatherProvider;

		if (!provider) {
			console.error("Weather provider not initialized");
			return;
		}

		console.log("Weather: Setting up mock data");

		// Override getDom to render without nunjucks template
		this.getDom = function () {
			const wrapper = document.createElement("div");

			const current = this.weatherProvider?.currentWeather();
			if (!current) {
				wrapper.innerHTML = "Lade Wetter...";
				return wrapper;
			}

			// Temperature display
			const tempWrapper = document.createElement("div");
			tempWrapper.className = "large light";

			const icon = document.createElement("span");
			icon.className = `wi weathericon wi-${current.weatherType}`;
			tempWrapper.appendChild(icon);

			const temp = document.createElement("span");
			temp.className = "bright";
			temp.innerHTML = ` ${current.temperature.toFixed(1)}°`;
			tempWrapper.appendChild(temp);

			wrapper.appendChild(tempWrapper);

			// Additional info
			if (!this.config.onlyTemp) {
				const detailsWrapper = document.createElement("div");
				detailsWrapper.className = "normal medium";

				// Wind
				const wind = document.createElement("span");
				wind.innerHTML = `<span class="wi wi-strong-wind dimmed"></span> ${current.windSpeed.toFixed(0)} m/s`;
				detailsWrapper.appendChild(wind);

				// Humidity
				if (current.humidity) {
					const humidity = document.createElement("span");
					humidity.innerHTML = ` <span class="humidity">${current.humidity}%</span>`;
					detailsWrapper.appendChild(humidity);
				}

				wrapper.appendChild(detailsWrapper);
			}

			return wrapper;
		};

		// Override fetch methods to use mock data
		provider.fetchCurrentWeather = function () {
			console.log("Weather: Using mock current weather data");

			// Use the real WeatherObject class
			const current = new WeatherObject();
			current.date = moment();
			current.temperature = mockData.weather.current.temperature;
			current.feelsLikeTemp = mockData.weather.current.feelsLike;
			current.weatherType = mockData.weather.current.weatherType;
			current.humidity = mockData.weather.current.humidity;
			current.windSpeed = mockData.weather.current.windSpeed;
			current.windFromDirection = mockData.weather.current.windDirection;
			current.sunrise = moment(mockData.weather.current.sunrise);
			current.sunset = moment(mockData.weather.current.sunset);

			this.setCurrentWeather(current);
			this.updateAvailable();
		};

		provider.fetchWeatherForecast = function () {
			console.log("Weather: Using mock forecast data");

			const forecasts = mockData.weather.forecast.map((f) => {
				const fc = new WeatherObject();
				fc.date = moment(f.date);
				fc.minTemperature = f.tempMin;
				fc.maxTemperature = f.tempMax;
				fc.weatherType = f.weatherType;
				fc.precipitationAmount = f.precipitation;
				return fc;
			});

			this.setWeatherForecast(forecasts);
			this.updateAvailable();
		};

		provider.fetchWeatherHourly = function () {
			console.log("Weather: Mock hourly data not implemented");
		};
	}

	// ============================================
	// Calendar Demo Setup
	// ============================================
	/**
	 *
	 */
	function setupCalendarDemo () {
		const self = this;

		// Mark as loaded
		this.loaded = true;

		// Override addCalendar to prevent actual fetching
		this.addCalendar = function () {};

		// Simulate calendar events
		setTimeout(() => {
			const events = mockData.calendar.map((e) => ({
				title: e.title,
				startDate: e.startDate,
				endDate: e.endDate || e.startDate,
				fullDayEvent: e.fullDayEvent || false,
				location: "",
				geo: null,
				description: "",
				today: e.startDate >= Date.now() && e.startDate < Date.now() + 86400000
			}));

			// Sort by start date
			events.sort((a, b) => a.startDate - b.startDate);

			// Set events directly on the module in the expected format
			self.calendarData = {
				mock_calendar: {
					events: events
				}
			};

			// Broadcast calendar events
			self.broadcastEvents(events);

			// Update display
			self.updateDom(300);
		}, 500);
	}

	// ============================================
	// Newsfeed Demo Setup
	// ============================================
	/**
	 *
	 */
	function setupNewsfeedDemo () {
		const self = this;
		let currentIndex = 0;

		// Override getDom to render without nunjucks template
		this.getDom = function () {
			const wrapper = document.createElement("div");
			wrapper.className = "newsfeed";

			if (!this.newsItems || this.newsItems.length === 0) {
				wrapper.innerHTML = "Loading news...";
				return wrapper;
			}

			const item = this.newsItems[this.activeItem || 0];
			if (!item) {
				return wrapper;
			}

			const titleWrapper = document.createElement("div");
			titleWrapper.className = "newsfeed-title";

			if (this.config.showSourceTitle && item.sourceTitle) {
				const source = document.createElement("span");
				source.className = "newsfeed-source";
				source.innerHTML = `${item.sourceTitle}: `;
				titleWrapper.appendChild(source);
			}

			const title = document.createElement("span");
			title.innerHTML = item.title;
			titleWrapper.appendChild(title);

			wrapper.appendChild(titleWrapper);

			if (this.config.showDescription && item.description) {
				const desc = document.createElement("div");
				desc.className = "newsfeed-desc";
				desc.innerHTML = item.description;
				wrapper.appendChild(desc);
			}

			return wrapper;
		};

		// Override startFetch
		this.startFetch = function () {
			console.log("Newsfeed: Using mock data");
		};

		// Simulate news items cycling
		const updateNews = () => {
			const item = mockData.news[currentIndex % mockData.news.length];
			self.newsItems = [item];
			self.activeItem = 0;
			self.loaded = true;
			self.updateDom(self.config.animationSpeed || 1000);

			currentIndex++;
			setTimeout(updateNews, self.config.updateInterval || 10000);
		};

		setTimeout(updateNews, 500);
	}

	console.log("Demo loader initialized");
}());
