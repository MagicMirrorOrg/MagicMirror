const Application = require("spectron").Application;
const path = require('path');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Set config sample for use in test
process.env.MM_CONFIG_FILE = 'tests/confs/env.js';

var electronPath = path.join(__dirname, '../../', 'node_modules', '.bin', 'electron');

if (process.platform === 'win32') {
	electronPath += '.cmd';
}

var appPath = path.join(__dirname, '../../js/electron.js');

var app = new Application({
	path: electronPath,
	args: [appPath]
});

global.before(function () {
	chai.should();
	chai.use(chaiAsPromised);
});

describe('Test enviroment app electron', function () {
	this.timeout(10000);

	beforeEach(function (done) {
		app.start().then(function() { done(); } );
	});

	afterEach(function (done) {
		app.stop().then(function() { done(); });
	});


	it('open a window app and test if is open', function () {
		return app.client.waitUntilWindowLoaded()
			.getWindowCount().should.eventually.equal(1);
	});

	it('tests the title', function () {
		return app.client.waitUntilWindowLoaded()
			.getTitle().should.eventually.equal('Magic Mirror');
	});

});
