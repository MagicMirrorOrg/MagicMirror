Module.register("mta-tracker", {

	defaults: {
		apiKey: "",
		trains: {
			G: {
				code: 31,
				direction: ['Court Sq', 'Church Ave'],
			},
			L: {
				code: 2,
				direction: ['Manhattan', 'Canarsie'],
			},
		},
		stopIds: [
			"G33N", // Bedford - Nostrand (Court)
			"G33S", // Bedford - Nostrand (Church)
			"L10N", // Lorimer (Manhattan)
			"L10S", // Lorimer (Canarsie)
		],
		directionMap: {
			'Court Sq': 'G33N',
			'Church Ave': 'G33S',
			Manhattan: 'L10N',
			Canarsie: 'L10S',
		},
		reload: 10000, // every 10 seconds
	},
	
	departureTimes: [],

	getScripts: function(){
		return [this.file("node_modules/lodash/lodash.js")];
	},

	getStyles: function() {
		return [this.file("styles/mta-tracker.css")];
	},

	start: function() {
		Log.info("Starting module: " + this.name);

		setInterval(() => {
     	this.sendSocketNotification("CONFIG", this.config);
    }, this.config.reload);
	},

	socketNotificationReceived: function(notification, payload) {
		console.log(this.departureTimes);
		switch (notification) {
			case 'ON_DEPARTURE_TIME':
				this.departureTimes = payload;
				this.updateDom();
				break;
			default:
				break;
		}
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.classList.add("mta-tracker");
		const subwayLinesElements = this.getSubwayLinesDOMElements(Object.keys(this.config.trains));

		_.forEach(subwayLinesElements, (element) => {
			wrapper.appendChild(element);
		});
		return wrapper;
	},

	/**
	 * @param {Object} lines - An array of line name strings.
	 */
	getSubwayLinesDOMElements: function(lines) {
		const elements = [];

		const title = document.createElement("div");
		title.classList.add("mta-tracker-title");
		
		const gStopLocation = document.createElement('h3');
		gStopLocation.innerHTML = 'G: Bedford - Nostrand';
		const lStopLocation = document.createElement('h3');
		lStopLocation.innerHTML = 'L: Lorimer';

		title.appendChild(gStopLocation);
		title.appendChild(lStopLocation);

		elements.push(title);

		lines.forEach((line) => {
			this.config.trains[line].direction.forEach(dir => {
				const train = document.createElement("div");
				const logo = document.createElement("div");
				const name = document.createElement("div");
				const direction = document.createElement("div");
				const time = document.createElement("div");

				train.classList.add("train");
				logo.classList.add("logo");
				name.classList.add("name", line);
				direction.classList.add("direction");
				time.classList.add("time");

				name.innerHTML = line;
				time.innerHTML = '--';

				if (!_.isEmpty(this.departureTimes)) {
					const departureObj = _.find(this.departureTimes, ['stop', this.config.directionMap[dir]]);
					time.innerHTML = departureObj ? `${departureObj.departureTime} min` : `¯\\_(ツ)_/¯`;
				}

				direction.innerHTML = dir;
				logo.appendChild(name);
				train.appendChild(logo);
				train.appendChild(direction);
				train.appendChild(time);
	
				elements.push(train);
			});
		});

		return elements;
	},
});
