const NodeHelper = require("../../js/node_helper");
const helpers = require("./helpers/global-setup");

describe("App restart lifecycle", () => {
	afterEach(async () => {
		await helpers.stopApplication(0);
	});

	it("reloads configuration without retaining stopped helpers or adding signal handlers", async () => {
		const startHelper = vi.spyOn(NodeHelper.prototype, "start");
		const stopHelper = vi.spyOn(NodeHelper.prototype, "stop");
		await helpers.startApplication("tests/configs/esm_helper.js");
		const app = global.app;
		const sigintListeners = process.listenerCount("SIGINT");
		const sigtermListeners = process.listenerCount("SIGTERM");
		expect(startHelper).toHaveBeenCalledTimes(1);
		expect(global.config.modules[0].module).toBe("esmHelper");

		await helpers.startApplication("tests/configs/modules/clock/clock_24hr.js");
		expect(global.app).toBe(app);
		expect(global.configuration_file).toBe("tests/configs/modules/clock/clock_24hr.js");
		expect(global.config.modules[0].module).toBe("clock");
		expect(startHelper).toHaveBeenCalledTimes(1);
		expect(stopHelper).toHaveBeenCalledTimes(1);
		expect(process.listenerCount("SIGINT")).toBe(sigintListeners);
		expect(process.listenerCount("SIGTERM")).toBe(sigtermListeners);

		await app.stop();
		await app.stop();
		expect(stopHelper).toHaveBeenCalledTimes(1);
	});
});
