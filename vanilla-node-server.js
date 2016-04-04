var http = require('http');
var debug = require('debug');
var logInfo = debug('vanilla-node-server');
var logReq = debug('request');
var lib = require('./lib/');

var PORT = parseInt(process.env.PORT, 10) || 8080;

var server = http.createServer(function handleRequest(req, res) {
	var start = new Date().getTime();
	logReq('START');
	lib.fetchFromDatastore(function (err) {
		// Catch and report errors, but always pass through to the response.
		if (err) {
			logReq('error: %s', err.code);
		}

		res.on('finish', function () {
			logReq('END %d ms', new Date().getTime() - start);
		});

		lib.openFileStream(lib.respond(req, res));
	});
});

server.listen(PORT, function () {
	var addr = server.address();
	logInfo('server running on %s:%d', addr.address, addr.port);
});
