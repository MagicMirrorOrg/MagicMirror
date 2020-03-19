module.exports = function(grunt) {
	require("time-grunt")(grunt);
	var fix = (grunt.option("env") || "lint") === "lint";
	grunt.initConfig({
		eslint: {
			options: {
				fix: fix,
				configFile: ".eslintrc.json"
			},
			target: [
				"js/*.js",
				"modules/default/*.js",
				"modules/default/*/*.js",
				"serveronly/*.js",
				"clientonly/*.js",
				"*.js",
				"tests/**/*.js",
				"!modules/default/alert/notificationFx.js",
				"!modules/default/alert/modernizr.custom.js",
				"!modules/default/alert/classie.js",
				"config/*",
				"translations/translations.js",
				"vendor/vendor.js"
			]
		},
		jsonlint: {
			main: {
				src: [
					"package.json",
					".eslintrc.json",
					".stylelintrc.json",
					"translations/*.json",
					"modules/default/*/translations/*.json",
					"vendor/package.json"
				],
				options: {
					reporter: "jshint"
				}
			}
		}
	});
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-jsonlint");
	grunt.registerTask("default", ["eslint", "jsonlint"]);
};
