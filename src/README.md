# TypeScript sources

All MagicMirror² source lives here as TypeScript. The files are compiled **in place**
back into the repo's runtime directories (`js/`, `defaultmodules/`, `serveronly/`,
`clientonly/`, `translations/`), so every hardcoded `.js` runtime path keeps working
unchanged (the `index.html` `<script>` tags, `package.json` `main`, dynamic `require`,
`express.static`, the test suite, electron's entry point).

## Layout → output mapping

| Source                       | Compiled output          |
| ---------------------------- | ------------------------ |
| `src/js/*.ts`                | `js/*.js`                |
| `src/defaultmodules/**/*.ts` | `defaultmodules/**/*.js` |
| `src/serveronly/*.ts`        | `serveronly/*.js`        |
| `src/clientonly/*.ts`        | `clientonly/*.js`        |
| `src/translations/*.ts`      | `translations/*.js`      |
| `src/types/*.d.ts`           | (ambient types, no emit) |

Compiled `.js`/`.js.map` are **git-ignored** — never edit them; edit the `.ts` source
and rebuild.

## Build

```sh
npm run build        # tsc: browser project then server project
npm run build:watch  # incremental watch
npm run clean:build  # remove build artifacts
```

`build` runs automatically before `test*`, `server`, `start*`, `config:check` (via npm
`pre*` hooks) and before `npm pack` (`prepack`), so the suite and runtime always execute
fresh output.

## Two projects, no bundler

Compilation is split into two `tsc` projects because the runtime is dual:

- **`tsconfig.browser.json`** (`lib: DOM`) — files loaded as classic `<script>`s. They are
  TypeScript _script_ files: **no top-level `import`/`export`**, so `tsc` emits plain
  global-defining JS 1:1 (no bundler, no module wrapper). Shared globals are typed
  as ambient declarations in `src/types/globals.d.ts`. `alwaysStrict: false` here so no `"use strict"`
  is injected — `js/class.ts` relies on sloppy-mode (`this === window`, `arguments.callee`).
- **`tsconfig.server.json`** (`lib: node`) — Node CommonJS files. They keep `require()` /
  `export =` and resolve the internal `require` aliases (`logger`, `node_helper`) and the
  `#server_functions` / `#http_fetcher` subpath imports via `src/types/aliases.d.ts` +
  tsconfig `paths`. Server globals are typed in `src/types/node-globals.d.ts`.

Third-party community modules under `modules/` stay plain JS forever; the
`window.Module.register` contract, runtime `<script>` injection, and dynamic
`require()` of module `node_helper.js` are all preserved.

## Editing rules

- Browser script files must **never** gain a top-level `import`/`export` (it would turn
  them into modules and break global `<script>` loading). eslint + the JSDOM specs guard this.
- Keep dual-world files' `if (typeof module !== "undefined") module.exports = X` guard.
- Cross-module values reached through `require()` are typed `any` during this migration;
  `strict` is on and enforces all in-file types. Further tightening
  (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) is intentionally deferred.

## Upstream merges

This fork diverges from upstream (which ships `.js`). When pulling upstream changes to a
file, apply the diff to the corresponding `src/**/*.ts` source (not the generated output).
Keeping `src/` 1:1 with upstream paths keeps three-way merges tractable.
