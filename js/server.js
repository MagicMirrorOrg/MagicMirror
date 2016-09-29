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
var ipfilter = require('express-ipfilter').IpFilter;

var Server = function(config, callback) {
	console.log("Starting server op port " + config.port + " ... ");

	server.listen(config.port);
	if (config.ipWhitelist === undefined) {
		config.ipWhitelist = ['127.0.0.1', '::ffff:127.0.0.1'];
		console.log("Warning: Missing value (ipWhitelist) from config.js, assuming default (localhost access only): " + config.ipWhitelist);
	}

	app.use(function(req, res, next) {
		var result = ipfilter(config.ipWhitelist, {mode: 'allow', log: false})(req, res, function(err) {
			if (err === undefined) {
				return next();
			}
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		});
	});

	app.use("/js", express.static(__dirname));
	app.use("/config", express.static(path.resolve(__dirname + "/../config")));
	app.use("/css", express.static(path.resolve(__dirname + "/../css")));
	app.use("/fonts", express.static(path.resolve(__dirname + "/../fonts")));
	app.use("/modules", express.static(path.resolve(__dirname + "/../modules")));
	app.use("/vendor", express.static(path.resolve(__dirname + "/../vendor")));
	app.use("/translations", express.static(path.resolve(__dirname + "/../translations")));

	app.get("/", function(req, res) {
		res.sendFile(path.resolve(__dirname + "/../index.html"));
	});

	if (typeof callback === "function") {
		callback(app, io);
	}
};

module.exports = Server;
