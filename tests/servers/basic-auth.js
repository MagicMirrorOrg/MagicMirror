var http = require("http");
var path = require("path");
var auth = require("http-auth");
var express = require("express")

var basic = auth.basic({
	realm: "MagicMirror Area restricted."
}, (username, password, callback) => {
	callback(username === "MagicMirror" && password === "CallMeADog");
});

this.server = express();
this.server.use(auth.connect(basic));

// Set directories availables
var directories = ["/tests/configs"];
var directory;
rootPath = path.resolve(__dirname + "/../../");
for (i in directories) {
	directory = directories[i];
	this.server.use(directory, express.static(path.resolve(rootPath + directory)));
}

exports.listen = function () {
	this.server.listen.apply(this.server, arguments);
};

exports.close = function (callback) {
	this.server.close(callback);
};
