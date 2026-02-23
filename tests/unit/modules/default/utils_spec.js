global.moment = require("moment-timezone");
const defaults = require("../../../../js/defaults");

const { formatTime } = require(`../../../../${defaults.defaultModulesDir}/utils`);

describe("Default modules utils tests", () => {
	describe("formatTime", () => {
		const time = new Date();

		beforeEach(async () => {
			time.setHours(13, 13);
		});

		it("should convert correctly according to the config", () => {
			expect(
				formatTime(
					{
						timeFormat: 24
					},
					time
				)
			).toBe("13:13");
			expect(
				formatTime(
					{
						showPeriod: true,
						showPeriodUpper: true,
						timeFormat: 12
					},
					time
				)
			).toBe("1:13 PM");
			expect(
				formatTime(
					{
						showPeriod: true,
						showPeriodUpper: false,
						timeFormat: 12
					},
					time
				)
			).toBe("1:13 pm");
			expect(
				formatTime(
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
