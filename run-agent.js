var EventEmitter = require('events');

var yargs = require('yargs');
var request = require('request');

var options = yargs
	.usage('Usage: $0 --url <str> --frequency <num> --length <num>')
	.option('url', {
		describe: 'The URL to test',
		alias: 'u',
		demand: true,
		type: 'string'
	})
	.option('frequency', {
		describe: 'Request frequency in requests p/minute',
		alias: 'f',
		demand: true,
		type: 'number'
	})
	.option('length', {
		describe: 'Duration of testing in seconds',
		alias: 'l',
		demand: true,
		type: 'number'
	});

exports.createUserAgent = function (options) {
	var agent = new EventEmitter();

	agent.request = function agentMakeRequest() {
		agent.emit('request');

		var start = new Date().getTime();
		request(options, function onResponse(err, res) {
			if (err) {
				agent.emit('error', err);
			} else {
				agent.emit('response', {
					status: res.statusCode,
					latency: new Date().getTime() - start
				});
			}
		});
	};

	return agent;
};

exports.throttle = function (options, done) {
	var agent = options.agent;

	// Request frequency is given in requests per minute.
	var interval = Math.round(60000 / options.frequency);

	// length is given in seconds
	var endTime = new Date().getTime() + (options.length * 1000);

	function makeRequest() {
		var now = new Date().getTime();
		if (now >= endTime) {
			return done();
		}
		agent.request();
		setTimeout(makeRequest, interval);
	}

	return makeRequest;
};

exports.run = function (options) {
	var url = options.url;
	var frequency = options.frequency;
	var length = options.length;

	return new Promise(function (resolve, reject) {
		var data = [];
		var numRequests = 0;
		var allRequestsSent = false;

		var agent = exports.createUserAgent({
			method: 'GET',
			url: url,
			headers: {
				'Accept': '*/*',
				'User-Agent': 'Roku/DVP-7.0 (047.00E09044A)'
			}
		});

		agent.on('error', reject);

		agent.on('request', function () {
			numRequests += 1;
		});

		agent.on('response', function (res) {
			res.pending = (numRequests - data.length) - 1;
			data.push(res);
			process.stderr.write('.');
			done();
		});

		process.stderr.write('\n');
		var throttle = exports.throttle({
			agent: agent,
			frequency: frequency,
			length: length
		}, function () {
			allRequestsSent = true;
			done();
		});

		function done() {
			if (allRequestsSent && numRequests === data.length) {
				process.stderr.write('\n');
				resolve(data);
			}
		}

		throttle();
	});
};

exports.main = function (args) {
	return exports.run({
		url: args.url,
		frequency: args.frequency,
		length: args.length
	});
};

exports.printData = function (results) {
	var original = results.slice();
	var sorted = results.sort(function (a, b) {
		if (a.latency === b.latency) {
			return 0;
		}
		return a.latency > b.latency ? 1 : -1;
	});

	var sum = original.reduce(function (sum, res) {
		return sum + res.latency;
	}, 0);

	var errors = original.filter(function (res) {
		return res.status < 200 || res.status > 299;
	});

	console.log('original,sorted');
	sorted.forEach(function (item, i) {
		console.log('%s,%s,%s', original[i].latency, item.latency, item.pending);
	});

	console.error('errors: ', errors.map(function (res) {
		return res.status;
	}));
	console.error('requests: ', original.length);
	console.error('min: ', sorted[0].latency);
	console.error('max: ', sorted[sorted.length - 1].latency);
	console.error('mean: ', Math.round(sum / original.length));
};

if (require.main === module) {
	exports.main(options.argv)
		.then(exports.printData)
		.catch(function (err) {
			console.error('The user agent has suffered an error:');
			console.error(err.stack || err.message || err);
			process.exit(1);
		});
}
