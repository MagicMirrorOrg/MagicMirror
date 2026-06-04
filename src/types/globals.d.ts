/*
 * Ambient global type declarations for the MagicMirror browser runtime.
 *
 * Browser script files (loaded via <script> tags in index.html, and injected at
 * runtime by js/loader.js) share state through globals rather than a module
 * system. Third-party community modules — which stay plain JS forever — also rely
 * on these globals being present on `window` (most importantly `Module.register`).
 *
 * This file has NO top-level import/export, so it is an ambient (global) script
 * declaration: the bare `declare const` names are visible to every browser source
 * file, and the `Window` interface augments lib.dom. Keep both surfaces in sync.
 *
 * Types are intentionally permissive where the corresponding source file has not
 * been migrated yet; tighten them as each browser file moves to TypeScript.
 */

// A module definition object passed to Module.register(). Kept permissive: a module
// may override any subset of the base methods with varying signatures, so the methods
// resolve via the index signature rather than fixed shapes.
type ModuleProperties = {
	defaults?: object;
	[key: string]: any;
};

interface ModuleConstructor {
	// ThisType<any> binds `this` inside a module definition object to `any`, so the
	// methods that default modules pass (getDom, notificationReceived, ...) can freely
	// use this.config / this.translate() / this.data / this.sendNotification etc.
	register(moduleName: string, moduleProperties: ModuleProperties & ThisType<any>): void;
	definitions: Record<string, ModuleProperties>;
	create(name: string): any;
	[key: string]: any;
}

interface LogType {
	debug(message?: any, ...optionalParams: any[]): void;
	info(message?: any, ...optionalParams: any[]): void;
	log(message?: any, ...optionalParams: any[]): void;
	error(message?: any, ...optionalParams: any[]): void;
	warn(message?: any, ...optionalParams: any[]): void;
	group(groupTitle?: string, ...optionalParams: any[]): void;
	groupCollapsed(groupTitle?: string, ...optionalParams: any[]): void;
	groupEnd(): void;
	time(timerName?: string): void;
	timeEnd(timerName?: string): void;
	timeStamp(timerName?: string): void;
	setLogLevel(newLevel?: string[]): void;
}

/*
 * Globals NOT declared here are provided as top-level declarations by their own
 * migrated browser script file (cross-file global scope), e.g. cloneObject (class.ts),
 * Module (module.ts), Translator (translator.ts), MMSocket (socketclient.ts),
 * AnimateCSSIn/Out (animateCSS.ts), defaultModules (defaultmodules.ts),
 * WeatherObject/WeatherUtils/CalendarUtils/formatTime. Declaring them here too would
 * be a duplicate-identifier error.
 */
declare const Log: LogType;
declare var config: MMConfig;
declare const moment: any;
declare const nunjucks: any;
// modulePositions is emitted at runtime into js/positions.js by js/utils.js.
declare const modulePositions: string[];
// Globals with no migrated declaring source (vendor scripts, config-injected).
declare const SunCalc: any;
declare const io: any;
declare const mmPort: any;
declare const Cron: any;
declare const NotificationFx: any;

interface Window {
	Module: ModuleConstructor;
	Log: LogType;
	MM: any;
	config: MMConfig;
	Translator: any;
	Loader: any;
	cloneObject: (obj: any) => any;
	moment: any;
	nunjucks: any;
	defaultModules: string[];
	vendor: Record<string, string>;
	MMSocket: any;
	AnimateCSSIn: string[];
	AnimateCSSOut: string[];
	mmVersion: string;
	mmTestMode: string;
}
