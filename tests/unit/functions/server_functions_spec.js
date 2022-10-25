const { cors } = require("../../../js/server_functions");

describe("server_functions tests", () => {
	describe("The cors method", () => {
		let fetchResponse;
		let fetchResponseHeadersGet;
		let fetchResponseHeadersText;
		let corsResponse;
		let request;

		beforeEach(() => {
			fetchResponse = new Response();
			global.fetch = jest.fn(() => Promise.resolve(fetchResponse));
			fetchResponseHeadersGet = jest.spyOn(fetchResponse.headers, "get");
			fetchResponseHeadersText = jest.spyOn(fetchResponse, "text");

			corsResponse = {
				set: jest.fn(() => {}),
				send: jest.fn(() => {})
			};

			request = {
				url: `/cors?url=www.test.com`
			};
		});

		test("Calls correct URL once", async () => {
			const urlToCall = "ttp://www.test.com/path?param1=value1";
			request.url = `/cors?url=${urlToCall}`;

			await cors(request, corsResponse);

			expect(global.fetch.mock.calls.length).toBe(1);
			expect(global.fetch.mock.calls[0][0]).toBe(urlToCall);
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

		test("Sends user agent by default", async () => {
			await cors(request, corsResponse);

			expect(global.fetch.mock.calls.length).toBe(1);
			expect(global.fetch.mock.calls[0][1]).toHaveProperty("headers");
			expect(global.fetch.mock.calls[0][1].headers).toHaveProperty("User-Agent");
		});
	});
});
