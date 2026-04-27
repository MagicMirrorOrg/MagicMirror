import Module from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Creates a fresh weather node helper instance with isolated mocks.
 * @returns {Promise<object>} The mocked weather node helper.
 */
async function loadWeatherNodeHelper () {
	vi.resetModules();

	const loggerMock = {
		log: vi.fn(),
		warn: vi.fn(),
		error: vi.fn()
	};
	const originalRequire = Module.prototype.require;

	Module.prototype.require = function (id) {
		if (id === "node_helper") {
			return {
				create: vi.fn((definition) => definition)
			};
		}

		if (id === "logger") {
			return loggerMock;
		}

		return originalRequire.apply(this, arguments);
	};

	let helper;
	try {
		const helperModule = await import("../../../../../defaultmodules/weather/node_helper");
		helper = helperModule.default || helperModule;
	} finally {
		Module.prototype.require = originalRequire;
	}

	helper.providers = {};
	helper.lastData = {};
	helper.sendSocketNotification = vi.fn();

	return helper;
}

afterEach(() => {
	vi.resetAllMocks();
	vi.resetModules();
});

describe("weather node_helper reconnect handling", () => {
	it("re-sends cached weather data when a client reconnects", async () => {
		const helper = await loadWeatherNodeHelper();
		const instanceId = "weather-current";
		const cachedPayload = {
			instanceId,
			type: "current",
			data: { temperature: 8.5 }
		};

		helper.providers[instanceId] = { locationName: "Munich, BY" };
		helper.lastData[instanceId] = cachedPayload;

		await helper.initWeatherProvider({
			weatherProvider: "openmeteo",
			instanceId,
			type: "current"
		});

		expect(helper.sendSocketNotification).toHaveBeenNthCalledWith(1, "WEATHER_INITIALIZED", {
			instanceId,
			locationName: "Munich, BY"
		});
		expect(helper.sendSocketNotification).toHaveBeenNthCalledWith(2, "WEATHER_DATA", cachedPayload);
		expect(helper.sendSocketNotification).toHaveBeenCalledTimes(2);
	});

	it("does not send WEATHER_DATA on reconnect when no cached payload exists", async () => {
		const helper = await loadWeatherNodeHelper();
		const instanceId = "weather-current";

		helper.providers[instanceId] = { locationName: "Munich, BY" };

		await helper.initWeatherProvider({
			weatherProvider: "openmeteo",
			instanceId,
			type: "current"
		});

		expect(helper.sendSocketNotification).toHaveBeenCalledWith("WEATHER_INITIALIZED", {
			instanceId,
			locationName: "Munich, BY"
		});
		expect(helper.sendSocketNotification).toHaveBeenCalledTimes(1);
	});

	it("cleans up provider and cached data when stopping an instance", async () => {
		const helper = await loadWeatherNodeHelper();
		const instanceId = "weather-current";
		const stop = vi.fn();

		helper.providers[instanceId] = { stop };
		helper.lastData[instanceId] = {
			instanceId,
			type: "current",
			data: { temperature: 8.5 }
		};

		helper.stopWeatherProvider(instanceId);

		expect(stop).toHaveBeenCalledTimes(1);
		expect(helper.providers[instanceId]).toBeUndefined();
		expect(helper.lastData[instanceId]).toBeUndefined();
	});
});
