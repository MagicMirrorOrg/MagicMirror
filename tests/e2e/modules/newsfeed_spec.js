const helpers = require("../global-setup");

describe("Newsfeed module", () => {
	afterAll(async () => {
		await helpers.stopApplication();
	});

	describe("Default configuration", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/newsfeed/default.js");
			helpers.getDocument(done);
		});

		it("should show the newsfeed title", (done) => {
			helpers.waitForElement(".newsfeed .newsfeed-source").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Rodrigo Ramirez Blog");
			});
		});

		it("should show the newsfeed article", (done) => {
			helpers.waitForElement(".newsfeed .newsfeed-title").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("QPanel");
			});
		});

		it("should NOT show the newsfeed description", (done) => {
			helpers.waitForElement(".newsfeed").then((elem) => {
				const element = document.querySelector(".newsfeed .newsfeed-desc");
				done();
				expect(element).toBe(null);
			});
		});
	});

	describe("Custom configuration", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/newsfeed/prohibited_words.js");
			helpers.getDocument(done);
		});

		it("should not show articles with prohibited words", (done) => {
			helpers.waitForElement(".newsfeed .newsfeed-title").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Problema VirtualBox");
			});
		});

		it("should show the newsfeed description", (done) => {
			helpers.waitForElement(".newsfeed .newsfeed-desc").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent.length).not.toBe(0);
			});
		});
	});

	describe("Invalid configuration", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/newsfeed/incorrect_url.js");
			helpers.getDocument(done);
		});

		it("should show malformed url warning", (done) => {
			helpers.waitForElement(".newsfeed .small", "No news at the moment.").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("Error in the Newsfeed module. Malformed url.");
			});
		});
	});

	describe("Ignore items", () => {
		beforeAll((done) => {
			helpers.startApplication("tests/configs/modules/newsfeed/ignore_items.js");
			helpers.getDocument(done);
		});

		it("should show empty items info message", (done) => {
			helpers.waitForElement(".newsfeed .small").then((elem) => {
				done();
				expect(elem).not.toBe(null);
				expect(elem.textContent).toContain("No news at the moment.");
			});
		});
	});
});
