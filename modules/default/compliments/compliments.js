/* global Cron */

Module.register("compliments", {
	// Module config defaults.
	defaults: {
		compliments: {
			anytime: ["Hey there sexy!"],
			morning: ["Good morning, handsome!", "Enjoy your day!", "How was your sleep?"],
			afternoon: ["Hello, beauty!", "You look sexy!", "Looking good today!"],
			evening: ["Wow, you look hot!", "You look nice!", "Hi, sexy!"],
			"....-01-01": ["Happy new year!"]
		},
		updateInterval: 30000,
		remoteFile: null,
		remoteFileRefreshInterval: 0,
		fadeSpeed: 4000,
		morningStartTime: 3,
		morningEndTime: 12,
		afternoonStartTime: 12,
		afternoonEndTime: 17,
		random: true,
		specialDayUnique: false
	},
	urlSuffix: "",
	compliments_new: null,
	refreshMinimumDelay: 15 * 60 * 60 * 1000, // 15 minutes
	lastIndexUsed: -1,
	// Set currentweather from module
	currentWeatherType: "",
	cron_regex: /^(((\d+,)+\d+|((\d+|[*])[/]\d+|((JAN|FEB|APR|MA[RY]|JU[LN]|AUG|SEP|OCT|NOV|DEC)(-(JAN|FEB|APR|MA[RY]|JU[LN]|AUG|SEP|OCT|NOV|DEC))?))|(\d+-\d+)|\d+(-\d+)?[/]\d+(-\d+)?|\d+|[*]|(MON|TUE|WED|THU|FRI|SAT|SUN)(-(MON|TUE|WED|THU|FRI|SAT|SUN))?) ?){5}$/i,
	date_regex: "[1-9.][0-9.][0-9.]{2}-([0][1-9]|[1][0-2])-([1-2][0-9]|[0][1-9]|[3][0-1])",
	pre_defined_types: ["anytime", "morning", "afternoon", "evening"],
	// Define required scripts.
	getScripts () {
		return ["croner.js", "moment.js"];
	},

	// Define start sequence.
	async start () {
		Log.info(`Starting module: ${this.name}`);

		this.lastComplimentIndex = -1;

		if (this.config.remoteFile !== null) {
			const response = await this.loadComplimentFile();
			this.config.compliments = JSON.parse(response);
			this.updateDom();
			if (this.config.remoteFileRefreshInterval !== 0) {
				if ((this.config.remoteFileRefreshInterval >= this.refreshMinimumDelay) || window.mmTestMode === "true") {
					setInterval(async () => {
						const response = await this.loadComplimentFile();
						if (response) {
							this.compliments_new = JSON.parse(response);
						}
						else {
							Log.error(`${this.name} remoteFile refresh failed`);
						}
					},
					this.config.remoteFileRefreshInterval);
				} else {
					Log.error(`${this.name} remoteFileRefreshInterval less than minimum`);
				}
			}
		}
		let minute_sync_delay = 1;
		// loop thru all the configured when events
		for (let m of Object.keys(this.config.compliments)) {
			// if it is a cron entry
			if (this.isCronEntry(m)) {
				// we need to synch our interval cycle to the minute
				minute_sync_delay = (60 - (moment().second())) * 1000;
				break;
			}
		}
		// Schedule update timer. sync to the minute start (if needed), so minute based events happen on the minute start
		setTimeout(() => {
			setInterval(() => {
				this.updateDom(this.config.fadeSpeed);
			}, this.config.updateInterval);
		},
		minute_sync_delay);
	},

	// check to see if this entry could be a cron entry wich contains spaces
	isCronEntry (entry) {
		return entry.includes(" ");
	},

	/**
	 * @param {string} cronExpression The cron expression. See https://croner.56k.guru/usage/pattern/
	 * @param {Date} [timestamp] The timestamp to check. Defaults to the current time.
	 * @returns {number} The number of seconds until the next cron run.
	 */
	getSecondsUntilNextCronRun (cronExpression, timestamp = new Date()) {
		// Required for seconds precision
		const adjustedTimestamp = new Date(timestamp.getTime() - 1000);

		// https://www.npmjs.com/package/croner
		const cronJob = new Cron(cronExpression);
		const nextRunTime = cronJob.nextRun(adjustedTimestamp);

		const secondsDelta = (nextRunTime - adjustedTimestamp) / 1000;
		return secondsDelta;
	},

	/**
	 * Generate a random index for a list of compliments.
	 * @param {string[]} compliments Array with compliments.
	 * @returns {number} a random index of given array
	 */
	randomIndex (compliments) {
		if (compliments.length <= 1) {
			return 0;
		}

		const generate = function () {
			return Math.floor(Math.random() * compliments.length);
		};

		let complimentIndex = generate();

		while (complimentIndex === this.lastComplimentIndex) {
			complimentIndex = generate();
		}

		this.lastComplimentIndex = complimentIndex;

		return complimentIndex;
	},

	/**
	 * Retrieve an array of compliments for the time of the day.
	 * @returns {string[]} array with compliments for the time of the day.
	 */
	complimentArray () {
		const now = moment();
		const hour = now.hour();
		const date = now.format("YYYY-MM-DD");
		let compliments = [];

		// Add time of day compliments
		let timeOfDay;
		if (hour >= this.config.morningStartTime && hour < this.config.morningEndTime) {
			timeOfDay = "morning";
		} else if (hour >= this.config.afternoonStartTime && hour < this.config.afternoonEndTime) {
			timeOfDay = "afternoon";
		} else {
			timeOfDay = "evening";
		}

		if (timeOfDay && this.config.compliments.hasOwnProperty(timeOfDay)) {
			compliments = [...this.config.compliments[timeOfDay]];
		}

		// Add compliments based on weather
		if (this.currentWeatherType in this.config.compliments) {
			Array.prototype.push.apply(compliments, this.config.compliments[this.currentWeatherType]);
			// if the predefine list doesn't include it (yet)
			if (!this.pre_defined_types.includes(this.currentWeatherType)) {
				// add it
				this.pre_defined_types.push(this.currentWeatherType);
			}
		}

		// Add compliments for anytime
		Array.prototype.push.apply(compliments, this.config.compliments.anytime);

		// get the list of just date entry keys
		let temp_list = Object.keys(this.config.compliments).filter((k) => {
			if (this.pre_defined_types.includes(k)) return false;
			else return true;
		});

		let date_compliments = [];
		// Add compliments for special day/times
		for (let entry of temp_list) {
			// check if this could be a cron type entry
			if (this.isCronEntry(entry)) {
				// make sure the regex is valid
				if (new RegExp(this.cron_regex).test(entry)) {
					// check if we are in the time range for the cron entry
					if (this.getSecondsUntilNextCronRun(entry, now.set("seconds", 0).toDate()) <= 1) {
						// if so, use its notice entries
						Array.prototype.push.apply(date_compliments, this.config.compliments[entry]);
					}
				} else Log.error(`compliments cron syntax invalid=${JSON.stringify(entry)}`);
			} else if (new RegExp(entry).test(date)) {
				Array.prototype.push.apply(date_compliments, this.config.compliments[entry]);
			}
		}

		// if we found any date compliments
		if (date_compliments.length) {
			// and the special flag is true
			if (this.config.specialDayUnique) {
				// clear the non-date compliments if any
				compliments.length = 0;
			}
			// put the date based compliments on the list
			Array.prototype.push.apply(compliments, date_compliments);
		}

		return compliments;
	},

	/**
	 * Retrieve a file from the local filesystem
	 * @returns {Promise} Resolved when the file is loaded
	 */
	async loadComplimentFile () {
		const isRemote = this.config.remoteFile.indexOf("http://") === 0 || this.config.remoteFile.indexOf("https://") === 0,
			url = isRemote ? this.config.remoteFile : this.file(this.config.remoteFile);
		// because we may be fetching the same url,
		// we need to force the server to not give us the cached result
		// create an extra property (ignored by the server handler) just so the url string is different
		// that will never be the same, using the ms value of date
		if (isRemote && this.config.remoteFileRefreshInterval !== 0) this.urlSuffix = `?dummy=${Date.now()}`;
		//
		try {
			const response = await fetch(url + this.urlSuffix);
			return await response.text();
		} catch (error) {
			Log.info(`${this.name} fetch failed error=`, error);
		}
	},

	/**
	 * Retrieve a random compliment.
	 * @returns {string} a compliment
	 */
	getRandomCompliment () {
		// get the current time of day compliments list
		const compliments = this.complimentArray();
		// variable for index to next message to display
		let index;
		// are we randomizing
		if (this.config.random) {
			// yes
			index = this.randomIndex(compliments);
		} else {
			// no, sequential
			// if doing sequential, don't fall off the end
			index = this.lastIndexUsed >= compliments.length - 1 ? 0 : ++this.lastIndexUsed;
		}

		return compliments[index] || "";
	},

	// Override dom generator.
	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright pre-line";
		// get the compliment text
		const complimentText = this.getRandomCompliment();
		// split it into parts on newline text
		const parts = complimentText.split("\n");
		// create a span to hold the compliment
		const compliment = document.createElement("span");
		// process all the parts of the compliment text
		for (const part of parts) {
			if (part !== "") {
				// create a text element for each part
				compliment.appendChild(document.createTextNode(part));
				// add a break
				compliment.appendChild(document.createElement("BR"));
			}
		}
		// only add compliment to wrapper if there is actual text in there
		if (compliment.children.length > 0) {
			// remove the last break
			compliment.lastElementChild.remove();
			wrapper.appendChild(compliment);
		}
		// if a new set of compliments was loaded from the refresh task
		// we do this here to make sure no other function is using the compliments list
		if (this.compliments_new) {
			// use them
			if (JSON.stringify(this.config.compliments) !== JSON.stringify(this.compliments_new)) {
				// only reset if the contents changes
				this.config.compliments = this.compliments_new;
				// reset the index
				this.lastIndexUsed = -1;
			}
			// clear new file list so we don't waste cycles comparing between refreshes
			this.compliments_new = null;
		}
		// only in test mode
		if (window.mmTestMode === "true") {
			// check for (undocumented) remoteFile2 to test new file load
			if (this.config.remoteFile2 !== null && this.config.remoteFileRefreshInterval !== 0) {
				// switch the file so that next time it will be loaded from a changed file
				this.config.remoteFile = this.config.remoteFile2;
			}
		}
		return wrapper;
	},

	// Override notification handler.
	notificationReceived (notification, payload, sender) {
		if (notification === "CURRENTWEATHER_TYPE") {
			this.currentWeatherType = payload.type;
		}
	}
});
