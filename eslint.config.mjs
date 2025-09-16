import {defineConfig, globalIgnores} from "eslint/config";
import globals from "globals";
import {flatConfigs as importX} from "eslint-plugin-import-x";
import jest from "eslint-plugin-jest";
import js from "@eslint/js";
import jsdocPlugin from "eslint-plugin-jsdoc";
import packageJson from "eslint-plugin-package-json";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
	globalIgnores(["config/**", "modules/**/*", "!modules/default/**", "js/positions.js"]),
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
		plugins: {js, stylistic},
		extends: [importX.recommended, jest.configs["flat/recommended"], "js/recommended", jsdocPlugin.configs["flat/recommended"], "stylistic/all"],
		rules: {
			"@stylistic/array-element-newline": ["error", "consistent"],
			"@stylistic/arrow-parens": ["error", "always"],
			"@stylistic/brace-style": "off",
			"@stylistic/comma-dangle": ["error", "never"],
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
			eqeqeq: "error",
			"id-length": "off",
			"import-x/extensions": "error",
			"import-x/newline-after-import": "error",
			"import-x/order": "error",
			"init-declarations": "off",
			"jest/consistent-test-it": "warn",
			"jest/no-done-callback": "warn",
			"jest/prefer-expect-resolves": "warn",
			"jest/prefer-mock-promise-shorthand": "warn",
			"jest/prefer-to-be": "warn",
			"jest/prefer-to-have-length": "warn",
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
			"no-unused-vars": "off",
			"no-useless-return": "error",
			"no-warning-comments": "off",
			"object-shorthand": ["error", "methods"],
			"one-var": "off",
			"prefer-template": "error",
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
		plugins: {packageJson},
		extends: ["packageJson/recommended"]
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
		plugins: {js, stylistic},
		extends: [importX.recommended, "js/all", "stylistic/all"],
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
		files: ["tests/configs/modules/weather/*.js"],
		rules: {
			"@stylistic/quotes": "off"
		}
	}
]);
