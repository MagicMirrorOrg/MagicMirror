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
