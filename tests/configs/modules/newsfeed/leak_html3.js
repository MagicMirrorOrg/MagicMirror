const config = {
	address: "0.0.0.0",
	ipWhitelist: [],
	timeFormat: 12,

	modules: [
		{
			module: "newsfeed",
			position: "bottom_bar",
			config: {
				feeds: [
					{
						title: "Formatting Feed",
						url: "http://localhost:8080/tests/mocks/newsfeed_leak_html.xml"
					}
				],
				showDescription: true,
				truncDescription: false,
				allowedBasicHtmlTags: "b"
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
