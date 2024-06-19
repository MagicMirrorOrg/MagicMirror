Module.register("greetings", {
	// Define module defaults
	defaults: {
        greetings: {
			anytime: ["hello"],
			morning: ["good morning"],
			afternoon: ["good afternoon"],
			evening: ["good evening"],
			"....-01-01": ["happy new year"]
		},
        morningStartTime: 3,
		morningEndTime: 12,
		afternoonStartTime: 12,
		afternoonEndTime: 17,
        displayTime: 10000,
        animationSpeed: 1000
	},

    getTranslations () {
		return {
			en: "translations/en.json",
			fr: "translations/fr.json"
		};
	},

	// Override start method.
	start () {
		Log.info(`Starting module: ${this.name}`);

        this.personsDetected = [];
        this.lastgreetingIndex = -1;
        this.sendSocketNotification("ADD_GREETINGS"); // Establish connection with node helper if needed
	},

    // Override notification handler.
	notificationReceived (notification, payload, sender) {
        if (notification === "FACE_ADDED") {
			// Greet new person
            this.personDetected(payload);
		} else if (notification === "FACE_REMOVED") {
            // Remove greeting
            this.personRemoved(payload);
        }
	},

    personDetected (payload) {
        for (let name of payload.names) {
            this.personsDetected.push(name);
        }

        setTimeout(() => {
            this.personRemoved(payload);
        }, this.config.displayTime);

        this.updateDom(this.config.animationSpeed);
    },

    personRemoved (payload) {
        for (let name of payload.names) {
            const index = this.personsDetected.indexOf(name);

            if (index !== -1) {
                this.personsDetected.splice(index, 1);

                this.updateDom(this.config.animationSpeed);
            }
        }
    },

    /**
	 * Generate a random index for a list of greetings.
	 * @param {string[]} greetings Array with greetings.
	 * @returns {number} a random index of given array
	 */
	randomIndex (greetings) {
		if (greetings.length <= 1) {
			return 0;
		}

		const generate = function () {
			return Math.floor(Math.random() * greetings.length);
		};

		let greetingIndex = generate();

		while (greetingIndex === this.lastgreetingIndex) {
			greetingIndex = generate();
		}

		this.lastgreetingIndex = greetingIndex;

		return greetingIndex;
	},

	/**
	 * Retrieve an array of greetings for the time of the day.
	 * @returns {string[]} array with greetings for the time of the day.
	 */
	getGreetingsArray () {
		const hour = moment().hour();
		const date = moment().format("YYYY-MM-DD");
		let greetings = [];

		// Add time of day greetings
		if (hour >= this.config.morningStartTime && hour < this.config.morningEndTime && this.config.greetings.hasOwnProperty("morning")) {
			greetings = [...this.config.greetings.morning];
		} else if (hour >= this.config.afternoonStartTime && hour < this.config.afternoonEndTime && this.config.greetings.hasOwnProperty("afternoon")) {
			greetings = [...this.config.greetings.afternoon];
		} else if (this.config.greetings.hasOwnProperty("evening")) {
			greetings = [...this.config.greetings.evening];
		}

		// Add greetings for anytime
		Array.prototype.push.apply(greetings, this.config.greetings.anytime);

		// Add greetings for special days
		for (let entry in this.config.greetings) {
			if (new RegExp(entry).test(date)) {
				Array.prototype.push.apply(greetings, this.config.greetings[entry]);
			}
		}

		return greetings;
	},

	// Override dom generator.
	getDom () {
        const wrapper = document.createElement("div");
        if (this.personsDetected.length) {
            wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright pre-line";
            // get the greeting text
            const greetingsArray = this.getGreetingsArray();
            let greetingsText = this.translate(greetingsArray[this.randomIndex(greetingsArray)])
            // let greetingsText = this.translate("hello");
            // process all the names of persons detected
            for (const [index, name] of this.personsDetected.entries()) {
                greetingsText = greetingsText.concat(" " + name);
                if (index < this.personsDetected.length - 1) {
                    greetingsText = greetingsText.concat(" " + this.translate("and")); 
                }
            }
            greetingsText = greetingsText.concat("!");
            // create a span to hold the greetings
            const greetings = document.createElement("span");
            // create a text element
            greetings.appendChild(document.createTextNode(greetingsText));
            wrapper.appendChild(greetings);
        }
        return wrapper;
	}
});
