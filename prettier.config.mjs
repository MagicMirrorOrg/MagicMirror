const config = {
	plugins: ["prettier-plugin-jinja-template"],
	overrides: [
		{
			files: "*.md",
			options: {
				parser: "markdown"
			}
		},
		{
			files: ["*.njk"],
			options: {
				parser: "jinja-template"
			}
		}
	],
	trailingComma: "none"
};

export default config;
