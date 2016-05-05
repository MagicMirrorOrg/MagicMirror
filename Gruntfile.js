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
		postcss: {
			lint: {
				options: {
					processors: [
						require("stylelint")({"extends": "stylelint-config-standard", "font-family-name-quotes": "double-where-recommended"}),
						require("postcss-reporter")({ clearMessages: true })
					]
				},
				dist: {
					src: "**/**/**/**/**/**/**/**.css"
				}
			}
		}
	});
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-postcss");
	grunt.registerTask("default", ["eslint", "postcss:lint"]);
};