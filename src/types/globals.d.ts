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

type ModuleProperties = {
	defaults?: object;
	[key: string]: any;
	start?(): void;
	getScripts?(): string[];
	getStyles?(): string[];
	getTranslations?(): object;
	getDom?(): HTMLElement;
	getHeader?(): string;
	getTemplate?(): string;
	getTemplateData?(): object;
	notificationReceived?(notification: string, payload: any, sender: object): void;
	nunjucksEnvironment?(): void;
	socketNotificationReceived?(notification: string, payload: any): void;
	suspend?(): void;
	resume?(): void;
};

interface ModuleConstructor {
	register(moduleName: string, moduleProperties: ModuleProperties): void;
	definitions: Record<string, ModuleProperties>;
	create(name: string): any;
	[key: string]: any;
}

interface LogType {
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
}

declare const Module: ModuleConstructor;
declare const Log: LogType;
declare const MM: any;
declare const config: any;
declare const Translator: any;
declare const Loader: any;
declare const cloneObject: (obj: any) => any;
declare const moment: any;
declare const nunjucks: any;
declare const defaultModules: string[];
declare const vendor: Record<string, string>;
declare const MMSocket: any;
declare const AnimateCSSIn: string[];
declare const AnimateCSSOut: string[];

interface Window {
	Module: ModuleConstructor;
	Log: LogType;
	MM: any;
	config: any;
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
