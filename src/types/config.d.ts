/*
 * Ambient type for the global MagicMirror² configuration object (`config` in the
 * browser, `global.config` in Node). Source of truth for the defaults is
 * js/defaults.js (src/js/defaults.ts).
 *
 * Well-known fields are typed; the index signature keeps the object extensible
 * (users and modules may add arbitrary keys) so typing `config` as MMConfig is a
 * safe, no-new-error refinement of the previous `any`. Genuinely dynamic fields
 * (httpHeaders, electronOptions, userAgent) stay `any`.
 *
 * Included by both the browser and server tsconfig.
 */

interface ModuleConfigEntry {
	module: string;
	position?: string;
	classes?: string;
	header?: string;
	disabled?: boolean;
	config?: any;
	configDeepMerge?: boolean;
	animateIn?: string;
	animateOut?: string;
	hiddenOnStartup?: boolean;
	order?: number;
	[key: string]: any;
}

interface MMConfig {
	address: string;
	port: number;
	basePath: string;
	ipWhitelist: string[];
	cors: string;
	corsDomainWhitelist: string[];
	language: string;
	locale?: string;
	logLevel: string[];
	timeFormat: number;
	units: string;
	zoom: number;
	customCss: string;
	foreignModulesDir: string;
	defaultModulesDir: string;
	hideConfigSecrets: boolean;
	checkServerInterval: number;
	reloadAfterServerRestart: boolean;
	modules: ModuleConfigEntry[];
	useHttps?: boolean;
	httpsPrivateKey?: string;
	httpsCertificate?: string;
	timezone?: string;
	// Dynamic / complex shapes intentionally left permissive.
	httpHeaders?: any;
	electronOptions?: any;
	userAgent?: any;
	[key: string]: any;
}
