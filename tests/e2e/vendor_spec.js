import vendors from "../../js/vendor.mjs";
import { startApplication, stopApplication } from "./helpers/global-setup.mjs";

describe("Vendors", () => {
	beforeAll(async () => {
		await startApplication("tests/configs/default.js");
	});

	afterAll(async () => {
		await stopApplication();
	});

	describe("Get list vendors", () => {
		Object.keys(vendors).forEach((vendor) => {
			it(`should return 200 HTTP code for vendor "${vendor}"`, async () => {
				const urlVendor = `http://localhost:8080/${vendors[vendor]}`;
				const res = await fetch(urlVendor);
				expect(res.status).toBe(200);
			});
		});
	});
});
