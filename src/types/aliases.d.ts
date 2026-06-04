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
	// Shape of a NodeHelper instance. The index signature lets module-specific
	// fields/methods (this.providers, this.config, ...) resolve to `any`, and the
	// named methods type the base API the module definitions call via `this`.
	interface NodeHelperInstance {
		name: string;
		path: string;
		expressApp: any;
		io: any;
		[key: string]: any;
		sendSocketNotification (notification: string, payload?: any): void;
		setName (name: string): void;
		setPath (path: string): void;
		setExpressApp (app: any): void;
		setSocketIO (io: any): void;
	}
	interface NodeHelperStatic {
		// ThisType binds `this` inside the passed module definition to a NodeHelper
		// instance, so `this.sendSocketNotification(...)` etc. type-check.
		create (moduleDefinition: Record<string, any> & ThisType<NodeHelperInstance>): NodeHelperInstance;
		checkFetchStatus (response: any): any;
		checkFetchError (error: any): any;
		[key: string]: any;
	}
	const NodeHelper: NodeHelperStatic;
	export = NodeHelper;
}

/*
 * package.json "imports" subpaths, resolved at runtime by Node. Typed `any` here
 * because the producing source lives in a different tsc project (src/server/*), so it
 * can't be imported across the project boundary without re-emitting it.
 */
declare module "#http_fetcher" {
	// Declared as a class so consumers can use `HTTPFetcher` as both a value
	// (new HTTPFetcher(...)) and a type (httpFetcher: HTTPFetcher).
	class HTTPFetcher {
		constructor (...args: any[]);
		static [key: string]: any;

		[key: string]: any;
	}
	export = HTTPFetcher;
}
declare module "#app" {
	const app: any;
	export = app;
}
declare module "#alias-resolver" {}
declare module "#server_functions" {
	export const cors: any;
	export const getHtml: any;
	export const getVersion: any;
	export const getStartup: any;
	export const getEnvVars: any;
	export const getEnvVarsAsObj: any;
	export const getUserAgent: any;
	export const getConfigFilePath: any;
	export const replaceSecretPlaceholder: any;
}
