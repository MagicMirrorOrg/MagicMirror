let config = {
	modules: [
		{
			module: "clock",
			position: "middle_center",
			config: {
				displayType: "analog",
				analogFace: "face-006",
				showDate: false
			}
		}
	]
};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") {
	module.exports = config;
}
