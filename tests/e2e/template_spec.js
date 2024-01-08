const fs = require("node:fs");
const helpers = require("./helpers/global-setup");

describe("templated config with port variable", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/port_variable.js");
	});
	afterAll(async () => {
		await helpers.stopApplication();
		try {
			fs.unlinkSync("tests/configs/port_variable.js");
		} catch (err) {
			// do nothing
		}
	});

	it("should return 200", async () => {
		const res = await fetch("http://localhost:8090");
		expect(res.status).toBe(200);
	});
});
