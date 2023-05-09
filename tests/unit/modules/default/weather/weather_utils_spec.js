const weather = require("../../../../../modules/default/weather/weatherutils");

describe("Weather utils tests", () => {
	describe("convertPrecipitationUnit tests", () => {
		it("should keep value and unit if outputUnit is undefined", () => {
			const values = [1, 2];
			const units = ["mm", "cm"];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], units[i], undefined);
				expect(result).toBe(`${values[i].toFixed(2)} ${units[i]}`);
			}
		});

		it("should keep value and unit if outputUnit is metric", () => {
			const values = [1, 2];
			const units = ["mm", "cm"];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], units[i], "metric");
				expect(result).toBe(`${values[i].toFixed(2)} ${units[i]}`);
			}
		});

		it("should use mm unit if input unit is undefined", () => {
			const values = [1, 2];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], undefined, "metric");
				expect(result).toBe(`${values[i].toFixed(2)} mm`);
			}
		});

		it("should convert value and unit if outputUnit is imperial", () => {
			const values = [1, 2];
			const units = ["mm", "cm"];
			const expectedValues = [0.04, 0.79];

			for (let i = 0; i < values.length; i++) {
				const result = weather.convertPrecipitationUnit(values[i], units[i], "imperial");
				expect(result).toBe(`${expectedValues[i]} in`);
			}
		});
	});
});
