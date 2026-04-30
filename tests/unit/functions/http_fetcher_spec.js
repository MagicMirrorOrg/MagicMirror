const { http, HttpResponse } = require("msw");
const { setupServer } = require("msw/node");
const HTTPFetcher = require("#http_fetcher");

const TEST_URL = "http://test.example.com/data";
let server;
let fetcher;

beforeAll(() => {
	server = setupServer();
	server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
	server.close();
});

afterEach(() => {
	server.resetHandlers();
	if (fetcher) {
		fetcher.clearTimer();
		fetcher = null;
	}
});

describe("HTTPFetcher", () => {

	describe("Basic fetch operations", () => {
		it("should emit response event on successful fetch", async () => {
			const responseData = "test data";
			server.use(
				http.get(TEST_URL, () => {
					return HttpResponse.text(responseData);
				})
			);

			fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

			const responsePromise = new Promise((resolve) => {
				fetcher.on("response", (response) => {
					resolve(response);
				});
			});

			fetcher.startPeriodicFetch();
			const response = await responsePromise;

			expect(response.ok).toBe(true);
			expect(response.status).toBe(200);
			const text = await response.text();
			expect(text).toBe(responseData);
		});

		it("should emit error event on network failure", async () => {
			server.use(
				http.get(TEST_URL, () => {
					return HttpResponse.error();
				})
			);

			fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

			const errorPromise = new Promise((resolve) => {
				fetcher.on("error", (errorInfo) => {
					resolve(errorInfo);
				});
			});

			fetcher.startPeriodicFetch();
			const errorInfo = await errorPromise;

			expect(errorInfo).toHaveProperty("errorType", "NETWORK_ERROR");
			expect(errorInfo).toHaveProperty("translationKey", "MODULE_ERROR_NO_CONNECTION");
			expect(errorInfo).toHaveProperty("url", TEST_URL);
		});

		it("should emit error event on timeout", async () => {
			server.use(
				http.get(TEST_URL, async () => {
					// Simulate a slow server that never responds
					await new Promise((resolve) => setTimeout(resolve, 60000));
					return HttpResponse.text("too late");
				})
			);

			fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000, timeout: 100 });

			const errorPromise = new Promise((resolve) => {
				fetcher.on("error", (errorInfo) => {
					resolve(errorInfo);
				});
			});

			fetcher.startPeriodicFetch();
			const errorInfo = await errorPromise;

			expect(errorInfo.errorType).toBe("NETWORK_ERROR");
			expect(errorInfo.message).toContain("timeout");
			expect(errorInfo.message).toContain("100ms");
		});
	});

	describe("HTTPFetcher - HTTP status code handling", () => {
		describe("304 Not Modified", () => {
			it("should emit response event for 304 and not emit error", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, { status: 304 });
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });
				fetcher.serverErrorCount = 2;
				fetcher.networkErrorCount = 3;

				const responsePromise = new Promise((resolve) => {
					fetcher.on("response", resolve);
				});
				const errorSpy = vi.fn();
				fetcher.on("error", errorSpy);

				fetcher.startPeriodicFetch();
				const response = await responsePromise;

				expect(response.status).toBe(304);
				expect(errorSpy).not.toHaveBeenCalled();
				expect(fetcher.serverErrorCount).toBe(0);
				expect(fetcher.networkErrorCount).toBe(0);
			});
		});

		describe("401/403 errors (Auth failures)", () => {
			it("should emit error with AUTH_FAILURE for 401", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, { status: 401 });
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				expect(errorInfo.status).toBe(401);
				expect(errorInfo.errorType).toBe("AUTH_FAILURE");
				expect(errorInfo.translationKey).toBe("MODULE_ERROR_UNAUTHORIZED");
			});

			it("should emit error with AUTH_FAILURE for 403", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, { status: 403 });
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				expect(errorInfo.status).toBe(403);
				expect(errorInfo.errorType).toBe("AUTH_FAILURE");
			});
		});

		describe("429 errors (Rate limiting)", () => {
			it("should emit error with RATE_LIMITED for 429", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, {
							status: 429,
							headers: { "Retry-After": "120" }
						});
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				expect(errorInfo.status).toBe(429);
				expect(errorInfo.errorType).toBe("RATE_LIMITED");
				expect(errorInfo.retryAfter).toBeGreaterThan(0);
			});

			it("should parse Retry-After header in seconds", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, {
							status: 429,
							headers: { "Retry-After": "300" }
						});
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				// 300 seconds = 300000 ms
				expect(errorInfo.retryAfter).toBe(300000);
			});
		});

		describe("5xx errors (Server errors)", () => {
			it("should emit error with SERVER_ERROR for 500", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, { status: 500 });
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				expect(errorInfo.status).toBe(500);
				expect(errorInfo.errorType).toBe("SERVER_ERROR");
			});

			it("should emit error with SERVER_ERROR for 503", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, { status: 503 });
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				expect(errorInfo.status).toBe(503);
				expect(errorInfo.errorType).toBe("SERVER_ERROR");
			});
		});

		describe("4xx errors (Client errors)", () => {
			it("should emit error with CLIENT_ERROR for 404", async () => {
				server.use(
					http.get(TEST_URL, () => {
						return new HttpResponse(null, { status: 404 });
					})
				);

				fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

				const errorPromise = new Promise((resolve) => {
					fetcher.on("error", (errorInfo) => {
						resolve(errorInfo);
					});
				});

				fetcher.startPeriodicFetch();
				const errorInfo = await errorPromise;

				expect(errorInfo.status).toBe(404);
				expect(errorInfo.errorType).toBe("CLIENT_ERROR");
			});
		});
	});
});

describe("HTTPFetcher - Authentication", () => {
	it("should include Basic auth header when configured", async () => {
		let receivedHeaders = null;

		server.use(
			http.get(TEST_URL, ({ request }) => {
				receivedHeaders = Object.fromEntries(request.headers);
				return HttpResponse.text("ok");
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, {
			reloadInterval: 60000,
			auth: {
				method: "basic",
				user: "testuser",
				pass: "testpass"
			}
		});

		const responsePromise = new Promise((resolve) => {
			fetcher.on("response", resolve);
		});

		fetcher.startPeriodicFetch();
		await responsePromise;

		const expectedAuth = `Basic ${Buffer.from("testuser:testpass").toString("base64")}`;
		expect(receivedHeaders.authorization).toBe(expectedAuth);
	});

	it("should include Bearer auth header when configured", async () => {
		let receivedHeaders = null;

		server.use(
			http.get(TEST_URL, ({ request }) => {
				receivedHeaders = Object.fromEntries(request.headers);
				return HttpResponse.text("ok");
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, {
			reloadInterval: 60000,
			auth: {
				method: "bearer",
				pass: "my-token-123"
			}
		});

		const responsePromise = new Promise((resolve) => {
			fetcher.on("response", resolve);
		});

		fetcher.startPeriodicFetch();
		await responsePromise;

		expect(receivedHeaders.authorization).toBe("Bearer my-token-123");
	});
});

describe("Custom headers", () => {
	it("should include custom headers in request", async () => {
		let receivedHeaders = null;

		server.use(
			http.get(TEST_URL, ({ request }) => {
				receivedHeaders = Object.fromEntries(request.headers);
				return HttpResponse.text("ok");
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, {
			reloadInterval: 60000,
			headers: {
				"X-Custom-Header": "custom-value",
				Accept: "application/json"
			}
		});

		const responsePromise = new Promise((resolve) => {
			fetcher.on("response", resolve);
		});

		fetcher.startPeriodicFetch();
		await responsePromise;

		expect(receivedHeaders["x-custom-header"]).toBe("custom-value");
		expect(receivedHeaders.accept).toBe("application/json");
	});
});

describe("Timer management", () => {
	it("should not set timer in test mode", async () => {
		server.use(
			http.get(TEST_URL, () => {
				return HttpResponse.text("ok");
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 100 });

		const responsePromise = new Promise((resolve) => {
			fetcher.on("response", resolve);
		});

		fetcher.startPeriodicFetch();
		await responsePromise;

		// Timer should NOT be set in test mode (mmTestMode=true)
		expect(fetcher.reloadTimer).toBeNull();
	});

	it("should clear timer when clearTimer is called", () => {
		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 100 });

		// Manually set a timer to test clearing
		fetcher.reloadTimer = setTimeout(() => {}, 10000);
		expect(fetcher.reloadTimer).not.toBeNull();

		fetcher.clearTimer();

		expect(fetcher.reloadTimer).toBeNull();
	});
});

describe("fetch() method", () => {
	it("should emit response event when called", async () => {
		const responseData = "direct fetch data";
		server.use(
			http.get(TEST_URL, () => {
				return HttpResponse.text(responseData);
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

		const responsePromise = new Promise((resolve) => {
			fetcher.on("response", resolve);
		});

		await fetcher.fetch();
		const response = await responsePromise;

		expect(response.ok).toBe(true);
		const text = await response.text();
		expect(text).toBe(responseData);
	});

	it("should emit error event on network error", async () => {
		server.use(
			http.get(TEST_URL, () => {
				return HttpResponse.error();
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 60000 });

		const errorPromise = new Promise((resolve) => {
			fetcher.on("error", resolve);
		});

		await fetcher.fetch();
		const errorInfo = await errorPromise;

		expect(errorInfo.errorType).toBe("NETWORK_ERROR");
	});
});

describe("selfSignedCert dispatcher", () => {
	const { Agent } = require("undici");

	it("should set rejectUnauthorized=false when selfSignedCert is true", () => {
		fetcher = new HTTPFetcher(TEST_URL, {
			reloadInterval: 60000,
			selfSignedCert: true
		});

		const options = fetcher.getRequestOptions();

		expect(options.dispatcher).toBeInstanceOf(Agent);
		const agentOptionsSymbol = Object.getOwnPropertySymbols(options.dispatcher).find((s) => s.description === "options");
		const dispatcherOptions = options.dispatcher[agentOptionsSymbol];
		expect(dispatcherOptions.connect.rejectUnauthorized).toBe(false);
	});

	it("should not set a dispatcher when selfSignedCert is false", () => {
		fetcher = new HTTPFetcher(TEST_URL, {
			reloadInterval: 60000,
			selfSignedCert: false
		});

		const options = fetcher.getRequestOptions();

		expect(options.dispatcher).toBeUndefined();
	});
});

describe("Retry exhaustion fallback", () => {
	it("should fall back to reloadInterval after network retries exhausted", async () => {
		server.use(
			http.get(TEST_URL, () => {
				return HttpResponse.error();
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 300000, maxRetries: 3 });

		const errors = [];
		fetcher.on("error", (errorInfo) => errors.push(errorInfo));

		// Trigger maxRetries + 1 fetches to reach exhaustion
		for (let i = 0; i < 4; i++) {
			await fetcher.fetch();
		}

		// First retries should use backoff (< reloadInterval)
		expect(errors[0].retryAfter).toBe(15000);
		expect(errors[1].retryAfter).toBe(30000);
		// Third retry hits maxRetries, should fall back to reloadInterval
		expect(errors[2].retryAfter).toBe(300000);
		// Subsequent errors stay at reloadInterval
		expect(errors[3].retryAfter).toBe(300000);
	});

	it("should fall back to reloadInterval after server error retries exhausted", async () => {
		server.use(
			http.get(TEST_URL, () => {
				return new HttpResponse(null, { status: 503 });
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 300000, maxRetries: 3 });

		const errors = [];
		fetcher.on("error", (errorInfo) => errors.push(errorInfo));

		for (let i = 0; i < 4; i++) {
			await fetcher.fetch();
		}

		// First retries should use backoff (< reloadInterval)
		expect(errors[0].retryAfter).toBe(15000);
		expect(errors[1].retryAfter).toBe(30000);
		// Third retry hits maxRetries, should fall back to reloadInterval
		expect(errors[2].retryAfter).toBe(300000);
		// Subsequent errors stay at reloadInterval
		expect(errors[3].retryAfter).toBe(300000);
	});

	it("should reset network error count on success", async () => {
		let requestCount = 0;
		server.use(
			http.get(TEST_URL, () => {
				requestCount++;
				if (requestCount <= 2) return HttpResponse.error();
				return HttpResponse.text("ok");
			})
		);

		fetcher = new HTTPFetcher(TEST_URL, { reloadInterval: 300000, maxRetries: 3 });

		const errors = [];
		fetcher.on("error", (errorInfo) => errors.push(errorInfo));

		// Two failures with backoff
		await fetcher.fetch();
		await fetcher.fetch();
		expect(errors).toHaveLength(2);
		expect(errors[0].retryAfter).toBe(15000);
		expect(errors[1].retryAfter).toBe(30000);

		// Success resets counter
		await fetcher.fetch();
		expect(fetcher.networkErrorCount).toBe(0);
	});
});
