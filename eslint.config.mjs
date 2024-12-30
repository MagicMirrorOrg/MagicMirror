import eslintPluginImport from "eslint-plugin-import";
import eslintPluginJest from "eslint-plugin-jest";
import eslintPluginJs from "@eslint/js";
import eslintPluginPackageJson from "eslint-plugin-package-json/configs/recommended";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import globals from "globals";

const config = [
	eslintPluginJs.configs.recommended,
	eslintPluginImport.flatConfigs.recommended,
	eslintPluginPackageJson,
	{
		files: ["**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
				Log: "readonly",
				MM: "readonly",
				Module: "readonly",
				config: "readonly",
				moment: "readonly"
			}
		},
		plugins: {
			...eslintPluginStylistic.configs["all-flat"].plugins,
			...eslintPluginJest.configs["flat/recommended"].plugins
		},
		rules: {
			...eslintPluginStylistic.configs["all-flat"].rules,
			...eslintPluginJest.configs["flat/recommended"].rules,
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
			"import/extensions": "error",
			"import/newline-after-import": "error",
			"import/order": "error",
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
			"prefer-destructuring": "off",
			"prefer-template": "error",
			"sort-keys": "off"
		}
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
		plugins: {
			...eslintPluginStylistic.configs["all-flat"].plugins
		},
		rules: {
			...eslintPluginStylistic.configs["all-flat"].rules,
			"@stylistic/array-element-newline": "off",
			"@stylistic/indent": ["error", "tab"],
			"@stylistic/padded-blocks": ["error", "never"],
			"@stylistic/quote-props": ["error", "as-needed"],
			"func-style": "off",
			"import/namespace": "off",
			"import/no-unresolved": "off",
			"max-lines-per-function": ["error", 100],
			"no-magic-numbers": "off",
			"one-var": "off",
			"prefer-destructuring": "off",
			"sort-keys": "error"
		}
	},
	{
		files: ["tests/configs/modules/weather/*.js"],
		rules: {
			"@stylistic/quotes": "off"
		}
	},
	{
		ignores: ["config/**", "modules/**/*", "!modules/default/**", "js/positions.js"]
	}
];

export default config;
