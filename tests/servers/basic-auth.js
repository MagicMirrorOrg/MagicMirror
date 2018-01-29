var http = require("http");
var path = require("path");
var auth = require("http-auth");
var express = require("express");
var app = express();

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

// Set directories availables
var directories = ["/tests/configs"];
var directory;
rootPath = path.resolve(__dirname + "/../../");
for (i in directories) {
	directory = directories[i];
	app.use(directory, express.static(path.resolve(rootPath + directory)));
}

exports.listen = function() {
	server = app.listen.apply(app, arguments);
};

exports.close = function(callback) {
	server.close(callback);
};
