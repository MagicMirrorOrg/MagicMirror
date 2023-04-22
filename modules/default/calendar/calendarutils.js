/* MagicMirror²
 * Calendar Util Methods
 *
 * By Rejas
 * MIT Licensed.
 */
const CalendarUtils = {
	/**
	 * Capitalize the first letter of a string
	 * @param {string} string The string to capitalize
	 * @returns {string} The capitalized string
	 */
	capFirst: function (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	/**
	 * This function accepts a number (either 12 or 24) and returns a moment.js LocaleSpecification with the
	 * corresponding time-format to be used in the calendar display. If no number is given (or otherwise invalid input)
	 * it will a localeSpecification object with the system locale time format.
	 * @param {number} timeFormat Specifies either 12 or 24-hour time format
	 * @returns {moment.LocaleSpecification} formatted time
	 */
	getLocaleSpecification: function (timeFormat) {
		switch (timeFormat) {
			case 12: {
				return { longDateFormat: { LT: "h:mm A" } };
			}
			case 24: {
				return { longDateFormat: { LT: "HH:mm" } };
			}
			default: {
				return { longDateFormat: { LT: moment.localeData().longDateFormat("LT") } };
			}
		}
	},

	/**
	 * Shortens a string if it's longer than maxLength and add an ellipsis to the end
	 * @param {string} string Text string to shorten
	 * @param {number} maxLength The max length of the string
	 * @param {boolean} wrapEvents Wrap the text after the line has reached maxLength
	 * @param {number} maxTitleLines The max number of vertical lines before cutting event title
	 * @returns {string} The shortened string
	 */
	shorten: function (string, maxLength, wrapEvents, maxTitleLines) {
		if (typeof string !== "string") {
			return "";
		}

		if (wrapEvents === true) {
			const words = string.split(" ");
			let temp = "";
			let currentLine = "";
			let line = 0;

			for (let i = 0; i < words.length; i++) {
				const word = words[i];
				if (currentLine.length + word.length < (typeof maxLength === "number" ? maxLength : 25) - 1) {
					// max - 1 to account for a space
					currentLine += `${word} `;
				} else {
					line++;
					if (line > maxTitleLines - 1) {
						if (i < words.length) {
							currentLine += "…";
						}
						break;
					}

					if (currentLine.length > 0) {
						temp += `${currentLine}<br>${word} `;
					} else {
						temp += `${word}<br>`;
					}
					currentLine = "";
				}
			}

			return (temp + currentLine).trim();
		} else {
			if (maxLength && typeof maxLength === "number" && string.length > maxLength) {
				return `${string.trim().slice(0, maxLength)}…`;
			} else {
				return string.trim();
			}
		}
	},

	/**
	 * Transforms the title of an event for usage.
	 * Replaces parts of the text as defined in config.titleReplace.
	 * Shortens title based on config.maxTitleLength and config.wrapEvents
	 * @param {string} title The title to transform.
	 * @param {object} titleReplace Pairs of strings to be replaced in the title
	 * @returns {string} The transformed title.
	 */
	titleTransform: function (title, titleReplace) {
		let transformedTitle = title;
		for (let needle in titleReplace) {
			const replacement = titleReplace[needle];

			const regParts = needle.match(/^\/(.+)\/([gim]*)$/);
			if (regParts) {
				// the parsed pattern is a regexp.
				needle = new RegExp(regParts[1], regParts[2]);
			}

			transformedTitle = transformedTitle.replace(needle, replacement);
		}
		return transformedTitle;
	}
};

if (typeof module !== "undefined") {
	module.exports = CalendarUtils;
}
