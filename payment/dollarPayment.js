var Q = require('q');
var merval = require('../mervalitoProxy.js');

function calculatePayment(returnValue, title,year,month, amount) {
	var q = Q.defer();
	returnValue.interest = amount * title.RentAmount * title.PaymentPeriod.Days / 360 / 100;
	merval.getCurrency('USD').then( currency => {
		returnValue.currency = currency;
		returnValue.total = returnValue.interest + returnValue.repayment;
		q.resolve(returnValue);
	});
	return q.promise;

}

module.exports = {
	calculatePayment
}