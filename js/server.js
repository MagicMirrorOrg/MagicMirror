/* Magic Mirror
 * Server
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var express = require("express");
var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var path = require("path");

var Server = function(config, callback) {
	console.log("Starting server op port " + config.port + " ... ");

	server.listen(config.port);
	app.use("/js", express.static(__dirname));
	app.use("/config", express.static(path.resolve(__dirname + "/../config")));
	app.use("/css", express.static(path.resolve(__dirname + "/../css")));
	app.use("/fonts", express.static(path.resolve(__dirname + "/../fonts")));
	app.use("/modules", express.static(path.resolve(__dirname + "/../modules")));
	app.use("/vendor", express.static(path.resolve(__dirname + "/../vendor")));

	app.get("/", function(req, res) {
		res.sendFile(path.resolve(__dirname + "/../index.html"));
	});

	if (typeof callback === "function") {
		callback(app, io);
	}
};

module.exports = Server;
