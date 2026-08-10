import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";

const TEST_URL = "https://weather-provider.test/data";
const server = setupServer();

class TestProvider {
	constructor (WeatherProvider, onData) {
		this.provider = new WeatherProvider();
		this.onData = onData;
	}

	setCallbacks (onData, onError) {
		this.provider.setCallbacks(onData, onError);
	}

	initialize () {
		this.provider._createJSONFetcher(TEST_URL, { reloadInterval: 60000 }, this.onData);
	}

	start () {
		this.provider.start();
	}

	stop () {
		this.provider.stop();
	}
}

let WeatherProvider;

beforeAll(async () => {
	server.listen({ onUnhandledRequest: "error" });
	const module = await import("../../../../../defaultmodules/weather/weatherprovider");
	WeatherProvider = module.default || module;
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	server.resetHandlers();
});

describe("WeatherProvider", () => {
	it("should ignore 304 responses", async () => {
		server.use(
			http.get(TEST_URL, () => new HttpResponse(null, { status: 304 }))
		);
		const onData = vi.fn();
		const provider = new TestProvider(WeatherProvider, onData);
		provider.setCallbacks(onData, vi.fn());
		provider.initialize();
		provider.start();

		await vi.waitFor(() => expect(provider.provider.fetcher).toBeDefined());
		await new Promise((resolve) => setTimeout(resolve, 25));
		provider.stop();

		expect(onData).not.toHaveBeenCalled();
	});

	it("should report JSON parse failures", async () => {
		server.use(
			http.get(TEST_URL, () => HttpResponse.text("not json"))
		);
		const onError = vi.fn();
		const provider = new TestProvider(WeatherProvider, vi.fn());
		provider.setCallbacks(vi.fn(), onError);
		provider.initialize();
		provider.start();

		await vi.waitFor(() => expect(onError).toHaveBeenCalledWith({
			message: "Failed to parse API response",
			translationKey: "MODULE_ERROR_UNSPECIFIED"
		}));
		provider.stop();
	});

	it("should report data processing failures separately", async () => {
		server.use(
			http.get(TEST_URL, () => HttpResponse.json({ forecast: [] }))
		);
		const onError = vi.fn();
		const provider = new TestProvider(WeatherProvider, () => {
			throw new Error("processing failed");
		});
		provider.setCallbacks(vi.fn(), onError);
		provider.initialize();
		provider.start();

		await vi.waitFor(() => expect(onError).toHaveBeenCalledWith({
			message: "Failed to process weather data",
			translationKey: "MODULE_ERROR_UNSPECIFIED"
		}));
		provider.stop();
	});
});
