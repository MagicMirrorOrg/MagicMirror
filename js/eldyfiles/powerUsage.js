const powerAppUpdate = () => {};

const powerUsageRunner = () => {
	powerAppUpdate();
	setInterval(powerAppUpdate, HOUR_MS);
};

powerUsageRunner();
