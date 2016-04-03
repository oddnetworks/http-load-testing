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
		return request(options, function onResponse(err, res) {
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

// options.url - The URL String to make requests to
// options.frequency - Number of requests per minute
// options.length - Length of time to run in Number of seconds
exports.createRunner = function (options) {
	var url = options.url;
	var frequency = options.frequency;
	var length = options.length;

	var agent = exports.createUserAgent({
		method: 'GET',
		url: url,
		headers: {
			'Accept': '*/*',
			'User-Agent': 'Roku/DVP-7.0 (047.00E09044A)'
		}
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
		process.stderr.write('\n');
		console.error('Agent Error: %s', err.message || err);
	});

	agent.on('request', function () {
		requestCount += 1;
	});

	agent.on('response', function (res) {
		res.pending = (requestCount - data.length) - 1;
		data.push(Object.freeze(res));
		process.stderr.write(res.pending + '.');
	});

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

	console.log('');
	console.log('pending,original,sorted');
	sorted.forEach(function (item, i) {
		console.log('%s,%s,%s', item.pending, original[i].latency, item.latency);
	});

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
