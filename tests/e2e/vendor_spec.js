const helpers = require("./helpers/global-setup");

describe("Vendors", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/default.js");
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Get list vendors", () => {
		const vendors = require(`${__dirname}/../../vendor/vendor.js`);

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, async () => {
				const urlVendor = `http://localhost:8080/vendor/${vendors[vendor]}`;
				const res = await fetch(urlVendor);
				expect(res.status).toBe(200);
			});
		});

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 404 HTTP code for vendor https://localhost/"${vendor}"`, async () => {
				const urlVendor = `http://localhost:8080/${vendors[vendor]}`;
				const res = await fetch(urlVendor);
				expect(res.status).toBe(404);
			});
		});
	});
});
