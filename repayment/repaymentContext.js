var Q = require('q');
var finish = require('./finishRepayment.js');
var partial = require('./partialRepayment.js');

function calculateRepayment(returnValue, title,year,month, amount) {
 	var q = Q.defer();
 	var operations = {
 		1: partial,
 		2: finish
 	}
 	operations[title.PaymentPeriod.Id].calculateRepayment(returnValue,title,year,month,amount).then(returnValue => {
 		q.resolve(returnValue);
 	})
	return q.promise;
}

module.exports = {
	calculateRepayment
}