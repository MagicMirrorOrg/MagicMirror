const config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	electronOptions: { width: 640, height: 480, show: true, fullscreen: true },
	modules: [
		{
			module: "helloworld",
			position: "top_bar",
			header: "test_header",
			config: {
				text: "Test Display Header"
			}
		},
		{
			module: "helloworld",
			position: "bottom_bar",
			config: {
				text: "Test Hide Header"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
