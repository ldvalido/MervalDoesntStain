var Q = require('q');
var linked = require('./linkedPayment.js');
var badlar = require('./badlarPayment.js');
var dollar = require('./dollarPayment.js');
var fixFee = require('./fixFeePayment.js');
function calculatePayment(returnValue, title,year,month, amount) {
 	var q = Q.defer();
 	var operations = {
 		2: linked,
 		4: fixFee,
 		5: badlar,
 		5: dollar
 	}
 	operations[title.BondType.Id].calculatePayment(returnValue, title,year,month, amount).then(returnValue => {
		q.resolve(returnValue);
	});
	return q.promise;
}

module.exports = {
	calculatePayment
}