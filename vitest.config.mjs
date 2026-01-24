import { defineConfig } from "vitest/config";

/*
 * Sequential execution keeps our shared test server stable:
 * - All suites bind to port 8080
 * - Fixtures and temp paths are reused between tests
 * - Debugging becomes predictable
 *
 * Parallel execution would require dynamic ports and isolated fixtures,
 * so we intentionally cap Vitest at a single worker for now.
 *
 * Projects separate unit, e2e (Playwright), and electron tests with
 * appropriate timeouts for each test type.
 */

export default defineConfig({
	test: {
		// Shared settings for all test types
		globals: true,
		environment: "node",
		setupFiles: ["./tests/utils/vitest-setup.js"],
		// Stop test execution on first failure
		bail: 3,

		// Shared exclude patterns
		exclude: [
			"**/node_modules/**",
			"**/dist/**",
			"tests/unit/mocks/**",
			"tests/unit/helpers/**",
			"tests/electron/helpers/**",
			"tests/e2e/helpers/**",
			"tests/e2e/mocks/**",
			"tests/configs/**",
			"tests/utils/**"
		],

		// Projects with specific configurations per test type
		projects: [
			{
				test: {
					name: "unit",
					globals: true,
					environment: "node",
					setupFiles: ["./tests/utils/vitest-setup.js"],
					include: [
						"tests/unit/**/*_spec.js",
						"tests/unit/modules/default/calendar/calendar_fetcher_utils_bad_rrule.js"
					],
					testTimeout: 20000,
					hookTimeout: 10000
				}
			},
			{
				test: {
					name: "e2e",
					globals: true,
					environment: "node",
					setupFiles: ["./tests/utils/vitest-setup.js"],
					include: ["tests/e2e/**/*_spec.js"],
					testTimeout: 60000,
					hookTimeout: 30000
				}
			},
			{
				test: {
					name: "electron",
					globals: true,
					environment: "node",
					setupFiles: ["./tests/utils/vitest-setup.js"],
					include: ["tests/electron/**/*_spec.js"],
					testTimeout: 120000,
					hookTimeout: 30000
				}
			}
		],

		// Coverage configuration
		coverage: {
			provider: "v8",
			reporter: ["lcov", "text"],
			include: [
				"clientonly/**/*.js",
				"js/**/*.js",
				"modules/default/**/*.js",
				"serveronly/**/*.js"
			],
			exclude: [
				"**/node_modules/**",
				"**/tests/**",
				"**/dist/**"
			]
		},

		/*
		 * Pool settings for isolated test execution. Keep maxWorkers at 1 so
		 * port 8080 and shared fixtures remain safe across the full suite.
		 */
		pool: "forks",
		maxWorkers: 1,
		isolate: true
	}
});
