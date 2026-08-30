let config = {
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
						url: "http://localhost:8080/tests/mocks/newsfeed_basic_html.xml"
					}
				],
				showDescription: true,
				truncDescription: false,
				allowedBasicHtmlTags: ["b", "strong", "i", "em", "u", "br", "code", "s", "sub", "sup"]
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
