const TestSequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends TestSequencer {
	sort (tests) {
		const orderPath = ["unit", "electron", "e2e"];
		return tests.sort((testA, testB) => {
			let indexA = -1;
			let indexB = -1;
			const reg = ".*/tests/([^/]*).*";

			// move calendar and newsfeed at the end
			if (testA.path.includes("e2e/modules/calendar_spec") || testA.path.includes("e2e/modules/newsfeed_spec")) return 1;
			if (testB.path.includes("e2e/modules/calendar_spec") || testB.path.includes("e2e/modules/newsfeed_spec")) return -1;

			let matchA = new RegExp(reg, "g").exec(testA.path);
			if (matchA.length > 0) indexA = orderPath.indexOf(matchA[1]);

			let matchB = new RegExp(reg, "g").exec(testB.path);
			if (matchB.length > 0) indexB = orderPath.indexOf(matchB[1]);

			if (indexA === indexB) return 0;

			if (indexA === -1) return 1;
			if (indexB === -1) return -1;
			return indexA < indexB ? -1 : 1;
		});
	}
}

module.exports = CustomSequencer;
