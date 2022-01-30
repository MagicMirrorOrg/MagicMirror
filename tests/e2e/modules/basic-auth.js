const path = require("path");
const auth = require("express-basic-auth");
const express = require("express");
const app = express();

const basicAuth = auth({
	realm: "MagicMirror² Area restricted.",
	users: { MagicMirror: "CallMeADog" }
});

app.use(basicAuth);

// Set available directories
const directories = ["/tests/configs"];
const rootPath = path.resolve(__dirname + "/../../../");

for (let directory of directories) {
	app.use(directory, express.static(path.resolve(rootPath + directory)));
}

let server;

exports.listen = function () {
	server = app.listen.apply(app, arguments);
};

exports.close = function (callback) {
	server.close(callback);
};
