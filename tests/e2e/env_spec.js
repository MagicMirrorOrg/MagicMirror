const helpers = require("./helpers/global-setup");

describe("App environment", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/default.js");
		await helpers.getDocument();
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("get request from http://localhost:8080 should return 200", async () => {
		const res = await helpers.fetch("http://localhost:8080");
		expect(res.status).toBe(200);
	});

	it("get request from http://localhost:8080/nothing should return 404", async () => {
		const res = await helpers.fetch("http://localhost:8080/nothing");
		expect(res.status).toBe(404);
	});

	it("should show the title MagicMirror²", async () => {
		const elem = await helpers.waitForElement("title");
		expect(elem).not.toBe(null);
		expect(elem.textContent).toBe("MagicMirror²");
	});
});
