const CalendarUtils = {

	/**
	 * Capitalize the first letter of a string
	 * @param {string} string The string to capitalize
	 * @returns {string} The capitalized string
	 */
	capFirst (string) {
		return string.charAt(0).toUpperCase() + string.slice(1);
	},

	/**
	 * This function accepts a number (either 12 or 24) and returns a moment.js LocaleSpecification with the
	 * corresponding time-format to be used in the calendar display. If no number is given (or otherwise invalid input)
	 * it will a localeSpecification object with the system locale time format.
	 * @param {number} timeFormat Specifies either 12 or 24-hour time format
	 * @returns {moment.LocaleSpecification} formatted time
	 */
	getLocaleSpecification (timeFormat) {
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
	shorten (string, maxLength, wrapEvents, maxTitleLines) {
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
	 * @param {string} title The title to transform.
	 * @param {object} titleReplace object definition of parts to be replaced in the title
	 *                 object definition:
	 *                    search: {string,required} RegEx in format //x or simple string to be searched. For (birthday) year calcluation, the element matching the year must be in a RegEx group
	 *                    replace: {string,required} Replacement string, may contain match group references (latter is required for year calculation)
	 *                    yearmatchgroup: {number,optional} match group for year element
	 * @returns {string} The transformed title.
	 */
	titleTransform (title, titleReplace) {
		let transformedTitle = title;
		for (let tr in titleReplace) {
			let transform = titleReplace[tr];
			if (typeof transform === "object") {
				if (typeof transform.search !== "undefined" && transform.search !== "" && typeof transform.replace !== "undefined") {
					let regParts = transform.search.match(/^\/(.+)\/([gim]*)$/);
					let needle = new RegExp(transform.search, "g");
					if (regParts) {
						// the parsed pattern is a regexp with flags.
						needle = new RegExp(regParts[1], regParts[2]);
					}

					let replacement = transform.replace;
					if (typeof transform.yearmatchgroup !== "undefined" && transform.yearmatchgroup !== "") {
						const yearmatch = [...title.matchAll(needle)];
						if (yearmatch[0].length >= transform.yearmatchgroup + 1 && yearmatch[0][transform.yearmatchgroup] * 1 >= 1900) {
							let calcage = new Date().getFullYear() - yearmatch[0][transform.yearmatchgroup] * 1;
							let searchstr = `$${transform.yearmatchgroup}`;
							replacement = replacement.replace(searchstr, calcage);
						}
					}
					transformedTitle = transformedTitle.replace(needle, replacement);
				}
			}
		}
		return transformedTitle;
	}
};

if (typeof module !== "undefined") {
	module.exports = CalendarUtils;
}
