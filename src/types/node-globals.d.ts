/*
 * Server-side ambient globals. MagicMirror attaches a handful of values to Node's
 * global object at startup (in js/app.js / js/utils.js) and reads them across the
 * server code, both as `global.X` and as bare `X`. Declared with `var` so they are
 * writable (some are assigned at runtime) and visible on `globalThis`.
 *
 * Included by the server tsconfig only.
 */

declare var config: any;
declare var root_path: string;
declare var version: string;
declare var mmTestMode: boolean | string;
declare var configuration_file: string | undefined;
declare var defaultModulesDir: string;
