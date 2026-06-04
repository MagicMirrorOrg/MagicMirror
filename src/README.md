# TypeScript sources

All MagicMirror² source lives here as TypeScript. The files are compiled **in place**
back into the repo's runtime directories (`js/`, `defaultmodules/`, `serveronly/`,
`clientonly/`, `translations/`), so every hardcoded `.js` runtime path keeps working
unchanged (the `index.html` `<script>` tags, `package.json` `main`, dynamic `require`,
`express.static`, the test suite, electron's entry point).

## Layout

Sources are grouped **by concern**, not by output directory. One feature's browser
script and its server `node_helper` live together under `src/modules/<feature>/`; the
build splits them to the right runtime dirs.

| Source                       | Concern                             | Compiled output          |
| ---------------------------- | ----------------------------------- | ------------------------ |
| `src/server/*.ts`            | Node CommonJS core (app, server, …) | `js/*.js`                |
| `src/client/*.ts`            | Browser `<script>` core (Module, …) | `js/*.js`                |
| `src/modules/<feature>/*.ts` | Default modules (browser + server)  | `defaultmodules/**/*.js` |
| `src/serveronly/*.ts`        | Headless server entry + watcher     | `serveronly/*.js`        |
| `src/clientonly/*.ts`        | Headless client entry               | `clientonly/*.js`        |
| `src/translations/*.ts`      | Translation tables                  | `translations/*.js`      |
| `src/types/*.d.ts`           | Ambient types                       | (no emit)                |

`src/server` and `src/client` both emit into `js/` (the runtime serves one flat dir);
they are split at the source level only because one is `lib: node` and the other
`lib: DOM`. Filenames are contractual (`index.html` `<script src>`, `package.json`
`main`, dynamic `require`) and are kept identical to the output names.

Compiled `.js`/`.js.map` are **git-ignored** — never edit them; edit the `.ts` source
and rebuild.

## Build

```sh
yarn build        # tsc -b over the seven per-concern projects
yarn build:watch  # incremental watch (all projects in parallel)
yarn clean:build  # remove build artifacts
```

(`node --run build` works too — the scripts are package-manager-agnostic.)

`build` is chained into the front of `test*`, `server`, `start`, `config:check`
(`node --run build && ...`) so the suite and runtime always execute fresh output. It is
inlined rather than relying on `pre*` lifecycle hooks because Yarn (and `node --run`) do
not run npm-style `pre*` scripts. The `prepack` lifecycle event Yarn does honor still
builds before `yarn pack`.

## Seven projects, no bundler

The runtime is dual (browser DOM vs Node) **and** has five output dirs, so compilation
is split into seven `tsc` projects (all extend `tsconfig.base.json`). Each one pins a
single `rootDir` → `outDir` mapping and the correct `lib`/`types`:

| Project (`src/tsconfig.*.json`) | `lib` | Source folder                 | Output            |
| ------------------------------- | ----- | ----------------------------- | ----------------- |
| `server`                        | node  | `src/server`                  | `js/`             |
| `client`                        | DOM   | `src/client`                  | `js/`             |
| `modules.server`                | node  | `src/modules` (server files)  | `defaultmodules/` |
| `modules.client`                | DOM   | `src/modules` (browser files) | `defaultmodules/` |
| `serveronly`                    | node  | `src/serveronly`              | `serveronly/`     |
| `clientonly`                    | DOM   | `src/clientonly`              | `clientonly/`     |
| `translations`                  | DOM   | `src/translations`            | `translations/`   |

`src/modules/<feature>` mixes browser scripts and Node `node_helper.ts` in one folder, so
`modules.server` and `modules.client` use explicit `files` lists rather than folder globs.

Two kinds of files, distinguished by syntax:

- **Browser `<script>` files** (`client`, `modules.client`, `clientonly`, `translations`)
  are TypeScript _script_ files: **no top-level `import`/`export`**, so `tsc` emits plain
  global-defining JS 1:1 (no bundler, no module wrapper). Shared globals are typed as
  ambient declarations in `src/types/globals.d.ts`. `alwaysStrict: false` here so no
  `"use strict"` is injected — browser scripts historically loaded in sloppy mode, kept
  off to preserve exact runtime semantics.
- **Node CommonJS files** (`server`, `modules.server`, `serveronly`) keep `require()` /
  `export =` and resolve the internal `require` aliases (`logger`, `node_helper`) and the
  `#`-subpath imports (`#server_functions`, `#http_fetcher`, `#app`, `#alias-resolver`)
  via the ambient `declare module`s in `src/types/aliases.d.ts`. Server globals are typed
  in `src/types/node-globals.d.ts`.

### Cross-project boundaries

Because each project has its own `rootDir`, a project cannot statically `import` a `.ts`
file owned by another (tsc would try to re-emit it outside its `outDir`). Two seams cross
project lines and are bridged with **ambient declarations** instead of direct imports:

- **Browser globals** defined in one project, consumed in another (e.g. `Module` from
  `client` used in `modules.client`; `defaultModules`/`translations` used in `client`)
  are declared in consumer-only shims `src/types/module-consumer.d.ts` and
  `client-consumer.d.ts`. (The root editor `tsconfig.json` excludes these — in the
  combined program the real defining sources already provide the globals.)
- **`#`-subpath modules** produced by `src/server/*` but consumed by `src/modules/*` or
  `src/serveronly/*` are typed `any`/loose in `src/types/aliases.d.ts`. Server-internal
  uses of `#server_functions` were switched to a relative `./server_functions` import so
  they keep real types.

Third-party community modules under `modules/` stay plain JS forever; the
`window.Module.register` contract, runtime `<script>` injection, and dynamic
`require()` of module `node_helper.js` are all preserved.

## Editing rules

- Browser script files must **never** gain a top-level `import`/`export` (it would turn
  them into modules and break global `<script>` loading). eslint + the JSDOM specs guard this.
- Keep dual-world files' `if (typeof module !== "undefined") module.exports = X` guard.
- Cross-module values reached through `require()` are typed `any`; `strict`,
  `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes` are all enabled and
  enforce in-file types. Indexed/match access that's logically guaranteed present uses
  a non-null assertion (`!`) rather than a runtime guard.

## Upstream merges

This fork diverges from upstream (which ships `.js`). When pulling upstream changes to a
file, apply the diff to the corresponding `src/**/*.ts` source (not the generated output).
Keeping `src/` 1:1 with upstream paths keeps three-way merges tractable.
