Module.register("sensehat", {
	defaults: {
		updateInterval: 5000,
		showTemperature: true,
		showHumidity: true,
		showPressure: true,
		showOrientation: false,
		temperatureUnit: "C", // "C" or "F"
		roundValues: 1,
		ledMatrixEnabled: true,
		ledMode: "status", // "off" | "status" | "text"
		ledText: "Hello from Sense HAT",
		ledColor: [0, 255, 0],
		criticalThresholds: {
			temperatureHigh: 30,
			temperatureLow: 10,
			humidityHigh: 80,
			humidityLow: 20
		},
		debug: false
	},

	start () {
		this.sensorData = null;
		this.ready = false;
		this.sendSocketNotification("SENSEHAT_CONFIG", this.config);
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "sensehat";

		// Loading state
		if (this.sensorData === null) {
			wrapper.innerHTML = "Loading Sense HAT data...";
			return wrapper;
		}

		const data = this.sensorData;

		// Error state from backend
		if (data && typeof data.error === "string" && data.error.trim() !== "") {
			wrapper.innerHTML = `Sense HAT error: ${data.error}`;
			return wrapper;
		}

		const hasAnyValue
			= typeof data.temperature === "number"
			  || typeof data.humidity === "number"
			  || typeof data.pressure === "number"
			  || (data.orientation
			    && (typeof data.orientation.pitch === "number"
			      || typeof data.orientation.roll === "number"
			      || typeof data.orientation.yaw === "number"));

		if (!hasAnyValue) {
			wrapper.innerHTML = "Sense HAT: no sensor data (check hardware or drivers)";
			return wrapper;
		}

		// Temperature
		if (this.config.showTemperature && typeof data.temperature === "number") {
			const t = this.config.temperatureUnit === "F" ? (data.temperature * 9) / 5 + 32 : data.temperature;
			const tEl = document.createElement("div");
			tEl.className = "small bright";
			tEl.innerHTML = `${this.round(t)} °${this.config.temperatureUnit}`;
			wrapper.appendChild(tEl);
		}

		// Humidity
		if (this.config.showHumidity && typeof data.humidity === "number") {
			const hEl = document.createElement("div");
			hEl.className = "xsmall light";
			hEl.innerHTML = `${this.round(data.humidity)} %`;
			wrapper.appendChild(hEl);
		}

		// Pressure
		if (this.config.showPressure && typeof data.pressure === "number") {
			const pEl = document.createElement("div");
			pEl.className = "xsmall light";
			pEl.innerHTML = `${this.round(data.pressure)} hPa`;
			wrapper.appendChild(pEl);
		}

		// Orientation
		if (this.config.showOrientation && data.orientation) {
			const o = data.orientation;
			const oEl = document.createElement("div");
			oEl.className = "xsmall dimmed";
			const pitch = typeof o.pitch === "number" ? this.round(o.pitch) : "-";
			const roll = typeof o.roll === "number" ? this.round(o.roll) : "-";
			const yaw = typeof o.yaw === "number" ? this.round(o.yaw) : "-";
			oEl.innerHTML = `P:${pitch}° R:${roll}° Y:${yaw}°`;
			wrapper.appendChild(oEl);
		}

		return wrapper;
	},

	round (value) {
		const places = Math.max(0, parseInt(this.config.roundValues || 0, 10));
		const p = Math.pow(10, places);
		return Math.round(value * p) / p;
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "SENSEHAT_DATA") {
			this.sensorData = payload;
			this.updateDom();

			// Optional LED status logic
			if (this.config.ledMatrixEnabled && this.config.ledMode !== "text") {
				// Only act when we have real numeric data and no error
				const hasNumeric = typeof payload.temperature === "number" || typeof payload.humidity === "number";
				if (!(hasNumeric) || (payload && typeof payload.error === "string" && payload.error.trim() !== "")) {
					return;
				}
				const { temperatureHigh, temperatureLow, humidityHigh, humidityLow } = this.config.criticalThresholds || {};
				let color = this.config.ledColor || [0, 255, 0];

				if (
					(typeof payload.temperature === "number"
					  && (((temperatureHigh !== null && temperatureHigh !== undefined) && payload.temperature > temperatureHigh)
					    || ((temperatureLow !== null && temperatureLow !== undefined) && payload.temperature < temperatureLow)))
			    || (typeof payload.humidity === "number"
			      && (((humidityHigh !== null && humidityHigh !== undefined) && payload.humidity > humidityHigh)
			        || ((humidityLow !== null && humidityLow !== undefined) && payload.humidity < humidityLow)))
				) {
					color = [255, 0, 0]; // red
				} else {
					color = [0, 200, 0]; // green
				}

				this.sendSocketNotification("SENSEHAT_LED_COMMAND", {
					mode: this.config.ledMode || "status",
					color
				});
			}
		}
	}
});
