/* Magic Mirror
 * Server
 *
 * By Michael Teeuw https://michaelteeuw.nl
 * MIT Licensed.
 */
var express = require("express");
var app = require("express")();
var path = require("path");
var ipfilter = require("express-ipfilter").IpFilter;
var fs = require("fs");
var helmet = require("helmet");

var Log = require("./logger.js");
var Utils = require("./utils.js");

var Server = function (config, callback) {
	var port = config.port;
	if (process.env.MM_PORT) {
		port = process.env.MM_PORT;
	}

	var server = null;
	if (config.useHttps) {
		var options = {
			key: fs.readFileSync(config.httpsPrivateKey),
			cert: fs.readFileSync(config.httpsCertificate)
		};
		server = require("https").Server(options, app);
	} else {
		server = require("http").Server(app);
	}
	var io = require("socket.io")(server);

	Log.log("Starting server on port " + port + " ... ");

	server.listen(port, config.address ? config.address : "localhost");

	if (config.ipWhitelist instanceof Array && config.ipWhitelist.length === 0) {
		Log.warn(Utils.colors.warn("You're using a full whitelist configuration to allow for all IPs"));
	}

	app.use(function (req, res, next) {
		var result = ipfilter(config.ipWhitelist, { mode: config.ipWhitelist.length === 0 ? "deny" : "allow", log: false })(req, res, function (err) {
			if (err === undefined) {
				return next();
			}
			Log.log(err.message);
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		});
	});
	app.use(helmet({ contentSecurityPolicy: false }));

	app.use("/js", express.static(__dirname));
	var directories = ["/config", "/css", "/fonts", "/modules", "/vendor", "/translations", "/tests/configs"];
	var directory;
	for (var i in directories) {
		directory = directories[i];
		app.use(directory, express.static(path.resolve(global.root_path + directory)));
	}

	app.get("/version", function (req, res) {
		res.send(global.version);
	});

	app.get("/config", function (req, res) {
		res.send(config);
	});

	app.get("/", function (req, res) {
		var html = fs.readFileSync(path.resolve(global.root_path + "/index.html"), { encoding: "utf8" });
		html = html.replace("#VERSION#", global.version);

		var configFile = "config/config.js";
		if (typeof global.configuration_file !== "undefined") {
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
