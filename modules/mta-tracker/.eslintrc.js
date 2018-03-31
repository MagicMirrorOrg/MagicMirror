module.exports = {
  root: true,
  extends: ['airbnb', 'prettier', 'plugin:security/recommended'],
  globals: {
    API: true, // defined in each webpack config seperately
    APP: true, // defined in config/webpack/base.js
  },
  plugins: ['prettier', 'security'],
  settings: {
    'import/resolver': {
      webpack: {
        config: 'config/webpack/base.js',
      },
    },
  },
  rules: {
    'import/no-named-as-default': 'off', // This goes against the way we have our HOCs set up to test with Redux
    'import/extensions': [
      2, // 0 = off, 1 = warn, 2 = error
      { json: 'always', js: 'never' }, // Always require .json extension, but never any js(x)/ts(x) extensions
    ],
    'prettier/prettier': [
      'error',
      {
        printWidth: 100, // to match Airbnb's rules
        singleQuote: true,
        trailingComma: 'all',
      },
    ],
  },
  overrides: {
    files: ['ci-cd/**/*.js'],
    rules: {
      // Allow devDependencies here, where we don't in the base config
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    },
  },
};