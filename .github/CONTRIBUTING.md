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

We use [Vitest](https://vitest.dev) for JavaScript testing.

To run all tests, use `node --run test`.

The `package.json` scripts expose finer-grained test commands:

- `test:unit` – run unit tests only
- `test:e2e` – execute browser-driven end-to-end tests
- `test:electron` – launch the Electron-based regression suite
- `test:coverage` – collect coverage while running every suite
- `test:watch` – keep Vitest in watch mode for fast local feedback
- `test:ui` – open the Vitest UI dashboard (needs OS file-watch support enabled)
- `test:calendar` – run the legacy calendar debug helper
- `test:css`, `test:markdown`, `test:prettier`, `test:spelling`, `test:js` – lint-only scripts that enforce formatting, spelling, markdown style, and ESLint.

You can invoke any script with `node --run <script>` (or `yarn <script>`). Individual files can still be targeted directly, e.g. `yarn vitest run tests/e2e/env_spec.js`.

This project uses [Yarn](https://yarnpkg.com) (pinned via the `packageManager` field and Corepack). Run `corepack enable` once, then `node --run install-mm:dev` to install dependencies.
