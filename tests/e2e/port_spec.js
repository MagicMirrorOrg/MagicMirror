const helpers = require("./helpers/global-setup");

describe("port directive configuration", () => {
	describe("Set port 8090", () => {
		beforeAll(async () => {
			await helpers.startApplication("tests/configs/port_8090.js");
		});

		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 200", async () => {
			const res = await fetch(`http://localhost:${global.testPort}`);
			expect(res.status).toBe(200);
		});
	});

	describe("Set port 8100 on environment variable MM_PORT", () => {
		beforeAll(async () => {
			process.env.MM_PORT = "8100";
			await helpers.startApplication("tests/configs/port_8090.js");
		});

		afterAll(async () => {
			await helpers.stopApplication();
		});

		it("should return 200", async () => {
			expect(global.testPort).toBe(8100);
			const res = await fetch(`http://localhost:${global.testPort}`);
			expect(res.status).toBe(200);
		});
	});
});
