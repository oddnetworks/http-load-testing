var EventEmitter = require('events');

var yargs = require('yargs');
var request = require('request');

var options = yargs
	.usage('Usage: $0 --url <str> --timeout [number] --frequency <num> --length <num>')
	.option('url', {
		describe: 'The URL to test',
		alias: 'u',
		demand: true,
		type: 'string'
	})
	.option('timeout', {
		describe: 'Request timeout in seconds',
		alias: 't',
		type: 'number'
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
		return request(options, function onResponse(err, res) {
			var latency = new Date().getTime() - start;

			if (err) {
				switch (err.code) {
					// We know how to handle these two error types, and should treat
					// them as a failed response.
					case 'ECONNRESET':
					case 'ETIMEDOUT':
						agent.emit('response', Object.freeze({
							status: 0,
							latency: latency,
							error: Object.freeze({
								code: err.code,
								connect: Boolean(err.connect)
							})
						}));
						break;

					// We emit all other errors and don't treat them like a response.
					default:
						agent.emit('error', err);
				}
			} else {
				agent.emit('response', {
					status: res.statusCode,
					latency: latency,
					error: null
				});
			}
		});
	};

	return agent;
};

// options.url - The URL String to make requests to
// options.timeout - The request timeout limit in seconds
// options.frequency - Number of requests per minute
// options.length - Length of time to run in Number of seconds
exports.createRunner = function (options) {
	var url = options.url;
	var frequency = options.frequency;
	var length = options.length;
	var requestTimeout = (options.timeout || 20) * 1000;

	var agent = exports.createUserAgent({
		method: 'GET',
		url: url,
		headers: {
			'Accept': '*/*',
			'User-Agent': 'Roku/DVP-7.0 (047.00E09044A)'
		},
		timeout: requestTimeout
	});

	// Request frequency is given in requests per minute.
	var interval = Math.round(60000 / frequency);

	// length is given in seconds
	var endTime = new Date().getTime() + (length * 1000);

	function makeRequest() {
		if (new Date().getTime() < endTime) {
			agent.request();
			setTimeout(makeRequest, interval);
		}
	}

	return {
		agent: agent,

		run: function () {
			makeRequest();
			return this;
		}
	};
};

exports.main = function (args, done) {
	var data = [];
	var requestCount = 0;

	var runner = exports.createRunner({
		url: args.url,
		frequency: args.frequency,
		length: args.length
	});

	var agent = runner.agent;

	agent.on('error', function (err) {
		console.error('\nAgent Error: %s', err.code || err.message || err);
	});

	agent.on('request', function () {
		requestCount += 1;
	});

	agent.on('response', function (res) {
		var dataPoint = JSON.parse(JSON.stringify(res));
		dataPoint.pending = (requestCount - data.length) - 1;
		data.push(Object.freeze(dataPoint));
		process.stderr.write(dataPoint.pending + '.');
	});

	// Rather than keeping track of how many requests we've sent before closing
	// the script, we just listen to Node's "beforeExit" event.
	process.on('beforeExit', function () {
		process.stderr.write('\n');
		done(null, data);
	});

	process.stderr.write('\n');
	runner.run();
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

	// Print out CSV formated data
	console.log('');
	console.log('pending,original,status,sorted');
	sorted.forEach(function (itemB, i) {
		var itemA = original[i];
		var status = itemA.status === 200 ? 'success' : 'fail';
		console.log('%s,%s,%s,%s', itemA.pending, itemA.latency, status, itemB.latency);
	});

	// Test summary (printed to stderr to avoid polluting CSV data above)
	console.error('requests: ', original.length);
	console.error('min: ', sorted[0].latency);
	console.error('max: ', sorted[sorted.length - 1].latency);
	console.error('mean: ', Math.round(sum / original.length));
};

if (require.main === module) {
	var startTime = new Date().getTime();
	exports.main(options.argv, function (err, data) {
		console.error('Runtime: %d seconds', (new Date().getTime() - startTime) / 1000);
		if (err) {
			console.error('The user agent has suffered an error:');
			console.error(err.stack || err.message || err);
		} else {
			exports.printData(data);
		}
	});
}
