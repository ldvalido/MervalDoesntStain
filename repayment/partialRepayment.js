var Q = require('q');
var financeData = require('../financeData.js');

function calculateRepayment(returnValue, title,year,month, amount) {
 	var q = Q.defer();
 	financeData.getRate(month,year).then(dolarRate => {
	  	returnValue.repayment = (title.AmortizationAmount * amount * parseFloat(dolarRate.value) / 100);
	  	q.resolve(returnValue);
	});
 	return q.promise;
}

module.exports = {
	calculateRepayment
}