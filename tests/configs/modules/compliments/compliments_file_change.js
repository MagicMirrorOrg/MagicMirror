let config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	modules: [
		{
			module: "compliments",
			position: "bottom_bar",
			config: {
				updateInterval: 3000,
				remoteFileRefreshInterval: 1500,
				remoteFile: "http://localhost:8080/tests/mocks/compliments_test.json",
				remoteFile2: "http://localhost:8080/tests/mocks/compliments_file.json"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }
