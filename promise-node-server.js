var http = require('http');
var debug = require('debug');
var logInfo = debug('vanilla-node-server');
var logReq = debug('request');
var lib = require('./lib/');

var PORT = parseInt(process.env.PORT, 10) || 8080;

function fetchFromDatastore(args) {
	return new Promise(function (resolve, reject) {
		lib.fetchFromDatastore(function (err) {
			if (err) {
				return reject(err);
			}
			resolve(args);
		});
	});
}

function respond(args) {
	return new Promise(function (resolve) {
		args.res.on('finish', function () {
			resolve(args);
		});

		lib.openFileStream(lib.respond(args.req, args.res));
	});
}

var server = http.createServer(function handleRequest(req, res) {
	var start = new Date().getTime();
	logReq('START');

	var args = {req: req, res: res};
	Promise.resolve(args)
		.then(fetchFromDatastore)
		.catch(function onRandomError(err) {
			// Catch and report errors, but always pass through to the response.
			logReq('error: %s', err.code);
			return args;
		})
		.then(respond)
		.then(function () {
			logReq('END %d ms', new Date().getTime() - start);
		});
});

server.listen(PORT, function () {
	var addr = server.address();
	logInfo('server running on %s:%d', addr.address, addr.port);
});
