/**
 * Suppresses errors concerning web server already shut down.
 *
 * @param {string} err The error message.
 */
function myError(err) {
	if (err.includes("ECONNREFUSED") || err.includes("ECONNRESET") || err.includes("socket hang up")) {
		jest.fn();
	} else {
		console.dir(err);
	}
}

global.console = {
	log: jest.fn(),
	dir: console.dir,
	error: myError,
	warn: console.warn,
	info: jest.fn(),
	debug: console.debug
};
