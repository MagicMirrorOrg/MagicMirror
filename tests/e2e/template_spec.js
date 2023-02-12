const helpers = require("./helpers/global-setup");

describe("templated config with port variable", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/port_variable.js");
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("should return 200", async () => {
		const res = await helpers.fetch("http://localhost:8090");
		expect(res.status).toBe(200);
	});
});
