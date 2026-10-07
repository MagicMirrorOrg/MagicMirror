const { spawn } = require("node:child_process");

const port = 8080;

const waitForServer = async (url) => {
	for (let attempt = 0; attempt < 50; attempt++) {
		try {
			return await fetch(url);
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}
	throw new Error(`Server did not respond at ${url}`);
};

describe("ESM node helper", () => {
	let serverProcess;

	beforeAll(() => {
		serverProcess = spawn("node", ["--run", "server"], {
			env: { ...process.env, MM_CONFIG_FILE: "tests/configs/esm_helper.js", MM_PORT: String(port) },
			detached: true
		});
	});

	afterAll(() => {
		process.kill(-serverProcess.pid);
	});

	it("loads the helper and serves its public folder", async () => {
		const res = await waitForServer(`http://localhost:${port}/esmHelper/ping.txt`);

		expect(res.status).toBe(200);
		expect(await res.text()).toBe("pong\n");
	});
});
