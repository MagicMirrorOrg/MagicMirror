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
	let i = 0;
	const className1 = positions[i].replace("_", ".");
	let message1 = positions[i];
	it(`should show text in ${message1}`, async () => {
		const elem = await helpers.waitForElement(`.${className1}`);
		expect(elem).not.toBeNull();
		expect(elem.textContent).toContain(`Text in ${message1}`);
	});
	i = 1;
	const className2 = positions[i].replace("_", ".");
	let message2 = positions[i];
	it(`should NOT show text in ${message2}`, async () => {
		const elem = await helpers.waitForElement(`.${className2}`, "", 1500);
		expect(elem).toBeNull();
	}, 1510);
});
