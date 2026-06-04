# CLAUDE.md

Guidance for working in this repository. MagicMirror² is a modular smart-mirror
platform. This copy is a **fork** that diverges from upstream in two big ways:
all source is **TypeScript**, and the package manager is **Yarn 4**.

## Source lives in `src/` — never edit the output

Every source file is authored as `.ts` under `src/` and compiled **in place** back
into the legacy runtime directories. The emitted `.js`/`.js.map` are **git-ignored**.

| Edit here (source)           | Do NOT edit (generated)  |
| ---------------------------- | ------------------------ |
| `src/server/*.ts`            | `js/*.js`                |
| `src/client/*.ts`            | `js/*.js`                |
| `src/modules/<feature>/*.ts` | `defaultmodules/**/*.js` |
| `src/serveronly/*.ts`        | `serveronly/*.js`        |
| `src/clientonly/*.ts`        | `clientonly/*.js`        |
| `src/translations/*.ts`      | `translations/*.js`      |
| `src/types/*.d.ts`           | —                        |

The build is seven per-concern `tsc -b` projects (DOM vs Node lib split, one
`rootDir → outDir` mapping each). Full details, the cross-project ambient-declaration
seams, and the editing rules are in **[`src/README.md`](src/README.md)** — read it
before touching `src/` or the tsconfigs.

Exception: `js/positions.js` is a hand-maintained tracked `.js` file (not compiled
from TS, intentionally eslint-ignored). Leave it as JS.

### Hard runtime invariants (breaking these breaks the mirror silently)

- **Browser `<script>` files must never gain a top-level `import`/`export`.** That
  would turn them into modules and break global `<script>` loading. They share state
  via globals typed in `src/types/*.d.ts`. eslint + the JSDOM specs guard this.
- **Runtime assets stay in `defaultmodules/`, not `src/`.** Templates (`.njk`), CSS,
  translation JSON, SVG faces, etc. are not compiled — they are tracked in the output
  dir. Moving them into `src/` deletes them from the runtime and modules render empty.
- **Community modules under `modules/` are forever plain JS.** The
  `Module.register(...)` contract, runtime `<script>` injection, and dynamic
  `require()` of a module's `node_helper.js` must keep working byte-for-behavior.
- Keep dual-world files' `if (typeof module !== "undefined") module.exports = X` guard.
- Filenames in the output dirs are contractual (`index.html` `<script src>`,
  `package.json` `main`, dynamic `require`). Don't rename emitted files.

## Package manager: Yarn 4 (Corepack), not npm

Pinned via the `packageManager` field; run `corepack enable` once. `nodeLinker:
node-modules` (flat node_modules, no PnP). `yarn.lock` is committed; there is no
package-lock.json.

Two gotchas when editing `package.json` or CI:

- **Yarn does not run npm-style `pre*`/`post*` user scripts** (and neither does
  `node --run`). The "build before X" step is therefore **inlined** as
  `node --run build && ...` into `config:check`, `server`, `start`, `start:dev`, and
  the `test:*` scripts. Do **not** reintroduce the old `pre*` hooks — they silently
  won't run. Yarn does honor `postinstall`, `prepare`, `prepack`.
- **Yarn does not auto-install peer dependencies** (npm did). A missing peer surfaces
  as `ERR_MODULE_NOT_FOUND`; add it explicitly to `devDependencies`.

## Commands

Scripts are package-manager-agnostic; use `yarn <script>` or `node --run <script>`.

```sh
corepack enable            # one-time: activate the pinned Yarn
node --run install-mm:dev  # install deps + Playwright chromium + build
node --run install-mm      # production install (yarn workspaces focus --production)

node --run build           # compile src/ (tsc -b, seven projects)
node --run test            # build + full vitest suite
node --run test:unit       # build + unit tests only
node --run test:e2e        # build + Playwright e2e
node --run test:js         # eslint
node --run test:prettier   # prettier --check
node --run typecheck       # tsc against the combined editor tsconfig.json

node --run server          # build + server-only mode
node --run start           # build + electron (use start:wayland/x11/windows variants)
```

## Verify before declaring done

Run, in order: `node --run build` → `node --run test:js` → `node --run test:prettier`
→ `node --run test:unit` → `node --run test:e2e`. All must pass.

Known pre-existing failures (NOT regressions you introduced):

- `tests/unit/classes/systeminformation_spec.js` fails on macOS — it asserts
  `platform: linux`. Passes on the Linux CI runners.
- `node --run test:spelling` reports ~24 unknown words that are legitimate source
  vocabulary (British `-ise` spellings, locale display names, and the `yr` provider's
  concatenated weather-code identifiers). Spellcheck runs only quarterly in CI.

## Code style

TypeScript is linted/formatted by **eslint** (`@stylistic`): **tabs**, **double
quotes**, **semicolons**. `.ts` is prettier-ignored (eslint owns it); other files use
prettier. `@typescript-eslint/no-explicit-any` is intentionally off — dynamic external
boundaries (config, API payloads, DOM, cross-project seams) are typed `any`.

## Upstream merges

Upstream ships `.js`; this fork ships `src/*.ts`. When pulling an upstream change to a
file, apply the diff to the corresponding `src/**/*.ts` source, not the generated
output. Keeping `src/` 1:1 with upstream paths keeps three-way merges tractable.
