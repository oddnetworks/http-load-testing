var http = require('http');
var debug = require('debug')('vanilla-node-server');
var lib = require('./lib/');

var PORT = parseInt(process.env.PORT, 10) || 8080;

var server = http.createServer(function handleRequest(req, res) {
	debug('request START');

	lib.fetchFromDatastore(function (err) {
		lib.maybePrintError(err);

		lib.expensiveComputation(function (err) {
			lib.maybePrintError(err);

			lib.cheapComputation(function (err) {
				lib.maybePrintError(err);

				debug('request END');
				lib.openFileStream(lib.respond(req, res));
			});
		});
	});
});

server.listen(PORT, function () {
	var addr = server.address();
	debug('server running on %s:%d', addr.address, addr.port);
});
