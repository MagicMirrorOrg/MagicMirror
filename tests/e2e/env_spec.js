const { expect } = require("playwright/test");
const helpers = require("./helpers/global-setup");

describe("App environment", () => {
	let page;

	beforeAll(async () => {
		await helpers.startApplication("tests/configs/default.js");
		await helpers.getDocument();
		page = helpers.getPage();
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("get request from http://localhost:8080 should return 200", async () => {
		const res = await fetch("http://localhost:8080");
		expect(res.status).toBe(200);
	});

	it("get request from http://localhost:8080/nothing should return 404", async () => {
		const res = await fetch("http://localhost:8080/nothing");
		expect(res.status).toBe(404);
	});

	it("should show the title MagicMirror²", async () => {
		await expect(page).toHaveTitle("MagicMirror²");
	});
});
