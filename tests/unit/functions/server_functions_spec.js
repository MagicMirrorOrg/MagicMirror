const { cors } = require("../../../js/server_functions");

describe("server_functions tests", () => {
	describe("The cors method", () => {
		let fetchResponse;
		let fetchResponseHeadersGet;
		let fetchResponseHeadersText;
		let corsResponse;
		let request;

		jest.mock("node-fetch");
		let nodefetch = require("node-fetch");
		let fetchMock;

		beforeEach(() => {
			nodefetch.mockReset();

			fetchResponseHeadersGet = jest.fn(() => {});
			fetchResponseHeadersText = jest.fn(() => {});
			fetchResponse = {
				headers: {
					get: fetchResponseHeadersGet
				},
				text: fetchResponseHeadersText
			};
			jest.mock("node-fetch", () => jest.fn());
			nodefetch.mockImplementation(() => fetchResponse);

			fetchMock = nodefetch;

			corsResponse = {
				set: jest.fn(() => {}),
				send: jest.fn(() => {})
			};

			request = {
				url: `/cors?url=www.test.com`
			};
		});

		test("Calls correct URL once", async () => {
			const urlToCall = "http://www.test.com/path?param1=value1";
			request.url = `/cors?url=${urlToCall}`;

			await cors(request, corsResponse);

			expect(fetchMock.mock.calls.length).toBe(1);
			expect(fetchMock.mock.calls[0][0]).toBe(urlToCall);
		});

		test("Forewards Content-Type if json", async () => {
			fetchResponseHeadersGet.mockImplementation(() => "json");

			await cors(request, corsResponse);

			expect(fetchResponseHeadersGet.mock.calls.length).toBe(1);
			expect(fetchResponseHeadersGet.mock.calls[0][0]).toBe("Content-Type");

			expect(corsResponse.set.mock.calls.length).toBe(1);
			expect(corsResponse.set.mock.calls[0][0]).toBe("Content-Type");
			expect(corsResponse.set.mock.calls[0][1]).toBe("json");
		});

		test("Forewards Content-Type if xml", async () => {
			fetchResponseHeadersGet.mockImplementation(() => "xml");

			await cors(request, corsResponse);

			expect(fetchResponseHeadersGet.mock.calls.length).toBe(1);
			expect(fetchResponseHeadersGet.mock.calls[0][0]).toBe("Content-Type");

			expect(corsResponse.set.mock.calls.length).toBe(1);
			expect(corsResponse.set.mock.calls[0][0]).toBe("Content-Type");
			expect(corsResponse.set.mock.calls[0][1]).toBe("xml");
		});

		test("Sends correct data from response", async () => {
			const responseData = "some data";
			fetchResponseHeadersText.mockImplementation(() => responseData);

			let sentData;
			corsResponse.send = jest.fn((input) => {
				sentData = input;
			});

			await cors(request, corsResponse);

			expect(fetchResponseHeadersText.mock.calls.length).toBe(1);
			expect(sentData).toBe(responseData);
		});

		test("Sends error data from response", async () => {
			const error = new Error("error data");
			fetchResponseHeadersText.mockImplementation(() => {
				throw error;
			});

			let sentData;
			corsResponse.send = jest.fn((input) => {
				sentData = input;
			});

			await cors(request, corsResponse);

			expect(fetchResponseHeadersText.mock.calls.length).toBe(1);
			expect(sentData).toBe(error);
		});

		test("Fetches with user agent by default", async () => {
			await cors(request, corsResponse);

			expect(fetchMock.mock.calls.length).toBe(1);
			expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers");
			expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("User-Agent");
		});

		test("Fetches with specified headers", async () => {
			const headersParam = "sendheaders=header1:value1,header2:value2";
			const urlParam = "http://www.test.com/path?param1=value1";
			request.url = `/cors?${headersParam}&url=${urlParam}`;

			await cors(request, corsResponse);

			expect(fetchMock.mock.calls.length).toBe(1);
			expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers");
			expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("header1", "value1");
			expect(fetchMock.mock.calls[0][1].headers).toHaveProperty("header2", "value2");
		});

		test("Sends specified headers", async () => {
			fetchResponseHeadersGet.mockImplementation((input) => input.replace("header", "value"));

			const expectedheaders = "expectedheaders=header1,header2";
			const urlParam = "http://www.test.com/path?param1=value1";
			request.url = `/cors?${expectedheaders}&url=${urlParam}`;

			await cors(request, corsResponse);

			expect(fetchMock.mock.calls.length).toBe(1);
			expect(fetchMock.mock.calls[0][1]).toHaveProperty("headers");
			expect(corsResponse.set.mock.calls.length).toBe(3);
			expect(corsResponse.set.mock.calls[0][0]).toBe("Content-Type");
			expect(corsResponse.set.mock.calls[1][0]).toBe("header1");
			expect(corsResponse.set.mock.calls[1][1]).toBe("value1");
			expect(corsResponse.set.mock.calls[2][0]).toBe("header2");
			expect(corsResponse.set.mock.calls[2][1]).toBe("value2");
		});
	});
});
