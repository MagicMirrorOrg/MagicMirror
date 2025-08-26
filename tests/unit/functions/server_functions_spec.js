const { expect } = require("playwright/test");
const { cors, getUserAgent } = require("#server_functions");

describe("server_functions tests", () => {
	describe("The cors method", () => {
		let fetchResponse;
		let fetchResponseHeadersGet;
		let fetchResponseHeadersText;
		let corsResponse;
		let request;

		let fetchMock;

		beforeEach(() => {
			fetchResponseHeadersGet = jest.fn(() => {});
			fetchResponseHeadersText = jest.fn(() => {});
			fetchResponse = {
				headers: {
					get: fetchResponseHeadersGet
				},
				text: fetchResponseHeadersText
			};

			fetch = jest.fn();
			fetch.mockImplementation(() => fetchResponse);

			fetchMock = fetch;

			corsResponse = {
				set: jest.fn(() => {}),
				send: jest.fn(() => {})
			};

			request = {
				url: "/cors?url=www.test.com"
			};
		});

		it("Calls correct URL once", async () => {
			const urlToCall = "http://www.test.com/path?param1=value1";
			request.url = `/cors?url=${urlToCall}`;

			await cors(request, corsResponse);

			expect(fetchMock.mock.calls).toHaveLength(1);
			expect(fetchMock.mock.calls[0][0]).toBe(urlToCall);
		});

		it("Forwards Content-Type if json", async () => {
			fetchResponseHeadersGet.mockImplementation(() => "json");

			await cors(request, corsResponse);

			expect(fetchResponseHeadersGet.mock.calls).toHaveLength(1);
			expect(fetchResponseHeadersGet.mock.calls[0][0]).toBe("Content-Type");

			expect(corsResponse.set.mock.calls).toHaveLength(1);
			expect(corsResponse.set.mock.calls[0][0]).toBe("Content-Type");
			expect(corsResponse.set.mock.calls[0][1]).toBe("json");
		});

		it("Forwards Content-Type if xml", async () => {
			fetchResponseHeadersGet.mockImplementation(() => "xml");

			await cors(request, corsResponse);

			expect(fetchResponseHeadersGet.mock.calls).toHaveLength(1);
			expect(fetchResponseHeadersGet.mock.calls[0][0]).toBe("Content-Type");

			expect(corsResponse.set.mock.calls).toHaveLength(1);
			expect(corsResponse.set.mock.calls[0][0]).toBe("Content-Type");
			expect(corsResponse.set.mock.calls[0][1]).toBe("xml");
		});

		it("Sends correct data from response", async () => {
			const responseData = "some data";
			fetchResponseHeadersText.mockImplementation(() => responseData);

			let sentData;
			corsResponse.send = jest.fn((input) => {
				sentData = input;
			});

			await cors(request, corsResponse);

			expect(fetchResponseHeadersText.mock.calls).toHaveLength(1);
			expect(sentData).toBe(responseData);
		});

		it("Sends error data from response", async () => {
			const error = new Error("error data");
			fetchResponseHeadersText.mockImplementation(() => {
				throw error;
			});

			let sentData;
			corsResponse.send = jest.fn((input) => {
				sentData = input;
			});

			await cors(request, corsResponse);

			expect(fetchResponseHeadersText.mock.calls).toHaveLength(1);
			expect(sentData).toBe(error);
		});

		it("Fetches with user agent by default", async () => {
			await cors(request, corsResponse);

			expect(fetchMock.mock.calls).toHaveLength(1);
			expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers");
			expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("User-Agent");
		});

		it("Fetches with specified headers", async () => {
			const headersParam = "sendheaders=header1:value1,header2:value2";
			const urlParam = "http://www.test.com/path?param1=value1";
			request.url = `/cors?${headersParam}&url=${urlParam}`;

			await cors(request, corsResponse);

			expect(fetchMock.mock.calls).toHaveLength(1);
			expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers");
			expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("header1", "value1");
			expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("header2", "value2");
		});

		it("Sends specified headers", async () => {
			fetchResponseHeadersGet.mockImplementation((input) => input.replace("header", "value"));

			const expectedheaders = "expectedheaders=header1,header2";
			const urlParam = "http://www.test.com/path?param1=value1";
			request.url = `/cors?${expectedheaders}&url=${urlParam}`;

			await cors(request, corsResponse);

			expect(fetchMock.mock.calls).toHaveLength(1);
			expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers");
			expect(corsResponse.set.mock.calls).toHaveLength(3);
			expect(corsResponse.set.mock.calls[0][0]).toBe("Content-Type");
			expect(corsResponse.set.mock.calls[1][0]).toBe("header1");
			expect(corsResponse.set.mock.calls[1][1]).toBe("value1");
			expect(corsResponse.set.mock.calls[2][0]).toBe("header2");
			expect(corsResponse.set.mock.calls[2][1]).toBe("value2");
		});

		it("Gets User-Agent from configuration", async () => {
			config = {};
			let userAgent;

			userAgent = getUserAgent();
			expect(userAgent).toContain("Mozilla/5.0 (Node.js ");

			config.userAgent = "Mozilla/5.0 (Foo)";
			userAgent = getUserAgent();
			expect(userAgent).toBe("Mozilla/5.0 (Foo)");

			config.userAgent = () => "Mozilla/5.0 (Bar)";
			userAgent = getUserAgent();
			expect(userAgent).toBe("Mozilla/5.0 (Bar)");
		});
	});
});
