const path = require("node:path");
const { JSDOM } = require("jsdom");

describe("Test function cmpVersions in js/module.js", () => {
	let cmp;

	beforeAll(() => {
		return new Promise((done) => {
			const dom = new JSDOM(
				`<script>var Class = {extend: () => { return {}; }};</script>\
				<script src="file://${path.join(__dirname, "..", "..", "..", "js", "module.js")}">`,
				{ runScripts: "dangerously", resources: "usable" }
			);
			dom.window.onload = () => {
				const { cmpVersions } = dom.window;
				cmp = cmpVersions;
				done();
			};
		});
	});

	it("should return -1 when comparing 2.1 to 2.2", () => {
		expect(cmp("2.1", "2.2")).toBe(-1);
	});

	it("should be return 0 when comparing 2.2 to 2.2", () => {
		expect(cmp("2.2", "2.2")).toBe(0);
	});

	it("should be return 1 when comparing 1.1 to 1.0", () => {
		expect(cmp("1.1", "1.0")).toBe(1);
	});
});
