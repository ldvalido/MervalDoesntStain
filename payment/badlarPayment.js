var Q = require('q');
var financeData = require('../financeData.js');
//TODO: badlarAverage, que hacemos?
//TODO: require con path arbitrarios
function calculatePayment(returnValue, title,year,month, amount) {
	var q = Q.defer();
	financeData.getBadlarAverage(title.badlarAverage || 10).then(badlarRate => {
		var finalInterest = (badlarRate + title.RentAmount) / 12 * title.PaymentPeriod.Days / 360;
		returnValue.interest = (amount * finalInterest / 100);
		returnValue.total = returnValue.interest + returnValue.repayment;
		q.resolve(returnValue);
	});
	return q.promise;
}

module.exports = {
	calculatePayment
}