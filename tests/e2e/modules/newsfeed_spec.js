const helpers = require("../global-setup");

describe("Newsfeed module", function () {
	afterAll(function () {
		helpers.stopApplication();
	});

	describe("Default configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/default.js");
			helpers.getDocument(done, 3000);
		});

		it("should show the newsfeed title", function () {
			const elem = document.querySelector(".newsfeed .newsfeed-source");
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("Rodrigo Ramirez Blog");
		});

		it("should show the newsfeed article", function () {
			const elem = document.querySelector(".newsfeed .newsfeed-title");
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("QPanel");
		});

		it("should NOT show the newsfeed description", () => {
			const elem = document.querySelector(".newsfeed .newsfeed-desc");
			expect(elem).toBe(null);
		});
	});

	describe("Custom configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/prohibited_words.js");
			helpers.getDocument(done, 3000);
		});

		it("should not show articles with prohibited words", function () {
			const elem = document.querySelector(".newsfeed .newsfeed-title");
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("Problema VirtualBox");
		});

		it("should show the newsfeed description", () => {
			const elem = document.querySelector(".newsfeed .newsfeed-desc");
			expect(elem).not.toBe(null);
			expect(elem.textContent.length).not.toBe(0);
		});
	});

	describe("Invalid configuration", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/incorrect_url.js");
			helpers.getDocument(done, 3000);
		});

		it("should show malformed url warning", function () {
			const elem = document.querySelector(".newsfeed .small");
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("Error in the Newsfeed module. Malformed url.");
		});
	});

	describe("Ignore items", function () {
		beforeAll(function (done) {
			helpers.startApplication("tests/configs/modules/newsfeed/ignore_items.js");
			helpers.getDocument(done, 3000);
		});

		it("should show empty items info message", function () {
			const elem = document.querySelector(".newsfeed .small");
			expect(elem).not.toBe(null);
			expect(elem.textContent).toContain("No news at the moment.");
		});
	});
});
