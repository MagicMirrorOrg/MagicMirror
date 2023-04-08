/* MagicMirror²
 * Calendar Util Methods
 *
 * By Rejas
 * MIT Licensed.
 */
const CalendarUtils = {
	/**
	 * Capitalize the first letter of a string
	 *
	 * @param {string} string The string to capitalize
	 * @returns {string} The capitalized string
	 */
	capFirst: function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	}
};

if (typeof module !== "undefined") {
	module.exports = CalendarUtils;
}
