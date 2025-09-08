const helpers = require("./helpers/global-setup");

describe("Vendors", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/default.js");
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Get list vendors", () => {
		const vendors = require(`${global.root_path}/js/vendor.js`);

		Object.keys(vendors).forEach((vendor) => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, async () => {
				const urlVendor = `http://localhost:8080/${vendors[vendor]}`;
				const res = await fetch(urlVendor);
				expect(res.status).toBe(200);
			});
		});
	});
});
