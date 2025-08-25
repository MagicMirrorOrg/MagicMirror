const path = require("node:path");
const { JSDOM } = require("jsdom");

describe("File js/class", () => {
	describe("Test function cloneObject", () => {
		let clone;
		let dom;

		beforeAll(() => {
			return new Promise((done) => {
				dom = new JSDOM(
					`<script>var Log = {log: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "class.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = () => {
					const { cloneObject } = dom.window;
					clone = cloneObject;
					done();
				};
			});
		});

		it("should clone object", () => {
			const expected = { name: "Rodrigo", web: "https://rodrigoramirez.com", project: "MagicMirror" };
			const obj = clone(expected);
			expect(obj).toEqual(expected);
			expect(expected === obj).toBe(false);
		});

		it("should clone array", () => {
			const expected = [1, null, undefined, "TEST"];
			const obj = clone(expected);
			expect(obj).toEqual(expected);
			expect(expected === obj).toBe(false);
		});

		it("should clone number", () => {
			let expected = 1;
			let obj = clone(expected);
			expect(obj).toBe(expected);

			expected = 1.23;
			obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should clone string", () => {
			const expected = "Perfect stranger";
			const obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should clone regex", () => {
			const expected = /.*Magic/;
			const obj = clone(expected);
			expect(obj).toEqual(expected);
			expect(expected === obj).toBe(false);
		});

		it("should clone undefined", () => {
			const expected = undefined;
			const obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should clone null", () => {
			const expected = null;
			const obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should clone nested object", () => {
			const expected = {
				name: "fewieden",
				link: "https://github.com/fewieden",
				versions: ["2.0", "2.1", "2.2"],
				answerForAllQuestions: 42,
				properties: {
					items: [{ foo: "bar" }, { lorem: "ipsum" }],
					invalid: undefined,
					nothing: null
				}
			};
			const obj = clone(expected);
			expect(obj).toEqual(expected);
			expect(expected === obj).toBe(false);
			expect(expected.versions === obj.versions).toBe(false);
			expect(expected.properties === obj.properties).toBe(false);
			expect(expected.properties.items === obj.properties.items).toBe(false);
			expect(expected.properties.items[0] === obj.properties.items[0]).toBe(false);
			expect(expected.properties.items[1] === obj.properties.items[1]).toBe(false);
		});

		describe("Test lockstring code", () => {
			let log;

			beforeAll(() => {
				log = dom.window.Log.log;
				dom.window.Log.log = (str) => {
					expect(str).toBe("lockStrings");
				};
			});

			afterAll(() => {
				dom.window.Log.log = log;
			});

			it("should clone object and log lockStrings", () => {
				const expected = { name: "Module", lockStrings: "stringLock" };
				const obj = clone(expected);
				expect(obj).toEqual(expected);
				expect(expected === obj).toBe(false);
			});
		});
	});
});
