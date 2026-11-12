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
				return { longDateFormat: { LT: globalThis.moment.localeData().longDateFormat("LT") } };
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

		// Order matters: "&" must be escaped first, otherwise the entities added below would be escaped again.
		const escapeHtml = (value) => value
			.replaceAll("&", "&amp;")
			.replaceAll("<", "&lt;")
			.replaceAll(">", "&gt;")
			.replaceAll("\"", "&quot;")
			.replaceAll("'", "&#39;");

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
						temp += `${escapeHtml(currentLine)}<br>${escapeHtml(word)} `;
					} else {
						temp += `${escapeHtml(word)}<br>`;
					}
					currentLine = "";
				}
			}

			return (temp + escapeHtml(currentLine)).trim();
		} else {
			if (maxLength && typeof maxLength === "number" && string.length > maxLength) {
				return `${escapeHtml(string.trim().slice(0, maxLength))}…`;
			} else {
				return escapeHtml(string.trim());
			}
		}
	},

	/**
	 * Transforms the title of an event for usage.
	 * Replaces parts of the text as defined in config.titleReplace.
	 * @param {string} title The title to transform.
	 * @param {object} titleReplace object definition of parts to be replaced in the title
	 *                 object definition:
	 *                    search: {string,required} RegEx in format //x or simple string to be searched. For (birthday) year calculation, the element matching the year must be in a RegEx group
	 *                    replace: {string,required} Replacement string, may contain match group references (latter is required for year calculation)
	 *                    yearmatchgroup: {number,optional} match group for year element
	 * @returns {string} The transformed title.
	 */
	titleTransform (title, titleReplace) {
		let transformedTitle = title;
		for (const tr in titleReplace) {
			const transform = titleReplace[tr];
			if (typeof transform === "object") {
				if (typeof transform.search !== "undefined" && transform.search !== "" && typeof transform.replace !== "undefined") {
					const regParts = transform.search.match(/^\/(.+)\/([gim]*)$/);
					let needle = new RegExp(transform.search, "g");
					if (regParts) {
						// the parsed pattern is a regexp with flags.
						needle = new RegExp(regParts[1], regParts[2]);
					}

					let replacement = transform.replace;
					if (typeof transform.yearmatchgroup !== "undefined" && transform.yearmatchgroup !== "") {
						const yearmatch = [...title.matchAll(needle)];
						if (yearmatch.length > 0 && yearmatch[0].length >= transform.yearmatchgroup + 1 && yearmatch[0][transform.yearmatchgroup] * 1 >= 1900) {
							const calcage = new Date().getFullYear() - yearmatch[0][transform.yearmatchgroup] * 1;
							const searchstr = `$${transform.yearmatchgroup}`;
							replacement = replacement.replace(searchstr, calcage);
						}
					}
					transformedTitle = transformedTitle.replace(needle, replacement);
				}
			}
		}
		return transformedTitle;
	},

	/**
	 * Checks whether a calendar event has a non-zero duration.
	 * @param {object} event The calendar event.
	 * @returns {boolean} True if the event has a duration.
	 */
	hasEventDuration (event) {
		return event.startDate !== event.endDate;
	},

	/**
	 * Adjusts an exclusive full-day end to the final second of the event.
	 * @param {moment.Moment} endMoment The exclusive event end.
	 * @returns {moment.Moment} The adjusted end moment.
	 */
	getAdjustedFullDayEndMoment (endMoment) {
		return endMoment.clone().subtract(1, "second");
	},

	/**
	 * Determines whether two moments are on the same day.
	 * @param {moment.Moment} startMoment The start moment.
	 * @param {moment.Moment} endMoment The end moment.
	 * @returns {boolean} True when both moments share the same calendar day.
	 */
	isSameDay (startMoment, endMoment) {
		return startMoment.isSame(endMoment, "d");
	},

	/**
	 * Checks whether the given dateFormat already contains time components.
	 * @param {string} dateFormat The moment.js date format.
	 * @returns {boolean} True when dateFormat includes time tokens.
	 */
	dateFormatIncludesTime (dateFormat) {
		const dateFormatWithoutLiterals = dateFormat.replace(/\[[^\]]*\]/g, "");
		const localeDateFormat = globalThis.moment.localeData();
		const expandedDateFormat = dateFormatWithoutLiterals.replace(
			/LTS|LT|LLLL|LLL|LL|L|llll|lll|ll|l/g,
			(token) => localeDateFormat.longDateFormat(token) || token
		);
		const expandedDateFormatWithoutLiterals = expandedDateFormat.replace(/\[[^\]]*\]/g, "");
		return (/(H{1,2}|h{1,2}|k{1,2}|m{1,2}|s{1,2}|a|A)/).test(expandedDateFormatWithoutLiterals);
	},

	/**
	 * Formats a timed event end value.
	 * Uses time-only for same-day events and dateEndFormat for multi-day events.
	 * @param {moment.Moment} startMoment The event start moment.
	 * @param {moment.Moment} endMoment The event end moment.
	 * @param {string} dateEndFormat The moment.js format used for multi-day ends.
	 * @returns {string} The formatted end value.
	 */
	formatTimedEventEnd (startMoment, endMoment, dateEndFormat) {
		const endFormat = CalendarUtils.isSameDay(startMoment, endMoment) ? "LT" : dateEndFormat;
		return CalendarUtils.capFirst(endMoment.format(endFormat));
	},

	/**
	 * Builds the time text for `timeFormat: "absolute"`.
	 * @param {object} event The calendar event.
	 * @param {moment.Moment} eventStartDateMoment The event start.
	 * @param {moment.Moment} eventEndDateMoment The event end.
	 * @param {moment.Moment} now The current moment.
	 * @param {object} config The calendar module config.
	 * @param {(key: string, variables?: object) => string} translate The module translate function.
	 * @returns {string} The time text.
	 */
	buildAbsoluteTimeText (event, eventStartDateMoment, eventEndDateMoment, now, config, translate) {
		let timeText = CalendarUtils.capFirst(eventStartDateMoment.format(config.dateFormat));

		if (config.showEnd && (!config.showEndsOnlyWithDuration || CalendarUtils.hasEventDuration(event))) {
			const sameDay = CalendarUtils.isSameDay(eventStartDateMoment, eventEndDateMoment);
			if (sameDay && !CalendarUtils.dateFormatIncludesTime(config.dateFormat)) {
				timeText += `, ${eventStartDateMoment.format("LT")}`;
			}
			timeText += `-${CalendarUtils.formatTimedEventEnd(eventStartDateMoment, eventEndDateMoment, config.dateEndFormat)}`;
		}

		if (event.fullDayEvent) {
			const adjustedEndMoment = CalendarUtils.getAdjustedFullDayEndMoment(eventEndDateMoment);
			timeText = CalendarUtils.capFirst(eventStartDateMoment.format(config.fullDayEventDateFormat));

			if (config.showEnd && !config.showEndsOnlyWithDuration && !eventStartDateMoment.isSame(adjustedEndMoment, "d")) {
				timeText += `-${CalendarUtils.capFirst(adjustedEndMoment.format(config.fullDayEventDateFormat))}`;
			} else if (!eventStartDateMoment.isSame(adjustedEndMoment, "d") && eventStartDateMoment.isBefore(now)) {
				timeText = CalendarUtils.capFirst(now.format(config.fullDayEventDateFormat));
			}

			if (config.nextDaysRelative) {
				let relativeLabel = false;
				if (event.today) {
					timeText = CalendarUtils.capFirst(translate("TODAY"));
					relativeLabel = true;
				} else if (event.yesterday) {
					timeText = CalendarUtils.capFirst(translate("YESTERDAY"));
					relativeLabel = true;
				} else if (event.tomorrow) {
					timeText = CalendarUtils.capFirst(translate("TOMORROW"));
					relativeLabel = true;
				} else if (event.dayAfterTomorrow && translate("DAYAFTERTOMORROW") !== "DAYAFTERTOMORROW") {
					timeText = CalendarUtils.capFirst(translate("DAYAFTERTOMORROW"));
					relativeLabel = true;
				}

				if (relativeLabel && config.showEnd && !config.showEndsOnlyWithDuration && !eventStartDateMoment.isSame(adjustedEndMoment, "d")) {
					timeText += `-${CalendarUtils.capFirst(adjustedEndMoment.format(config.fullDayEventDateFormat))}`;
				}
			}

			return timeText;
		}

		if (config.getRelative > 0 && eventStartDateMoment.isBefore(now)) {
			return CalendarUtils.capFirst(
				translate("RUNNING", {
					fallback: `${translate("RUNNING")} {timeUntilEnd}`,
					timeUntilEnd: eventEndDateMoment.fromNow(true)
				})
			);
		}

		if (config.urgency > 0 && eventStartDateMoment.diff(now, "d") < config.urgency) {
			return CalendarUtils.capFirst(eventStartDateMoment.fromNow());
		}

		return timeText;
	},

	/**
	 * Builds the time text for `timeFormat: "relative"`.
	 * @param {object} event The calendar event.
	 * @param {moment.Moment} eventStartDateMoment The event start.
	 * @param {moment.Moment} eventEndDateMoment The event end.
	 * @param {moment.Moment} now The current moment.
	 * @param {object} config The calendar module config.
	 * @param {(key: string, variables?: object) => string} translate The module translate function.
	 * @returns {string} The time text.
	 */
	buildRelativeTimeText (event, eventStartDateMoment, eventEndDateMoment, now, config, translate) {
		if (eventStartDateMoment.isSameOrAfter(now) || (event.fullDayEvent && eventEndDateMoment.diff(now, "days") === 0)) {
			let timeText;

			if (!config.hideTime && !event.fullDayEvent) {
				Log.debug("[calendar] event not hidden and not fullday");
				timeText = `${CalendarUtils.capFirst(eventStartDateMoment.calendar(null, { sameElse: config.dateFormat }))}`;
			} else {
				Log.debug("[calendar] event full day or hidden");
				timeText = `${CalendarUtils.capFirst(
					eventStartDateMoment.calendar(null, {
						sameDay: config.showTimeToday ? "LT" : `[${translate("TODAY")}]`,
						nextDay: `[${translate("TOMORROW")}]`,
						nextWeek: "dddd",
						sameElse: event.fullDayEvent ? config.fullDayEventDateFormat : config.dateFormat
					})
				)}`;
			}

			if (event.fullDayEvent) {
				if (event.today || (event.fullDayEvent && eventEndDateMoment.diff(now, "days") === 0)) {
					timeText = CalendarUtils.capFirst(translate("TODAY"));
				} else if (event.dayBeforeYesterday) {
					if (translate("DAYBEFOREYESTERDAY") !== "DAYBEFOREYESTERDAY") {
						timeText = CalendarUtils.capFirst(translate("DAYBEFOREYESTERDAY"));
					}
				} else if (event.yesterday) {
					timeText = CalendarUtils.capFirst(translate("YESTERDAY"));
				} else if (event.tomorrow) {
					timeText = CalendarUtils.capFirst(translate("TOMORROW"));
				} else if (event.dayAfterTomorrow) {
					if (translate("DAYAFTERTOMORROW") !== "DAYAFTERTOMORROW") {
						timeText = CalendarUtils.capFirst(translate("DAYAFTERTOMORROW"));
					}
				}

				if (config.showEnd && !config.showEndsOnlyWithDuration) {
					const adjustedEndMoment = CalendarUtils.getAdjustedFullDayEndMoment(eventEndDateMoment);
					if (!eventStartDateMoment.isSame(adjustedEndMoment, "d")) {
						timeText += `-${CalendarUtils.capFirst(adjustedEndMoment.format(config.fullDayEventDateFormat))}`;
					}
				}

				Log.info("[calendar] event fullday");
			} else if (eventStartDateMoment.diff(now, "h") < config.getRelative) {
				Log.info("[calendar] not full day but within getRelative size");
				timeText = `${CalendarUtils.capFirst(eventStartDateMoment.fromNow())}`;
			} else if (!config.hideTime && config.showEnd && (!config.showEndsOnlyWithDuration || CalendarUtils.hasEventDuration(event))) {
				if (CalendarUtils.isSameDay(eventStartDateMoment, eventEndDateMoment)) {
					const sameElseFormat = CalendarUtils.dateFormatIncludesTime(config.dateFormat) ? config.dateFormat : `${config.dateFormat}, LT`;
					timeText = CalendarUtils.capFirst(
						eventStartDateMoment.calendar(null, { sameElse: sameElseFormat })
					);
				}
				timeText += `-${CalendarUtils.formatTimedEventEnd(eventStartDateMoment, eventEndDateMoment, config.dateEndFormat)}`;
			}

			return timeText;
		}

		return CalendarUtils.capFirst(
			translate("RUNNING", {
				fallback: `${translate("RUNNING")} {timeUntilEnd}`,
				timeUntilEnd: eventEndDateMoment.fromNow(true)
			})
		);
	}
};

globalThis.CalendarUtils = CalendarUtils;

export default CalendarUtils;
