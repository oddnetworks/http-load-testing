var http = require('http');
var debug = require('debug');
var logInfo = debug('seneca-node-server');
var logReq = debug('request');
var seneca = require('seneca')();
var lib = require('./lib/');

var PORT = parseInt(process.env.PORT, 10) || 8080;

seneca.add({cmd: 'fetchFromDatastore'}, function (args, next) {
	lib.fetchFromDatastore(next);
});

seneca.add({cmd: 'respond'}, function (args, next) {
	args.res.on('finish', function () {
		next();
	});

	lib.openFileStream(lib.respond(args.req, args.res));
});

var server = http.createServer(function handleRequest(req, res) {
	var start = new Date().getTime();
	logReq('START');

	seneca.act({cmd: 'fetchFromDatastore'}, function (err) {
		lib.maybePrintError(err);
		seneca.act({cmd: 'respond', req: res, res: res}, function (err) {
			lib.maybePrintError(err);
			logReq('END %d ms', new Date().getTime() - start);
		});
	});
});

server.listen(PORT, function () {
	var addr = server.address();
	logInfo('server running on %s:%d', addr.address, addr.port);
});
