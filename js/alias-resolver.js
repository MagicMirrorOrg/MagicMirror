// Internal aliases for default and third-party CommonJS and ESM modules.

const path = require("node:path");
const Module = require("node:module");
const { pathToFileURL } = require("node:url");

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
	Module._resolveFilename = (request, parent, isMain, options) => {
		if (Object.prototype.hasOwnProperty.call(resolved, request)) {
			return resolved[request];
		}
		return origResolveFilename.call(this, request, parent, isMain, options);
	};
	Module._mmAliasPatched = true; // non-enumerable marker would be overkill here
}

// ESM imports need a separate hook from CommonJS require resolution.
// Node calls this for each ESM specifier before its normal resolver runs.
const resolveEsmAlias = (specifier, context, nextResolve) => {
	if (!Object.prototype.hasOwnProperty.call(resolved, specifier)) {
		// Leave regular package and file imports to Node.
		return nextResolve(specifier, context);
	}

	return {
		url: pathToFileURL(resolved[specifier]).href,
		// The alias is fully resolved; don't continue through other resolvers.
		shortCircuit: true
	};
};

if (!Module._mmEsmAliasPatched) {
	// Hooks are process-wide, so register the ESM resolver only once.
	Module.registerHooks({ resolve: resolveEsmAlias });
	Module._mmEsmAliasPatched = true;
}
