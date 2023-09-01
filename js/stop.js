/** Stop MagicMirror from MagicMirror.pid file */

const readFile = require("fs").readFile;

let pid;
readFile("MagicMirror.pid", "utf8", (err, data) => {
	if (err) {
		console.error("Error reading MagicMirror.pid file");
		console.error(err.message);
	} else {
		pid = data;
		try {
			process.kill(pid, "SIGINT");
			console.log(`MagicMirror² killed from process ${pid}`);
		} catch (e) {
			console.error(`MagicMirror² not found on process ${pid}`);
		}
	}
});
