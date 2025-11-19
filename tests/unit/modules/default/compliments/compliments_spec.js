describe("Compliments module", () => {
	let complimentsModule;

	beforeEach(() => {
		// Mock global dependencies
		global.Module = {
			register: vi.fn((name, moduleDefinition) => {
				complimentsModule = moduleDefinition;
			})
		};
		global.Log = {
			info: vi.fn(),
			warn: vi.fn(),
			error: vi.fn()
		};
		global.Cron = vi.fn();

		// Load the module
		require("../../../../../modules/default/compliments/compliments");

		// Setup module instance
		complimentsModule.config = { ...complimentsModule.defaults };
		complimentsModule.name = "compliments";
		complimentsModule.file = vi.fn((path) => `http://localhost:8080/modules/default/compliments/${path}`);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("loadComplimentFile", () => {
		describe("HTTP error handling", () => {
			it("should return null and log error on HTTP 404", async () => {
				complimentsModule.config.remoteFile = "http://example.com/missing.json";

				global.fetch = vi.fn(() => Promise.resolve({
					ok: false,
					status: 404,
					statusText: "Not Found"
				}));

				const result = await complimentsModule.loadComplimentFile();

				expect(result).toBeNull();
				expect(Log.error).toHaveBeenCalledWith("[compliments] HTTP error: 404 Not Found");
			});

			it("should return null and log error on HTTP 500", async () => {
				complimentsModule.config.remoteFile = "http://example.com/error.json";

				global.fetch = vi.fn(() => Promise.resolve({
					ok: false,
					status: 500,
					statusText: "Internal Server Error"
				}));

				const result = await complimentsModule.loadComplimentFile();

				expect(result).toBeNull();
				expect(Log.error).toHaveBeenCalledWith("[compliments] HTTP error: 500 Internal Server Error");
			});

			it("should return content on successful HTTP 200", async () => {
				complimentsModule.config.remoteFile = "http://example.com/compliments.json";
				const expectedContent = "{\"anytime\":[\"Test compliment\"]}";

				global.fetch = vi.fn(() => Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(expectedContent)
				}));

				const result = await complimentsModule.loadComplimentFile();

				expect(result).toBe(expectedContent);
				expect(Log.error).not.toHaveBeenCalled();
			});
		});

		describe("Cache-busting with query parameters", () => {
			beforeEach(() => {
				vi.useFakeTimers();
				vi.setSystemTime(new Date("2025-01-01T12:00:00.000Z"));
			});

			afterEach(() => {
				vi.useRealTimers();
			});

			it("should add cache-busting parameter to URL without query params", async () => {
				complimentsModule.config.remoteFile = "http://example.com/compliments.json";
				complimentsModule.config.remoteFileRefreshInterval = 60000;

				global.fetch = vi.fn(() => Promise.resolve({
					ok: true,
					text: () => Promise.resolve("{}")
				}));

				await complimentsModule.loadComplimentFile();

				expect(fetch).toHaveBeenCalledWith(expect.stringContaining("?dummy=1735732800000"));
			});

			it("should add cache-busting parameter to URL with existing query params", async () => {
				complimentsModule.config.remoteFile = "http://example.com/compliments.json?lang=en";
				complimentsModule.config.remoteFileRefreshInterval = 60000;

				global.fetch = vi.fn(() => Promise.resolve({
					ok: true,
					text: () => Promise.resolve("{}")
				}));

				await complimentsModule.loadComplimentFile();

				const calledUrl = fetch.mock.calls[0][0];
				expect(calledUrl).toContain("lang=en");
				expect(calledUrl).toContain("&dummy=1735732800000");
				expect(calledUrl).not.toContain("?dummy=");
			});

			it("should not add cache-busting parameter when remoteFileRefreshInterval is 0", async () => {
				complimentsModule.config.remoteFile = "http://example.com/compliments.json";
				complimentsModule.config.remoteFileRefreshInterval = 0;

				global.fetch = vi.fn(() => Promise.resolve({
					ok: true,
					text: () => Promise.resolve("{}")
				}));

				await complimentsModule.loadComplimentFile();

				expect(fetch).toHaveBeenCalledWith("http://example.com/compliments.json");
			});

			it("should not add cache-busting parameter to local files", async () => {
				complimentsModule.config.remoteFile = "compliments.json";
				complimentsModule.config.remoteFileRefreshInterval = 60000;

				global.fetch = vi.fn(() => Promise.resolve({
					ok: true,
					text: () => Promise.resolve("{}")
				}));

				await complimentsModule.loadComplimentFile();

				const calledUrl = fetch.mock.calls[0][0];
				expect(calledUrl).toBe("http://localhost:8080/modules/default/compliments/compliments.json");
				expect(calledUrl).not.toContain("dummy=");
			});
		});
	});
});
