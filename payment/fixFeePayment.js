var Q = require('q');

function calculatePayment(returnValue, title,year,month, amount) {
	returnValue.interest = amount * title.RentAmount * title.PaymentPeriod.Days / 360 / 100;
	returnValue.total = returnValue.interest + returnValue.repayment;
	return Promise.resolve(returnValue);
}

module.exports = {
	calculatePayment
}