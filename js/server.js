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
var ipfilter = require("express-ipfilter").IpFilter;
var fs = require("fs");
var helmet = require("helmet");

var Server = function(config, callback) {
	console.log("Starting server op port " + config.port + " ... ");

	server.listen(config.port, config.address ? config.address : null);

	app.use(function(req, res, next) {
		var result = ipfilter(config.ipWhitelist, {mode: "allow", log: false})(req, res, function(err) {
			if (err === undefined) {
				return next();
			}
			console.log(err.message);
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		});
	});
	app.use(helmet());

	app.use("/js", express.static(__dirname));
	app.use("/config", express.static(path.resolve(global.root_path + "/config")));
	app.use("/css", express.static(path.resolve(global.root_path + "/css")));
	app.use("/fonts", express.static(path.resolve(global.root_path + "/fonts")));
	app.use("/modules", express.static(path.resolve(global.root_path + "/modules")));
	app.use("/vendor", express.static(path.resolve(global.root_path + "/vendor")));
	app.use("/translations", express.static(path.resolve(global.root_path + "/translations")));
	app.use("/tests/configs", express.static(path.resolve(global.root_path + "/tests/configs")));

	app.get("/version", function(req,res) {
		res.send(global.version);
	});

	app.get("/", function(req, res) {
		var html = fs.readFileSync(path.resolve(global.root_path + "/index.html"), {encoding: "utf8"});
		html = html.replace("#VERSION#", global.version);

		configFile = "config/config.js";
		if (typeof(global.configuration_file) !== "undefined") {
		    configFile = global.configuration_file;
		}
		html = html.replace("#CONFIG_FILE#", configFile);

		res.send(html);
	});

	if (typeof callback === "function") {
		callback(app, io);
	}
};

module.exports = Server;
