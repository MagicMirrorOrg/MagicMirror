const delay = (time) => {
	return new Promise((resolve) => setTimeout(resolve, time));
};

const runConfigCheck = async () => {
	const serverProcess = await require("node:child_process").spawnSync("node", ["--run", "config:check"], { env: process.env });
	expect(serverProcess.stderr.toString()).toBe("");
	return await serverProcess.status;
};

describe("App environment", () => {
	let serverProcess;
	beforeAll(async () => {
		process.env.MM_CONFIG_FILE = "tests/configs/default.js";
		serverProcess = await require("node:child_process").spawn("node", ["--run", "server"], { env: process.env, detached: true });
		// we have to wait until the server is started
		await delay(2000);
	});
	afterAll(async () => {
		await process.kill(-serverProcess.pid);
	});

	it("get request from http://localhost:8080 should return 200", async () => {
		const res = await fetch("http://localhost:8080");
		expect(res.status).toBe(200);
	});

	it("get request from http://localhost:8080/nothing should return 404", async () => {
		const res = await fetch("http://localhost:8080/nothing");
		expect(res.status).toBe(404);
	});
});

describe("Check config", () => {
	it("config check should return without errors", async () => {
		process.env.MM_CONFIG_FILE = "tests/configs/default.js";
		await expect(runConfigCheck()).resolves.toBe(0);
	});

	it("config check should fail with non existent config file", async () => {
		process.env.MM_CONFIG_FILE = "tests/configs/not_exists.js";
		await expect(runConfigCheck()).resolves.toBe(1);
	});
});
