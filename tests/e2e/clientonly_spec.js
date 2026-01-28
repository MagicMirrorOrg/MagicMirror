const { spawnSync, spawn } = require("node:child_process");

const delay = (time) => {
	return new Promise((resolve) => setTimeout(resolve, time));
};

/**
 * Run clientonly with given arguments and return result
 * @param {string[]} args command line arguments
 * @param {object} env environment variables to merge (replaces process.env)
 * @returns {object} result with status and stderr
 */
const runClientOnly = (args = [], env = {}) => {
	// Start with minimal env and merge provided env
	const testEnv = {
		PATH: process.env.PATH,
		NODE_PATH: process.env.NODE_PATH,
		...env
	};
	const result = spawnSync("node", ["clientonly/index.js", ...args], {
		env: testEnv,
		encoding: "utf-8",
		timeout: 5000
	});
	return result;
};

describe("Clientonly parameter handling", () => {

	describe("Missing parameters", () => {
		it("should fail without any parameters", () => {
			const result = runClientOnly();
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});

		it("should fail with only address parameter", () => {
			const result = runClientOnly(["--address", "192.168.1.10"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});

		it("should fail with only port parameter", () => {
			const result = runClientOnly(["--port", "8080"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});
	});

	describe("Local address rejection", () => {
		it("should fail with localhost address", () => {
			const result = runClientOnly(["--address", "localhost", "--port", "8080"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});

		it("should fail with 127.0.0.1 address", () => {
			const result = runClientOnly(["--address", "127.0.0.1", "--port", "8080"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});

		it("should fail with ::1 address", () => {
			const result = runClientOnly(["--address", "::1", "--port", "8080"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});

		it("should fail with ::ffff:127.0.0.1 address", () => {
			const result = runClientOnly(["--address", "::ffff:127.0.0.1", "--port", "8080"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Usage:");
		});
	});

	describe("Port validation", () => {
		it("should fail with port 0", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "0"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Invalid port number");
		});

		it("should fail with negative port", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "-1"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Invalid port number");
		});

		it("should fail with port above 65535", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "65536"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Invalid port number");
		});

		it("should fail with non-numeric port", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "abc"]);
			expect(result.status).toBe(1);
			expect(result.stderr).toContain("Invalid port number");
		});

		it("should accept valid port 8080", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "8080"]);
			// Should not fail on port validation (will fail on connection or display)
			expect(result.stderr).not.toContain("Invalid port number");
		});

		it("should accept valid port 1", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "1"]);
			expect(result.stderr).not.toContain("Invalid port number");
		});

		it("should accept valid port 65535", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "65535"]);
			expect(result.stderr).not.toContain("Invalid port number");
		});
	});

	describe("TLS flag parsing", () => {
		// Note: These tests verify the flag is parsed, not the actual connection behavior
		// Connection tests would timeout as they try to reach unreachable addresses

		it("should not fail on port validation when using --use-tls", () => {
			// Verify --use-tls doesn't interfere with other parameter parsing
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "443", "--use-tls"]);
			expect(result.stderr).not.toContain("Invalid port number");
		});

		it("should accept --use-tls flag with valid parameters", () => {
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "443", "--use-tls"]);
			// Should not fail on parameter parsing (will fail on connection or display)
			expect(result.stderr).not.toContain("Usage:");
		});
	});

	describe("Display environment check", () => {
		it("should fail without DISPLAY or WAYLAND_DISPLAY when connecting to valid server", async () => {
			// This test needs a running server to get past the connection phase
			// Without DISPLAY, it should fail with display error
			// For now, we just verify it fails (connection error comes first without server)
			const result = runClientOnly(["--address", "192.168.1.10", "--port", "1"]);
			// Either exits with code 1 or times out (null status means killed/timeout)
			expect(result.status === 1 || result.status === null).toBe(true);
		});
	});
});

describe("Clientonly with running server", () => {
	let serverProcess;
	const testPort = 8081;

	beforeAll(async () => {
		process.env.MM_CONFIG_FILE = "tests/configs/default.js";
		process.env.MM_PORT = testPort.toString();
		serverProcess = spawn("node", ["--run", "server"], {
			env: process.env,
			detached: true
		});
		// Wait for server to start
		await delay(2000);
	});

	afterAll(async () => {
		if (serverProcess && serverProcess.pid) {
			try {
				process.kill(-serverProcess.pid);
			} catch {
				// Process may already be dead
			}
		}
	});

	it("should be able to fetch config from server", async () => {
		const res = await fetch(`http://localhost:${testPort}/config/`);
		expect(res.status).toBe(200);
		const config = await res.json();
		expect(config).toBeDefined();
		expect(typeof config).toBe("object");
	});
});
