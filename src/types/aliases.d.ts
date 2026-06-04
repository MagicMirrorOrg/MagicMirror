/*
 * Ambient declarations for MagicMirror's internal require() aliases, which are
 * resolved at runtime by js/alias-resolver.js (it patches Module._resolveFilename).
 * TypeScript has no knowledge of that patch, so declare the alias modules here.
 *
 * Typed as `any` while the underlying files (js/logger, js/node_helper) are still
 * plain JS; tighten once those modules are migrated and can export real types.
 *
 * Included by the server tsconfig.
 */

declare module "logger" {
	const Log: any;
	export = Log;
}

declare module "node_helper" {
	const NodeHelper: any;
	export = NodeHelper;
}
