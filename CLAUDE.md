# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project intent

This is a personal fork of MagicMirror² for custom improvements and new features. Deployment target is a **Raspberry Pi connected to a monitor**. Keep Pi constraints in mind: ARM architecture, limited RAM, and Raspberry Pi OS (Wayland by default on modern versions, X11 on older).

## Commands

All scripts can be run with either `node --run <script>` or `npm run <script>`.

```bash
# Install (production)
npm run install-mm

# Install (development, also installs Playwright)
npm run install-mm:dev

# Start (Electron, Wayland)
node --run start

# Start (server-only, no Electron)
node --run server

# Validate config
node --run config:check

# Lint & format check
node --run test:lint

# Lint & format fix
node --run lint:fix

# Run all tests
node --run test

# Run specific test suites
node --run test:unit
node --run test:e2e
node --run test:electron

# Run a single test file
npx vitest run tests/e2e/env_spec.js

# Watch mode
node --run test:watch
```

## Architecture

MagicMirror² is a modular smart mirror platform built on **Electron** (optional) + **Express** + **Socket.io**. There is a hard split between server-side and browser-side code.

### Process model

- **`js/electron.js`** — Electron entry point; spawns `js/app.js` as the Node server and opens a BrowserWindow.
- **`js/app.js`** — Node process entry: starts the Express/Socket.io server (`js/server.js`), then loads each module's `node_helper.js`.
- **`js/server.js`** — HTTP(S) server. Serves static files, handles IP whitelist, and passes Socket.io events to node helpers.
- **`serveronly/`** — Alternative entry for running without Electron (headless/server mode).
- **`clientonly/`** — Client-only entry for when a remote browser connects to an existing server.

### Browser side

- **`index.html`** → loads `js/main.js` (ES module, browser context).
- **`js/main.js`** — Bootstraps the DOM: iterates configured modules, creates position wrappers, and calls each module's `getDom()`.
- **`js/module.js`** — Base `Module` class. All modules extend this. Key lifecycle methods: `init()`, `start()`, `getDom()`, `getHeader()`, `notificationReceived()`, `socketNotificationReceived()`.
- **`js/loader.js`** — Dynamically loads module JS, CSS, and translation files.
- **`js/socketclient.js`** — Wraps Socket.io on the browser side; routes incoming socket notifications to modules.

### Module structure

Each module lives in `defaultmodules/<name>/` (built-ins) or `modules/<name>/` (third-party):

| File | Side | Purpose |
|------|------|---------|
| `<name>.js` | Browser | Module class — extends `Module`, implements `getDom()` etc. |
| `node_helper.js` | Server | Extends `NodeHelper`; does I/O, external requests, heavy computation. |
| `<name>.css` | Browser | Module styles. |
| `templates/*.njk` | Browser | Nunjucks templates (optional). |
| `translations/*.json` | Both | i18n strings. |

Communication between the two halves uses **Socket.io notifications**:
- Browser → Server: `this.sendSocketNotification(notification, payload)`
- Server → Browser: `this.sendSocketNotification(notification, payload)` (from NodeHelper)

### Configuration

- Copy `config/config.js.sample` → `config/config.js` to configure.
- Key fields: `address`, `port` (default 8080), `ipWhitelist`, `modules[]`.
- Override config file path via `MM_CONFIG_FILE` env var; override port via `MM_PORT`.
- Secrets in config are redacted before sending to the browser; `node_helper.js` instances are only allowed to restore secrets defined in their own module's config.

### Testing

Tests use **Vitest** with three named projects — `unit`, `e2e`, and `electron` — all run sequentially on a single worker (port 8080 is shared). Test files follow the `*_spec.js` naming convention. Test configs live in `tests/configs/`.

### Linting

ESLint (config: `eslint.config.mjs`) covers JS, CSS, and Markdown. Prettier (config: `prettier.config.mjs`) handles formatting. The pre-commit hook (Husky + lint-staged) runs both on staged files automatically.
