const path = require("path");
const auth = require("http-auth");
const express = require("express");
const app = express();

var server;

var basic = auth.basic(
	{
		realm: "MagicMirror Area restricted."
	},
	(username, password, callback) => {
		callback(username === "MagicMirror" && password === "CallMeADog");
	}
);

app.use(auth.connect(basic));

// Set available directories
var directories = ["/tests/configs"];
var directory;
var rootPath = path.resolve(__dirname + "/../../");

for (var i in directories) {
	directory = directories[i];
	app.use(directory, express.static(path.resolve(rootPath + directory)));
}

exports.listen = function () {
	server = app.listen.apply(app, arguments);
};

exports.close = function (callback) {
	server.close(callback);
};
