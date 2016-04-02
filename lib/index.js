var fs = require('fs');
var debug = require('debug')('node-plugin');
var request = require('request');
var filepath = require('filepath');

var DB_CONNECTION = {
	method: 'GET',
	url: process.env.DATABASE_URL,
	headers: {
		accept: '*/*'
	}
};

var DATA_FILEPATH = filepath.create().append(process.env.DATA_FILEPATH);

debug('connecting to database at %s', DB_CONNECTION.url);

exports.fetchFromDatastore = function (done) {
	debug('fetchFromDatastore START');

	request(DB_CONNECTION, function onResponse(err) {
		if (err) {
			debug('fetchFromDatastore ERROR');
			done(err);
		} else {
			debug('fetchFromDatastore SUCCESS');
			done();
		}
	});
};

exports.cheapComputation = function (done) {
	debug('cheapComputation START');
	setTimeout(function () {
		// 1 in 10 chance of returning an error
		if (Math.floor(Math.random() * 10) === 1) {
			debug('cheapComputation ERROR');
			done(new Error('Random Error'));
		} else {
			debug('cheapComputation SUCCESS');
			done();
		}
	}, 10);
};

exports.expensiveComputation = function (done) {
	debug('expensiveComputation START');
	var count = 0;
	while (count < 100000000) {
		count += 1;
	}
	debug('expensiveComputation SUCCESS');
	done();
};

exports.maybePrintError = function (err) {
	if (err) {
		console.error(err.stack || err.message || err);
	}
};

exports.openFileStream = function (next) {
	return next(null, DATA_FILEPATH.newReadStream());
};

exports.respond = function (req, res) {
	return function (err, stream) {
		var stats = fs.statSync(DATA_FILEPATH.toString());
		res.writeHead(200, {
			'Content-Type': 'text/plain',
			'Content-Length': stats.size
		});
		stream.pipe(res);
	};
};
