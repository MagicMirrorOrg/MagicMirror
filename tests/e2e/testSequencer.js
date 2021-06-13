const Sequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends Sequencer {
	sort(tests) {
		let copyTests = Array.from(tests);
		copyTests = copyTests.sort((testA, testB) => (testA.path > testB.path ? -1 : 1));
		return (copyTests = copyTests.sort((testA, testB) => (testA.path.includes("/modules/") ? 1 : -1)));
	}
}

module.exports = CustomSequencer;
