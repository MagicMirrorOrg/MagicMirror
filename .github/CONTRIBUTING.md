# Contribution Policy for MagicMirror²

Thanks for contributing to MagicMirror²!

We hold our code to standard, and these standards are documented below.

## Linters

We use [prettier](https://prettier.io/) for automatic formatting a lot all our files. The configuration is in our `prettier.config.mjs` file.

To run prettier, use `node --run lint:prettier`.

### JavaScript: Run ESLint

We use [ESLint](https://eslint.org) to lint our JavaScript files. The configuration is in our `eslint.config.mjs` file.

To run ESLint, use `node --run lint:js`.

### CSS: Run StyleLint

We use [StyleLint](https://stylelint.io) to lint our CSS. The configuration is in our `stylelint.config.mjs` file.

To run StyleLint, use `node --run lint:css`.

### Markdown: Run markdownlint

We use [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) to lint our markdown files. The configuration is in our `.markdownlint.json` file.

To run markdownlint, use `node --run lint:markdown`.

## Testing

We use [Jest](https://jestjs.io) for JavaScript testing.

To run all tests, use `node --run test`.

The specific test commands are defined in `package.json`.
So you can also run the specific tests with other commands, e.g. `node --run test:unit` or `npx jest tests/e2e/env_spec.js`.
