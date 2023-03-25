global.moment = require("moment");
const Utils = require("../../../modules/default/utils");

describe("Module utils", () => {
	describe("formatTime", () => {
		const time = new Date();

		it("should convert correctly according to the config", () => {
			time.setHours(13, 13);
			expect(
				Utils.formatTime(
					{
						timeFormat: 24
					},
					time
				)
			).toBe("13:13");
			expect(
				Utils.formatTime(
					{
						showPeriod: true,
						showPeriodUpper: true,
						timeFormat: 12
					},
					time
				)
			).toBe("1:13 PM");
			expect(
				Utils.formatTime(
					{
						showPeriod: true,
						showPeriodUpper: false,
						timeFormat: 12
					},
					time
				)
			).toBe("1:13 pm");
			expect(
				Utils.formatTime(
					{
						showPeriod: false,
						timeFormat: 12
					},
					time
				)
			).toBe("1:13");
		});
	});
});
