var chai = require('chai');
var expect = chai.expect;
var classMM = require('../../js/class.js'); // require for load module.js
var moduleMM =  require('../../js/module.js')

describe('Test function cmpVersions in js/module.js', function() {

	it('Should be return -1 ', function() {
		expect(moduleMM._test.cmpVersions('2.1', '2.2')).to.equal(-1);
	});

	it('Should be return 0 ', function() {
		expect(moduleMM._test.cmpVersions('2.2', '2.2')).to.equal(0);
	});

	it('Should be return 1', function() {
		expect(moduleMM._test.cmpVersions('1.1', '1.0')).to.equal(1);
	});

});

