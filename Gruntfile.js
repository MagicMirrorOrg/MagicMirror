module.exports = function(grunt) {
	require("time-grunt")(grunt);
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
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
	grunt.loadNpmTasks("grunt-jsonlint");
	grunt.registerTask("default", ["jsonlint"]);
};
