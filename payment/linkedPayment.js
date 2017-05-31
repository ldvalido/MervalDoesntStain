var Q = require('q');
var utils = require('../utils.js');
var financeData = require('../financeData.js');
var merval = require('../mervalitoProxy.js');

//TODO: require con path arbitrarios
function calculatePayment(returnValue, title,year,month, amount) {
	var q = Q.defer();
 	var dateFirstRepayment = new Date(title.RentDate);
	var qtyMonth = utils.noOfmonths(dateFirstRepayment, new Date(year,month-1,dateFirstRepayment.getDate()+1,0,0,0,0))
	var payments = qtyMonth / (title.PaymentPeriod.Days / 30);
	var pendingPayment = 100 - payments *  title.AmortizationAmount;
	var rentPercentage = pendingPayment * title.RentAmount / 12 * (title.PaymentPeriod.Days / 30 )/ 100;
	var rent = amount * rentPercentage / 100;
	var dolarRate = financeData.getRate(month,year).then(dolarRate => {
		var rentLocalCurrency = rent * parseFloat( dolarRate.value);
		returnValue.interest = rentLocalCurrency;
		returnValue.total = returnValue.interest + returnValue.repayment;
		merval.getCurrency('ARS').then(currency => {
			returnValue.currency = currency;
			q.resolve(returnValue);
		});
	});
	return q.promise;
}

module.exports = {
	calculatePayment
}