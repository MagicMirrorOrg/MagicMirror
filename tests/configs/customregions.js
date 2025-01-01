let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules:
		// Using exotic content. This is why don't accept go to JSON configuration file
		(() => {
			let positions = ["row3_left", "top3_left1"];
			let modules = Array();
			for (let idx in positions) {
				modules.push({
					module: "helloworld",
					position: positions[idx],
					config: {
						text: `Text in ${positions[idx]}`
					}
				});
			}
			return modules;
		})()
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
