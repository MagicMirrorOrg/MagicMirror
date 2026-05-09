# Contribution Policy for MagicMirror²

Thanks for contributing to MagicMirror²!

We hold our code to standard, and these standards are documented below.

## Linters

We use [prettier](https://prettier.io/) for automatic formatting a lot all our files. The configuration is in our `prettier.config.mjs` file.

And we use [ESLint](https://eslint.org) to lint our JavaScript, Markdown, and CSS files. The configuration is in our `eslint.config.mjs` file.

To check for formatting and linting errors, use `node --run test:lint`
To fix formatting and linting errors, use `node --run lint:fix`.

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
- `test:lint` – run linter and formatter checks
- `test:spelling` – run the spell checker

You can invoke any script with `node --run <script>` (or `npm run <script>`). Individual files can still be targeted directly, e.g. `npx vitest run tests/e2e/env_spec.js`.
