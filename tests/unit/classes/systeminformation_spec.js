const SystemInformation = require("../../../js/systeminformation");

describe("SystemInformation", () => {
	it("should output system information", async () => {
		await expect(SystemInformation()).resolves.toContain("platform: linux");
	});
});
