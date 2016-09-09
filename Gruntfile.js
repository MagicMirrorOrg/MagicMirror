module.exports = function(grunt) {
	require("time-grunt")(grunt);
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		eslint: {
			options: {
				configFile: ".eslintrc.json"
			},
			target: ["js/*.js", "modules/default/*.js", "serveronly/*.js", "*.js"]
		},
		stylelint: {
			simple: {
				options: {
					configFile: ".stylelintrc"
				},
				src: ["css/main.css", "modules/default/calendar/calendar.css", "modules/default/clock/clock_styles.css", "modules/default/currentweather/currentweather.css", "modules/default/weatherforcast/weatherforcast.css"]
			}
		}
	});
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-stylelint");
	grunt.registerTask("default", ["eslint", "stylelint"]);
};
