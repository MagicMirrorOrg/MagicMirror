/**
 * Format the time according to the config
 * @param {object} config The config of the module
 * @param {object} time time to format
 * @returns {string} The formatted time string
 */
const formatTime = (config, time) => {
	let date = moment(time);

	if (config.timezone) {
		date = date.tz(config.timezone);
	}

	if (config.timeFormat !== 24) {
		if (config.showPeriod) {
			if (config.showPeriodUpper) {
				return date.format("h:mm A");
			} else {
				return date.format("h:mm a");
			}
		} else {
			return date.format("h:mm");
		}
	}

	return date.format("HH:mm");
};

if (typeof module !== "undefined") module.exports = {
	formatTime
};
