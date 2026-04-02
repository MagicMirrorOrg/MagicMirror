import {defineConfig, globalIgnores} from "eslint/config";
import globals from "globals";
import {flatConfigs as importX} from "eslint-plugin-import-x";
import js from "@eslint/js";
import jsdocPlugin from "eslint-plugin-jsdoc";
import {configs as packageJsonConfigs} from "eslint-plugin-package-json";
import playwright from "eslint-plugin-playwright";
import stylistic from "@stylistic/eslint-plugin";
import vitest from "@vitest/eslint-plugin";

export default defineConfig([
	globalIgnores(["config/**", "modules/**/*", "js/positions.js", "tests/configs/config_variables.js"]),
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			globals: {
				...globals.browser,
				...globals.node,
				Log: "readonly",
				MM: "readonly",
				Module: "readonly",
				config: "readonly",
				moment: "readonly"
			}
		},
		extends: [importX.recommended, js.configs.recommended, jsdocPlugin.configs["flat/recommended"], stylistic.configs.all],
		rules: {
			"@stylistic/array-element-newline": ["error", "consistent"],
			"@stylistic/arrow-parens": ["error", "always"],
			"@stylistic/brace-style": "off",
			"@stylistic/dot-location": ["error", "property"],
			"@stylistic/function-call-argument-newline": ["error", "consistent"],
			"@stylistic/function-paren-newline": ["error", "consistent"],
			"@stylistic/implicit-arrow-linebreak": ["error", "beside"],
			"@stylistic/indent": ["error", "tab"],
			"@stylistic/max-statements-per-line": ["error", {max: 2}],
			"@stylistic/multiline-comment-style": "off",
			"@stylistic/multiline-ternary": ["error", "always-multiline"],
			"@stylistic/newline-per-chained-call": ["error", {ignoreChainWithDepth: 4}],
			"@stylistic/no-extra-parens": "off",
			"@stylistic/no-tabs": "off",
			"@stylistic/object-curly-spacing": ["error", "always"],
			"@stylistic/object-property-newline": ["error", {allowAllPropertiesOnSameLine: true}],
			"@stylistic/operator-linebreak": ["error", "before"],
			"@stylistic/padded-blocks": "off",
			"@stylistic/quote-props": ["error", "as-needed"],
			"@stylistic/quotes": ["error", "double"],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/space-before-function-paren": ["error", "always"],
			"@stylistic/spaced-comment": "off",
			"dot-notation": "error",
			eqeqeq: ["error", "always", {null: "ignore"}],
			"id-length": "off",
			"import-x/extensions": "error",
			"import-x/newline-after-import": "error",
			"import-x/order": "error",
			"init-declarations": "off",
			"max-lines-per-function": ["warn", 400],
			"max-statements": "off",
			"no-global-assign": "off",
			"no-inline-comments": "off",
			"no-magic-numbers": "off",
			"no-param-reassign": "error",
			"no-plusplus": "off",
			"no-prototype-builtins": "off",
			"no-ternary": "off",
			"no-throw-literal": "error",
			"no-undefined": "off",
			"no-unneeded-ternary": "error",
			"no-useless-return": "error",
			"no-warning-comments": "off",
			"object-shorthand": ["error", "methods"],
			"one-var": "off",
			"prefer-template": "error",
			"require-await": "error",
			"sort-keys": "off"
		}
	},
	{
		files: ["**/*.js"],
		ignores: [
			"clientonly/index.js",
			"js/logger.js",
			"tests/**/*.js"
		],
		rules: {"no-console": "error"}
	},
	{
		files: ["**/package.json"],
		extends: [packageJsonConfigs.recommended]
	},
	{
		files: ["**/*.mjs"],
		languageOptions: {
			ecmaVersion: "latest",
			globals: {
				...globals.node
			},
			sourceType: "module"
		},
		extends: [importX.recommended, js.configs.all, stylistic.configs.all],
		rules: {
			"@stylistic/array-element-newline": "off",
			"@stylistic/indent": ["error", "tab"],
			"@stylistic/object-property-newline": ["error", {allowAllPropertiesOnSameLine: true}],
			"@stylistic/padded-blocks": ["error", "never"],
			"@stylistic/quote-props": ["error", "as-needed"],
			"import-x/no-unresolved": ["error", {ignore: ["eslint/config"]}],
			"max-lines-per-function": ["error", 100],
			"no-magic-numbers": "off",
			"one-var": ["error", "never"],
			"sort-keys": "off"
		}
	},
	{
		files: ["tests/**/*.js"],
		languageOptions: {
			globals: {
				...vitest.environments.env.globals
			}
		},
		extends: [vitest.configs.recommended],
		rules: {
			"vitest/consistent-test-it": "error",
			"vitest/expect-expect": [
				"error",
				{
					assertFunctionNames: [
						"expect",
						"testElementLength",
						"testTextContain",
						"doTest",
						"runAnimationTest",
						"waitForAnimationClass",
						"assertNoAnimationWithin"
					]
				}
			],
			"vitest/max-nested-describe": ["error", {max: 3}],
			"vitest/prefer-to-be": "error",
			"vitest/prefer-to-have-length": "error",
			"max-lines-per-function": "off"
		}
	},
	{
		files: ["tests/unit/modules/default/weather/providers/*.js"],
		rules: {
			"import-x/namespace": "off",
			"import-x/named": "off",
			"import-x/default": "off",
			"import-x/extensions": "off"
		}
	},
	{
		files: ["tests/configs/modules/weather/*.js"],
		rules: {
			"@stylistic/quotes": "off"
		}
	},
	{
		files: ["tests/e2e/**/*.js"],
		extends: [playwright.configs["flat/recommended"]],
		rules: {

			/*
			 * Tests use Vitest-style plain beforeAll()/afterAll() calls, not Playwright's
			 * test.beforeAll() style. The rule incorrectly treats all plain hook calls
			 * as the same unnamed type, flagging the second hook as a duplicate.
			 */
			"playwright/no-duplicate-hooks": "off",
			"playwright/no-standalone-expect": "off"
		}
	}
]);
