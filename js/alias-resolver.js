// Internal alias mapping for default and 3rd party modules.
// Provides short require identifiers: "logger" and "node_helper".
// For a future ESM migration, replace this with a public export/import surface.

const path = require("node:path");
const Module = require("module");

const root = path.join(__dirname, "..");

// Keep this list minimal; do not add new aliases without architectural review.
const ALIASES = {
	logger: "js/logger.js",
	node_helper: "js/node_helper.js"
};

// Resolve to absolute paths now.
const resolved = Object.fromEntries(
	Object.entries(ALIASES).map(([k, rel]) => [k, path.join(root, rel)])
);

// Prevent multiple patching if this file is required more than once.
if (!Module._mmAliasPatched) {
	const origResolveFilename = Module._resolveFilename;
	Module._resolveFilename = function (request, parent, isMain, options) {
		if (Object.prototype.hasOwnProperty.call(resolved, request)) {
			return resolved[request];
		}
		return origResolveFilename.call(this, request, parent, isMain, options);
	};
	Module._mmAliasPatched = true; // non-enumerable marker would be overkill here
}
