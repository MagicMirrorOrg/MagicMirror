const helpers = require("./global-setup");

describe("App environment", () => {
	beforeAll((done) => {
		helpers.startApplication("tests/configs/default.js");
		helpers.getDocument(done);
	});
	afterAll(async () => {
		await helpers.stopApplication();
	});

	it("get request from http://localhost:8080 should return 200", (done) => {
		helpers.fetch(done, "http://localhost:8080").then((res) => {
			expect(res.status).toBe(200);
		});
	});

	it("get request from http://localhost:8080/nothing should return 404", (done) => {
		helpers.fetch(done, "http://localhost:8080/nothing").then((res) => {
			expect(res.status).toBe(404);
		});
	});

	it("should show the title MagicMirror²", (done) => {
		helpers.waitForElement(done, "title").then((elem) => {
			expect(elem).not.toBe(null);
			expect(elem.textContent).toBe("MagicMirror²");
		});
	});
});
