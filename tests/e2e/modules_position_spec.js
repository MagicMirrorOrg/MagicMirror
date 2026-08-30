const helpers = require("./helpers/global-setup");

const getPage = () => helpers.getPage();

describe("Position of modules", () => {
	beforeAll(async () => {
		await helpers.startApplication("tests/configs/modules/positions.js");
		await helpers.getDocument();
	});

	afterAll(async () => {
		await helpers.stopApplication();
	});

	const positions = ["top_bar", "top_left", "top_center", "top_right", "upper_third", "middle_center", "lower_third", "bottom_left", "bottom_center", "bottom_right", "bottom_bar", "fullscreen_above", "fullscreen_below"];

	for (const position of positions) {
		const className = position.replace("_", ".");
		it(`should show text in ${position}`, async () => {
			const locator = getPage().locator(`.${className} .module-content`).first();
			await locator.waitFor({ state: "visible" });
			const text = await locator.textContent();
			expect(text).not.toBeNull();
			expect(text).toContain(`Text in ${position}`);
		});
	}
});
