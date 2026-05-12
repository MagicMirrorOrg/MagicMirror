const path = require("node:path");
const { JSDOM } = require("jsdom");

describe("File js/module (cloneObject)", () => {
	describe("Test function cloneObject", () => {
		let clone;
		let Module;
		let dom;

		beforeAll(() => {
			return new Promise((done) => {
				dom = new JSDOM(
					`<script>var Log = {log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {}};</script>\
					<script src="file://${path.join(__dirname, "..", "..", "..", "js", "module.js")}">`,
					{ runScripts: "dangerously", resources: "usable" }
				);
				dom.window.onload = () => {
					const { cloneObject, Module: LoadedModule } = dom.window;
					clone = cloneObject;
					Module = LoadedModule;
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

		it("should clone date", () => {
			const expected = new Date("2026-05-11T20:00:00.000Z");
			const obj = clone(expected);
			expect(obj).toEqual(expected);
			expect(expected === obj).toBe(false);
		});

		it("should return URL by reference", () => {
			const expected = new URL("https://magicmirror.builders/path?q=1");
			const obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should return map by reference", () => {
			const mapValue = { nested: [1, 2, 3] };
			const expected = new Map([["module", mapValue]]);
			const obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should return set by reference", () => {
			const setValue = { nested: true };
			const expected = new Set([setValue]);
			const obj = clone(expected);
			expect(obj).toBe(expected);
		});

		it("should return class instances by reference", () => {
			class ModuleDefaults {
				constructor () {
					this.enabled = true;
				}
			}

			const expected = new ModuleDefaults();
			const obj = clone(expected);
			expect(obj).toBe(expected);
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

		describe("Test Module.create", () => {
			let info;

			beforeEach(() => {
				info = dom.window.Log.info;
			});

			afterEach(() => {
				dom.window.Log.info = info;
				Module.definitions = {};
			});

			it("should create module instance with dynamic class name", () => {
				const moduleName = "MMM-TestModule";
				Module.register(moduleName, {
					defaults: {}
				});

				const moduleInstance = Module.create(moduleName);

				expect(moduleInstance.constructor.name).toBe(moduleName);
			});

			it("should use fallback class name for empty module name", () => {
				const moduleName = "";
				Module.register(moduleName, {
					defaults: {}
				});

				const moduleInstance = Module.create(moduleName);

				expect(moduleInstance.constructor.name).toBe("AnonymousModule");
			});

			it("should not throw when init is not a function", () => {
				const moduleName = "MMM-TestModuleNoInitFunction";
				Module.register(moduleName, {
					init: null,
					defaults: {}
				});

				expect(() => Module.create(moduleName)).not.toThrow();
			});

			it("should support lifecycle super call pattern", () => {
				const moduleName = "MMM-TestSuperCall";
				let loggedMessage;

				dom.window.Log.info = (message) => {
					loggedMessage = message;
				};

				Module.register(moduleName, {
					defaults: {},
					start () {
						this.didStart = true;
						Module.prototype.start.call(this);
					}
				});

				const moduleInstance = Module.create(moduleName);
				moduleInstance.name = moduleName;
				moduleInstance.start();

				expect(moduleInstance.didStart).toBe(true);
				expect(loggedMessage).toBe(`Starting module: ${moduleName}`);
			});

			it("should set config when defaults are undefined", () => {
				const moduleName = "MMM-TestNoDefaults";
				Module.register(moduleName, {});

				const moduleInstance = Module.create(moduleName);

				moduleInstance.setConfig({ foo: "bar" }, false);
				expect(moduleInstance.config).toEqual({ foo: "bar" });

				moduleInstance.setConfig({ nested: { value: 1 } }, true);
				expect(moduleInstance.config).toEqual({ nested: { value: 1 } });
			});

			it("should initialize lifecycle fields in setData", () => {
				const moduleName = "MMM-TestSetData";
				Module.register(moduleName, {
					defaults: { fromDefaults: true }
				});

				const moduleInstance = Module.create(moduleName);
				moduleInstance.setData({
					name: moduleName,
					identifier: "module_1",
					config: { fromConfig: true },
					configDeepMerge: false
				});

				expect(moduleInstance.name).toBe(moduleName);
				expect(moduleInstance.identifier).toBe("module_1");
				expect(moduleInstance.hidden).toBe(false);
				expect(moduleInstance.hasAnimateIn).toBe(false);
				expect(moduleInstance.hasAnimateOut).toBe(false);
				expect(moduleInstance.config).toEqual({ fromDefaults: true, fromConfig: true });
			});

			it("should not share defaults object across module instances", () => {
				const moduleName = "MMM-TestDefaultsIsolation";
				Module.register(moduleName, {
					defaults: {
						nested: { value: 1 },
						list: [1]
					}
				});

				const firstModuleInstance = Module.create(moduleName);
				const secondModuleInstance = Module.create(moduleName);

				firstModuleInstance.defaults.nested.value = 42;
				firstModuleInstance.defaults.list.push(2);

				expect(secondModuleInstance.defaults).toEqual({
					nested: { value: 1 },
					list: [1]
				});
			});
		});
	});
});
