import { createRequire } from "node:module";
import dns from "node:dns";
import http from "node:http";
import undici from "undici";
import { cors, getUserAgent, replaceSecretPlaceholder } from "#server_functions";

const require = createRequire(import.meta.url);
const commonJSExports = require("#server_functions");

const realUndiciFetch = undici.fetch.bind(undici);
const realBuildConnector = undici.buildConnector.bind(undici);

describe("server_functions tests", () => {
	it("preserves the CommonJS API", () => {
		expect(Object.getPrototypeOf(commonJSExports)).toBe(Object.prototype);
		expect(commonJSExports).toHaveProperty("cors", expect.any(Function));
		expect(commonJSExports).toHaveProperty("getUserAgent", expect.any(Function));
		expect(commonJSExports).toHaveProperty("replaceSecretPlaceholder", expect.any(Function));
	});

	describe("The replaceSecretPlaceholder method with cors=allowWhitelist", () => {
		beforeEach(() => {
			global.config = { cors: "allowWhitelist" };
		});

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

	describe("The replaceSecretPlaceholder method with cors=allowAll", () => {
		beforeEach(() => {
			global.config = { cors: "allowAll" };
		});

		it("Calls string without secret placeholder", () => {
			const teststring = "test string without secret placeholder";
			const result = replaceSecretPlaceholder(teststring);
			expect(result).toBe(teststring);
		});

		it("Calls string with 2 secret placeholders", () => {
			const teststring = "test string with secret1=**SECRET_ONE** and secret2=**SECRET_TWO**";
			const result = replaceSecretPlaceholder(teststring);
			expect(result).toBe(teststring);
		});
	});

	describe("The replaceSecretPlaceholder method with an allowedSecrets set", () => {
		beforeEach(() => {
			global.config = { cors: "allowWhitelist" };
			process.env.SECRET_ALLOWED = "allowed-value";
			process.env.SECRET_DENIED = "denied-value";
		});

		it("Restores only allowed secrets and keeps denied placeholders untouched", () => {
			const teststring = "allowed=**SECRET_ALLOWED** denied=**SECRET_DENIED**";
			const result = replaceSecretPlaceholder(teststring, new Set(["SECRET_ALLOWED"]));
			expect(result).toBe("allowed=allowed-value denied=**SECRET_DENIED**");
			expect(result).not.toContain("denied-value");
		});

		it("Does not restore any placeholder when the set is empty", () => {
			const teststring = "value=**SECRET_ALLOWED**";
			const result = replaceSecretPlaceholder(teststring, new Set());
			expect(result).toBe(teststring);
		});

		it("Falls back to the placeholder if the allowed secret doesn't exist in environment", () => {
			const teststring = "value=**SECRET_MISSING**";
			const result = replaceSecretPlaceholder(teststring, new Set(["SECRET_MISSING"]));
			expect(result).toBe(teststring);
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
			fetchSpy = vi.spyOn(undici, "fetch");
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
			vi.spyOn(undici, "fetch").mockImplementation((...args) => realUndiciFetch(...args));
		});

		it("Blocks localhost hostname without DNS", async () => {
			await cors({ url: "/cors?url=http://localhost/path" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
			expect(response.json).toHaveBeenCalledWith({ error: "Forbidden: private or reserved addresses are not allowed" });
			expect(dns.promises.lookup).not.toHaveBeenCalled();
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
			vi.spyOn(undici, "fetch").mockImplementation((...args) => realUndiciFetch(...args));
		});

		it("Blocks domains not in whitelist", async () => {
			global.config = { cors: "allowWhitelist", corsDomainWhitelist: [] };
			await cors({ url: "/cors?url=http://example.com/api" }, response);
			expect(response.status).toHaveBeenCalledWith(403);
		});
	});

	describe("The cors method validates redirect targets", () => {
		let server;
		let port;
		let response;

		beforeEach(async () => {
			global.config = { cors: "allowAll" };
			response = {
				set: vi.fn(),
				send: vi.fn(),
				status: vi.fn(function () { return this; }),
				json: vi.fn()
			};

			vi.spyOn(undici, "fetch").mockImplementation((...args) => realUndiciFetch(...args));
			// Keep the request hostname for CORS checks, but route its socket to the local test server.
			vi.spyOn(undici, "buildConnector").mockImplementation((connectorOptions) => {
				const connector = realBuildConnector(connectorOptions);
				return (options, callback) => connector({ ...options, hostname: "127.0.0.1", servername: null }, callback);
			});

			server = http.createServer((req, res) => {
				const redirects = {
					"/redirect-allowed": `http://second.test:${port}/final`,
					"/redirect-private-domain": `http://internal.test:${port}/secret`,
					"/redirect-loopback-ip": `http://127.0.0.1:${port}/secret`,
					"/redirect-outside-whitelist": `http://outside.test:${port}/final`
				};
				if (redirects[req.url]) {
					res.writeHead(302, { Location: redirects[req.url] });
					res.end();
					return;
				}
				res.writeHead(200, { "Content-Type": "text/plain" });
				res.end("redirect-ok");
			});

			await new Promise((resolve) => {
				server.listen(0, "127.0.0.1", resolve);
			});
			({ port } = server.address());
		});

		afterEach(async () => {
			await new Promise((resolve) => {
				server.close(resolve);
			});
		});

		it("Follows redirects when all hops resolve to public unicast addresses and are whitelisted", async () => {
			global.config = { cors: "allowWhitelist", corsDomainWhitelist: ["first.test", "second.test"] };
			const lookupSpy = vi.spyOn(dns.promises, "lookup").mockResolvedValue({ address: "93.184.216.34", family: 4 });

			await cors({ url: `/cors?url=http://first.test:${port}/redirect-allowed` }, response);

			expect(lookupSpy.mock.calls.map(([hostname]) => hostname)).toEqual(["first.test", "second.test"]);
			expect(response.send).toHaveBeenCalledWith(Buffer.from("redirect-ok"));
		});

		it.each([
			{
				name: "a private DNS result",
				path: "/redirect-private-domain",
				config: { cors: "allowAll" },
				addresses: ["93.184.216.34", "127.0.0.1"],
				error: "Forbidden: private or reserved addresses are not allowed"
			},
			{
				name: "a loopback IP literal",
				path: "/redirect-loopback-ip",
				config: { cors: "allowAll" },
				addresses: ["93.184.216.34", "127.0.0.1"],
				error: "Forbidden: private or reserved addresses are not allowed"
			},
			{
				name: "a host outside the whitelist",
				path: "/redirect-outside-whitelist",
				config: { cors: "allowWhitelist", corsDomainWhitelist: ["first.test"] },
				addresses: ["93.184.216.34"],
				error: "Forbidden: domain not in corsDomainWhitelist"
			}
		])("Blocks redirects to $name", async ({ path, config, addresses, error }) => {
			global.config = config;
			const lookupAddresses = [...addresses];
			vi.spyOn(dns.promises, "lookup").mockImplementation(() => {
				return Promise.resolve({ address: lookupAddresses.shift(), family: 4 });
			});

			await cors({ url: `/cors?url=http://first.test:${port}${path}` }, response);

			expect(response.status).toHaveBeenCalledWith(403);
			expect(response.json).toHaveBeenCalledWith({ error: error });
		});
	});
});
