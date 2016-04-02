
module.exports = function senecaPlugin(app) {
	var seneca = require('seneca');

	seneca.add({role: 'db', cmd: 'fetchOne'}, function (msg, next) {
		app.store.fetch(function () {
			next(1);
		});
	});

	seneca.add({role: 'db', cmd: 'fetchTwo'}, function (msg, next) {
		var count = 0;
		while (count < 5000000000) {
			count += 1;
		}
		next(2);
	});

	seneca.add({role: 'db', cmd: 'fetchThree'}, function (msg, next) {
		next(3);
	});
};
