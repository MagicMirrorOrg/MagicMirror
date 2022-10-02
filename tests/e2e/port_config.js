const helpers = require("./global-setup");

describe("port directive configuration", () => {
	describe("Set port 8090", () => {
		beforeAll(() => {
			helpers.startApplication("tests/configs/port_8090.js");
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 200", (done) => {
			helpers.fetch(done, "http://localhost:8090").then((res) => {
				expect(res.status).toBe(200);
			});
		});
	});

	describe("Set port 8100 on environment variable MM_PORT", () => {
		beforeAll(() => {
			helpers.startApplication("tests/configs/port_8090.js", (process.env.MM_PORT = 8100));
		});
		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 200", (done) => {
			helpers.fetch(done, "http://localhost:8100").then((res) => {
				expect(res.status).toBe(200);
			});
		});
	});
});
