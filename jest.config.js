const config = {
	verbose: true,
	testTimeout: 20000,
	testSequencer: "<rootDir>/tests/utils/test_sequencer.js",
	projects: [
		{
			displayName: "unit",
			globalSetup: "<rootDir>/tests/unit/helpers/global-setup.js",
			moduleNameMapper: {
				logger: "<rootDir>/js/logger.js"
			},
			testMatch: ["**/tests/unit/**/*.[jt]s?(x)"],
			testPathIgnorePatterns: ["<rootDir>/tests/unit/mocks", "<rootDir>/tests/unit/helpers"]
		},
		{
			displayName: "electron",
			testMatch: ["**/tests/electron/**/*.[jt]s?(x)"],
			testPathIgnorePatterns: ["<rootDir>/tests/electron/helpers"]
		},
		{
			displayName: "e2e",
			testMatch: ["**/tests/e2e/**/*.[jt]s?(x)"],
			modulePaths: ["<rootDir>/js/"],
			testPathIgnorePatterns: ["<rootDir>/tests/e2e/helpers", "<rootDir>/tests/e2e/mocks"]
		}
	],
	collectCoverageFrom: [
		"<rootDir>/clientonly/**/*.js",
		"<rootDir>/js/**/*.js",
		"<rootDir>/modules/default/**/*.js",
		"<rootDir>/serveronly/**/*.js"
	],
	coverageReporters: ["lcov", "text"],
	coverageProvider: "v8"
};

module.exports = config;
