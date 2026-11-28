const { spawn, spawnSync } = require("node:child_process");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../../");

const waitForServer = async (port) => {
	for (let attempt = 0; attempt < 100; attempt++) {
		try {
			const response = await fetch(`http://localhost:${port}/startup`);
			if (response.ok) return;
		} catch {
			// Server is still starting.
		}
		await new Promise((resolve) => setTimeout(resolve, 200));
	}
	throw new Error(`MagicMirror did not start on port ${port}`);
};

const stopServer = (server) => {
	if (process.platform === "win32") {
		spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
	} else {
		process.kill(-server.pid, "SIGTERM");
	}
};

/**
 * Emulate the reverse proxy that basePath is meant for: it only forwards
 * requests below the configured prefix and strips that prefix before the
 * request reaches the MagicMirror server.
 * @param {import("playwright").BrowserContext} context browser context
 * @param {string} basePath configured base path
 * @param {number} port MagicMirror server port
 * @returns {Promise<void>} resolved once routing is installed
 */
const proxyBasePath = async (context, basePath, port) => {
	const origin = `http://localhost:${port}`;
	await context.route("**/*", (route) => {
		const url = new URL(route.request().url());
		if (url.origin !== origin || !url.pathname.startsWith(basePath)) {
			return route.abort();
		}
		url.pathname = url.pathname.slice(basePath.length - 1);
		return route.continue({ url: url.toString() });
	});
};

describe("Socket.IO client import with a configured basePath", () => {
	it.each([
		{ config: "tests/configs/base_path.js", basePath: "/dashboard/", port: 8137 },
		{ config: "tests/configs/without_modules.js", basePath: "/", port: 8138 }
	])("loads the client module from $basePath", async ({ config, basePath, port }) => {
		const server = spawn(process.execPath, ["--run", "server"], {
			cwd: root,
			detached: true,
			stdio: "ignore",
			env: { ...process.env, MM_CONFIG_FILE: config, MM_PORT: String(port), mmTestMode: "true" }
		});
		let browser;
		try {
			await waitForServer(port);
			browser = await chromium.launch({ headless: true });
			const context = await browser.newContext();
			await proxyBasePath(context, basePath, port);
			const page = await context.newPage();
			const requested = [];
			page.on("request", (request) => requested.push(request.url()));

			await page.goto(`http://localhost:${port}${basePath}`, { waitUntil: "domcontentloaded" });
			await page.waitForFunction(() => typeof globalThis.io === "function", null, { timeout: 15000 });

			expect(requested).toContain(`http://localhost:${port}${basePath}socket.io/socket.io.esm.min.js`);
		} finally {
			if (browser) await browser.close();
			stopServer(server);
		}
	});
});
