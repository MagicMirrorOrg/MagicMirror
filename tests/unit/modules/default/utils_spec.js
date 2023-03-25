const { performWebRequest } = require("../../../../modules/default/utils");

const nodeVersion = process.version.match(/^v(\d+)\.*/)[1];

describe("Utils tests", () => {
	describe("The performWebRequest-method", () => {
		if (nodeVersion > 18) {
			const locationHost = "localhost:8080";
			const locationProtocol = "http";

			let fetchResponse;
			let fetchMock;
			let url;

			beforeEach(() => {
				fetchResponse = new Response();
				global.fetch = jest.fn(() => Promise.resolve(fetchResponse));
				fetchMock = global.fetch;

				url = "www.test.com";
			});

			describe("When using cors proxy", () => {
				Object.defineProperty(global, "location", {
					value: {
						host: locationHost,
						protocol: locationProtocol
					}
				});

				test("Calls correct URL once", async () => {
					const urlToCall = "http://www.test.com/path?param1=value1";
					url = urlToCall;

					await performWebRequest(url, "json", true);

					expect(fetchMock.mock.calls.length).toBe(1);
					expect(fetchMock.mock.calls[0][0]).toBe(`${locationProtocol}//${locationHost}/cors?url=${urlToCall}`);
				});

				test("Sends correct headers", async () => {
					const urlToCall = "http://www.test.com/path?param1=value1";
					url = urlToCall;
					const headers = [
						{ name: "header1", value: "value1" },
						{ name: "header2", value: "value2" }
					];

					await performWebRequest(url, "json", true, headers);

					expect(fetchMock.mock.calls.length).toBe(1);
					expect(fetchMock.mock.calls[0][0]).toBe(`${locationProtocol}//${locationHost}/cors?sendheaders=header1:value1,header2:value2&url=${urlToCall}`);
				});
			});

			describe("When not using cors proxy", () => {
				test("Calls correct URL once", async () => {
					const urlToCall = "http://www.test.com/path?param1=value1";
					url = urlToCall;

					await performWebRequest(url);

					expect(fetchMock.mock.calls.length).toBe(1);
					expect(fetchMock.mock.calls[0][0]).toBe(urlToCall);
				});

				test("Sends correct headers", async () => {
					const urlToCall = "http://www.test.com/path?param1=value1";
					url = urlToCall;
					const headers = [
						{ name: "header1", value: "value1" },
						{ name: "header2", value: "value2" }
					];

					await performWebRequest(url, "json", false, headers);

					const expectedHeaders = { headers: { header1: "value1", header2: "value2" } };
					expect(fetchMock.mock.calls.length).toBe(1);
					expect(fetchMock.mock.calls[0][1]).toStrictEqual(expectedHeaders);
				});
			});

			describe("When receiving json format", () => {
				test("Returns undefined when no data is received", async () => {
					const response = await performWebRequest(url);

					expect(response).toBe(undefined);
				});

				test("Returns object when data is received", async () => {
					fetchResponse = new Response('{"body": "some content"}');

					const response = await performWebRequest(url);

					expect(response.body).toBe("some content");
				});

				test("Returns expected headers when data is received", async () => {
					fetchResponse = new Response('{"body": "some content"}', { headers: { header1: "value1", header2: "value2" } });

					const response = await performWebRequest(url, "json", false, undefined, ["header1"]);

					expect(response.headers.length).toBe(1);
					expect(response.headers[0].name).toBe("header1");
					expect(response.headers[0].value).toBe("value1");
				});
			});
		} else {
			test("Always ok, need one test", () => {});
		}
	});
});
