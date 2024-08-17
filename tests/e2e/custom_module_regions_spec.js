const helpers = require("./helpers/global-setup");

describe("Custom Position of modules", () => {
	beforeAll(async () => {
		await helpers.fixupIndex();
		await helpers.startApplication("tests/configs/customregions.js");
		await helpers.getDocument();
	});
	afterAll(async () => {
		await helpers.stopApplication();
		await helpers.restoreIndex();
	});

	const positions = ["row3_left", "top3_left1"];

	for (let i in positions) {
		const className = positions[i].replace("_", ".");
		if (i === 0) {
			it(`should show text in ${positions[i]}`, async () => {
				const elem = await helpers.waitForElement(`.${className}`);
				expect(elem).not.toBeNull();
				expect(elem.textContent).toContain(`Text in ${positions[i]}`);
			});
		}
		else {
			it(`should NOT show text in ${positions[i]}`, async () => {
				const elem = await helpers.waitForElement(`.${className}`, "", 1500);
				expect(elem).toBeNull();
			}, 1510);
		}
	}
});
