import moment from "moment-timezone";
import { formatTime } from "../../../../defaultmodules/utils.mjs";

globalThis.moment = moment;

describe("Default modules utils tests", () => {
	describe("formatTime", () => {
		const time = new Date();

		beforeEach(() => {
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
