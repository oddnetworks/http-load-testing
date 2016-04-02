var http = require('http');
var debug = require('debug')('vanilla-node-server');
var seneca = require('seneca')();
var lib = require('./lib/');

var PORT = parseInt(process.env.PORT, 10) || 8080;

seneca.add({cmd: 'fetchFromDatastore'}, function (args, next) {
	lib.fetchFromDatastore(next);
});

seneca.add({cmd: 'expensiveComputation'}, function (args, next) {
	lib.expensiveComputation(next);
});

seneca.add({cmd: 'cheapComputation'}, function (args, next) {
	lib.cheapComputation(next);
});

var server = http.createServer(function handleRequest(req, res) {
	debug('request START');

	seneca.act({cmd: 'fetchFromDatastore'}, function (err) {
		lib.maybePrintError(err);

		seneca.act({cmd: 'expensiveComputation'}, function (err) {
			lib.maybePrintError(err);

			seneca.act({cmd: 'cheapComputation'}, function (err) {
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
