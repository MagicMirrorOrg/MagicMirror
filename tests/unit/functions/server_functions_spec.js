// Tests use vi.spyOn on shared module objects (dns, global.fetch).
// vi.spyOn modifies the object property directly on the cached module instance, so it
// is intercepted by server_functions.js regardless of the Module.prototype.require override
// in vitest-setup.js.  restoreAllMocks:true auto-restores spies, but may reuse the same
// spy instance — mockClear() is called explicitly in beforeEach to reset call history.
const dns = require("node:dns");
const { cors, getUserAgent, replaceSecretPlaceholder } = require("#server_functions");

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
		let fetchSpy;
		let fetchResponseHeadersGet;
		let fetchResponseArrayBuffer;
		let corsResponse;
		let request;

		beforeEach(() => {
			global.config = { cors: "allowAll" };
			fetchResponseHeadersGet = vi.fn(() => {});
			fetchResponseArrayBuffer = vi.fn(() => {});

			// Mock DNS to return a public IP (SSRF check must pass for these tests)
			vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "93.184.216.34", family: 4 });

			// vi.spyOn may return the same spy instance across tests when restoreAllMocks
			// restores-but-reuses; mockClear() explicitly resets call history each time.
			fetchSpy = vi.spyOn(global, "fetch");
			fetchSpy.mockClear();
			fetchSpy.mockImplementation(() => Promise.resolve({
				headers: { get: fetchResponseHeadersGet },
				arrayBuffer: fetchResponseArrayBuffer,
				ok: true
			}));

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

			expect(fetchSpy.mock.calls).toHaveLength(1);
			expect(fetchSpy.mock.calls[0][0]).toBe(urlToCall);
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

			expect(fetchSpy.mock.calls).toHaveLength(1);
			expect(fetchSpy.mock.calls[0][1]).toHaveProperty("headers");
			expect(fetchSpy.mock.calls[0][1].headers).toHaveProperty("User-Agent");
		});

		it("Fetches with specified headers", async () => {
			const headersParam = "sendheaders=header1:value1,header2:value2";
			const urlParam = "http://www.test.com/path?param1=value1";
			request.url = `/cors?${headersParam}&url=${urlParam}`;

			await cors(request, corsResponse);

			expect(fetchSpy.mock.calls).toHaveLength(1);
			expect(fetchSpy.mock.calls[0][1]).toHaveProperty("headers");
			expect(fetchSpy.mock.calls[0][1].headers).toHaveProperty("header1", "value1");
			expect(fetchSpy.mock.calls[0][1].headers).toHaveProperty("header2", "value2");
		});

		it("Sends specified headers", async () => {
			fetchResponseHeadersGet.mockImplementation((input) => input.replace("header", "value"));

			const expectedheaders = "expectedheaders=header1,header2";
			const urlParam = "http://www.test.com/path?param1=value1";
			request.url = `/cors?${expectedheaders}&url=${urlParam}`;

			await cors(request, corsResponse);

			expect(fetchSpy.mock.calls).toHaveLength(1);
			expect(fetchSpy.mock.calls[0][1]).toHaveProperty("headers");
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

	describe("The cors method blocks SSRF (DNS rebinding safe)", () => {
		let response;

		beforeEach(() => {
			response = {
				set: vi.fn(),
				send: vi.fn(),
				status: vi.fn(function () { return this; }),
				json: vi.fn()
			};
		});

		it("Blocks localhost hostname without DNS", async () => {
			await cors({ url: "/cors?url=http://localhost/path" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
			expect(response.json).toHaveBeenCalledWith({ error: "Forbidden: private or reserved addresses are not allowed" });
		});

		it("Blocks non-http protocols", async () => {
			await cors({ url: "/cors?url=ftp://example.com/file" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});

		it("Blocks invalid URLs", async () => {
			await cors({ url: "/cors?url=not_a_valid_url" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});

		it("Blocks loopback addresses (127.0.0.1)", async () => {
			vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "127.0.0.1", family: 4 });
			await cors({ url: "/cors?url=http://example.com/" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});

		it("Blocks RFC 1918 private addresses (192.168.x.x)", async () => {
			vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "192.168.1.1", family: 4 });
			await cors({ url: "/cors?url=http://example.com/" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});

		it("Blocks link-local / cloud metadata addresses (169.254.169.254)", async () => {
			vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "169.254.169.254", family: 4 });
			await cors({ url: "/cors?url=http://example.com/" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});

		it("Allows public unicast addresses", async () => {
			vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "93.184.216.34", family: 4 });
			vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				headers: { get: vi.fn() },
				arrayBuffer: vi.fn(() => new ArrayBuffer(0))
			});
			await cors({ url: "/cors?url=http://example.com/" }, response);
			expect(response.status).not.toHaveBeenCalledWith(403);
		});
	});

	describe("cors method with allowWhitelist", () => {
		let response;

		beforeEach(() => {
			response = {
				set: vi.fn(),
				send: vi.fn(),
				status: vi.fn(function () { return this; }),
				json: vi.fn()
			};
			vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "93.184.216.34", family: 4 });
			vi.spyOn(global, "fetch").mockResolvedValue({
				ok: true,
				headers: { get: vi.fn() },
				arrayBuffer: vi.fn(() => new ArrayBuffer(0))
			});
		});

		it("Blocks domains not in whitelist", async () => {
			global.config = { cors: "allowWhitelist", corsDomainWhitelist: [] };
			await cors({ url: "/cors?url=http://example.com/api" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});

		it("Allows domains in whitelist", async () => {
			global.config = { cors: "allowWhitelist", corsDomainWhitelist: ["example.com"] };
			await cors({ url: "/cors?url=http://example.com/api" }, response);
			expect(response.status).not.toHaveBeenCalledWith(403);
		});
	});
});
