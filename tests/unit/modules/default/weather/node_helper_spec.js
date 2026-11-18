import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node_helper", () => ({
	default: { create: (definition) => definition }
}));

vi.mock("logger", () => ({
	default: { log: vi.fn(), warn: vi.fn(), error: vi.fn() }
}));

import helper from "../../../../../defaultmodules/weather/node_helper.js";

beforeEach(() => {
	helper.providers = {};
	helper.lastData = {};
	helper.sendSocketNotification = vi.fn();
});

describe("weather node_helper reconnect handling", () => {
	it("re-sends cached weather data when a client reconnects", async () => {
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

	it("rejects unsupported weather providers before loading a module", async () => {
		await helper.initWeatherProvider({
			weatherProvider: "../../calendar/node_helper",
			instanceId: "weather-current",
			type: "current"
		});

		expect(helper.sendSocketNotification).toHaveBeenCalledWith("WEATHER_ERROR", {
			instanceId: "weather-current",
			error: "Unsupported weather provider: ../../calendar/node_helper"
		});
	});

	it("cleans up provider and cached data when stopping an instance", () => {
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
