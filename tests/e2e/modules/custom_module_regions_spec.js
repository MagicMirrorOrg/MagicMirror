const helpers = require("../helpers/global-setup");

helpers.fixupIndex();

describe("Position of modules", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/customregions.js");
		await helpers.getDocument();
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	const positions = ["row3_left", "top3_left1"];

	for (const position of positions) {
		const className = position.replace("_", ".");
		it(`should show text in ${position}`, async () => {
			const elem = await helpers.waitForElement(`.${className}`);
			expect(elem).not.toBeNull();
			expect(elem.textContent).toContain(`Text in ${position}`);
		});
	}
});

helpers.restoreIndex();
