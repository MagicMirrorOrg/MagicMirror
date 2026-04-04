const { cors, getUserAgent, replaceSecretPlaceholder, isPrivateTarget } = require("#server_functions");

const mockLookup = vi.fn(() => Promise.resolve([{ address: "93.184.216.34", family: 4 }]));

vi.mock("node:dns", () => ({
	promises: {
		lookup: mockLookup
	}
}));

describe("server_functions tests", () => {
	describe("The replaceSecretPlaceholder method", () => {
		it("Calls string without secret placeholder", () => {
			const teststring = "test string without secret placeholder";
			const result = replaceSecretPlaceholder(teststring);
			expect(result).toBe(teststring);
		});

		it("Calls string with 2 secret placeholders", () => {
			const teststring = "test string with secret1=**SECRET_ONE** and secret2=**SECRET_TWO**";
			process.env.SECRET_ONE = "secret1";
			process.env.SECRET_TWO = "secret2";
			const resultstring = `test string with secret1=${process.env.SECRET_ONE} and secret2=${process.env.SECRET_TWO}`;
			const result = replaceSecretPlaceholder(teststring);
			expect(result).toBe(resultstring);
		});
	});

	describe("The cors method", () => {
		let fetchResponse;
		let fetchResponseHeadersGet;
		let fetchResponseArrayBuffer;
		let corsResponse;
		let request;
		let fetchMock;

		beforeEach(() => {
			global.config = { cors: "allowAll" };
			fetchResponseHeadersGet = vi.fn(() => {});
			fetchResponseArrayBuffer = vi.fn(() => {});
			fetchResponse = {
				headers: {
					get: fetchResponseHeadersGet
				},
				arrayBuffer: fetchResponseArrayBuffer,
				ok: true
			};

			fetch = vi.fn();
			fetch.mockImplementation(() => fetchResponse);

			fetchMock = fetch;

			corsResponse = {
				set: vi.fn(() => {}),
				send: vi.fn(() => {}),
				status: vi.fn(function (code) {
					this.statusCode = code;
					return this;
				}),
				json: vi.fn(() => {})
			};

			request = {
				url: "/cors?url=http://www.test.com"
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
			const encoder = new TextEncoder();
			const arrayBuffer = encoder.encode(responseData).buffer;
			fetchResponseArrayBuffer.mockImplementation(() => arrayBuffer);

			let sentData;
			corsResponse.send = vi.fn((input) => {
				sentData = input;
			});

			await cors(request, corsResponse);

			expect(fetchResponseArrayBuffer.mock.calls).toHaveLength(1);
			expect(sentData).toEqual(Buffer.from(arrayBuffer));
		});

		it("Sends error data from response", async () => {
			const error = new Error("error data");
			fetchResponseArrayBuffer.mockImplementation(() => {
				throw error;
			});

			await cors(request, corsResponse);

			expect(fetchResponseArrayBuffer.mock.calls).toHaveLength(1);
			expect(corsResponse.status).toHaveBeenCalledWith(500);
			expect(corsResponse.json).toHaveBeenCalledWith({ error: error.message });
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

		it("Gets User-Agent from configuration", () => {
			const previousConfig = global.config;
			global.config = {};
			let userAgent;

			userAgent = getUserAgent();
			expect(userAgent).toContain("Mozilla/5.0 (Node.js ");

			global.config.userAgent = "Mozilla/5.0 (Foo)";
			userAgent = getUserAgent();
			expect(userAgent).toBe("Mozilla/5.0 (Foo)");

			global.config.userAgent = () => "Mozilla/5.0 (Bar)";
			userAgent = getUserAgent();
			expect(userAgent).toBe("Mozilla/5.0 (Bar)");

			global.config = previousConfig;
		});
	});

	describe("The isPrivateTarget method", () => {
		beforeEach(() => {
			mockLookup.mockReset();
		});

		it("Blocks unparseable URLs", async () => {
			expect(await isPrivateTarget("not a url")).toBe(true);
		});

		it("Blocks non-http protocols", async () => {
			expect(await isPrivateTarget("file:///etc/passwd")).toBe(true);
			expect(await isPrivateTarget("ftp://internal/file")).toBe(true);
		});

		it("Blocks localhost", async () => {
			expect(await isPrivateTarget("http://localhost/path")).toBe(true);
			expect(await isPrivateTarget("http://LOCALHOST:8080/")).toBe(true);
		});

		it("Blocks private IPs (loopback)", async () => {
			mockLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
			expect(await isPrivateTarget("http://loopback.example.com/")).toBe(true);
		});

		it("Blocks private IPs (RFC 1918)", async () => {
			mockLookup.mockResolvedValue([{ address: "192.168.1.1", family: 4 }]);
			expect(await isPrivateTarget("http://internal.example.com/")).toBe(true);
		});

		it("Blocks link-local addresses", async () => {
			mockLookup.mockResolvedValue([{ address: "169.254.169.254", family: 4 }]);
			expect(await isPrivateTarget("http://metadata.example.com/")).toBe(true);
		});

		it("Blocks when DNS lookup fails", async () => {
			mockLookup.mockRejectedValue(new Error("ENOTFOUND"));
			expect(await isPrivateTarget("http://nonexistent.invalid/")).toBe(true);
		});

		it("Allows public unicast IPs", async () => {
			mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
			expect(await isPrivateTarget("http://example.com/api")).toBe(false);
		});

		it("Blocks if any resolved address is private", async () => {
			mockLookup.mockResolvedValue([
				{ address: "93.184.216.34", family: 4 },
				{ address: "127.0.0.1", family: 4 }
			]);
			expect(await isPrivateTarget("http://dual.example.com/")).toBe(true);
		});
	});

	describe("The cors method blocks SSRF", () => {
		it("Returns 403 for private target URLs", async () => {
			mockLookup.mockReset();
			mockLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);

			const request = { url: "/cors?url=http://127.0.0.1:8080/config" };
			const response = {
				set: vi.fn(),
				send: vi.fn(),
				status: vi.fn(function () { return this; }),
				json: vi.fn()
			};

			await cors(request, response);

			expect(response.status).toHaveBeenCalledWith(403);
			expect(response.json).toHaveBeenCalledWith({ error: "Forbidden: private or reserved addresses are not allowed" });
		});
	});

	describe("The isPrivateTarget method with allowWhitelist", () => {
		beforeEach(() => {
			mockLookup.mockReset();
		});

		it("Block public unicast IPs if not whitelistet", async () => {
			global.config = { cors: "allowWhitelist", corsDomainWhitelist: [] };
			mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
			expect(await isPrivateTarget("http://example.com/api")).toBe(true);
		});

		it("Allow public unicast IPs if whitelistet", async () => {
			global.config = { cors: "allowWhitelist", corsDomainWhitelist: ["example.com"] };
			mockLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
			expect(await isPrivateTarget("http://example.com/api")).toBe(false);
		});
	});
});
