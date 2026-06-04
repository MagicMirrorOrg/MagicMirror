type DeprecatedConfig = {
	configs: string[];
	[moduleName: string]: string[];
};

const deprecated: DeprecatedConfig = {
	configs: [],
	clock: ["secondsColor"]
};

export = deprecated;
