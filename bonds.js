var financeData = require('./financeData.js');
var utils = require('./utils.js');
var paymentCtx = require('./payment/paymentContext.js');
var rePaymentCtx = require('./repayment/repaymentContext.js');
var Q = require('q');

function getCashFlow(title, amount) {
  var nowDate = new Date();
  var endDate = new Date(title.EndDate);
  var startMonth = nowDate.getFullYear() * 12 + nowDate.getMonth() + 1;
  var endMonth = endDate.getFullYear() * 12 + endDate.getMonth() + 1;
  var paymentPromises = [];
  for (var i = startMonth; i <= endMonth; i++)
  {
  	var year = Math.trunc(i/12);
  	paymentPromises.push( getPayment(title, year,i - year*12, amount) );
  }
  return Q.all(paymentPromises)
  
}
function calculateTIR(title) {
	var returnValue = {symbol: title.Symbol, plainTIR: 0};
	var cashFlow = getCashFlow(title, title.MinimumQuantity);
	var sum = 0;
	for (var i = 0; i < cashFlow.length;i++) {
		sum += cashFlow[i].total;
	}
	var roi = (sum / title.Price - 1) * 100;
	var days = utils.dayDiff(new Date(),new Date(title.EndDate));
	returnValue.plainTIR = 360 * roi / days;
	return returnValue;
}
function getPayment(title,year,month, amount) 
{
	var q = Q.defer();
	var returnValue = {year:year, month:month, currency:{}, repayment:0,interest:0,total:0};
	var rentDate = new Date( title.RentDate);
	var rentMonth = rentDate.getMonth() + 1;

	var hasPayment = (month - rentMonth) % (title.PaymentPeriod.Days / 30) == 0;
	var expireDate = new Date(title.EndDate);
	var isExpired = (year > expireDate.getFullYear()) || (year == expireDate.getFullYear() && month > expireDate.getMonth() + 1);
  	if (hasPayment && !isExpired) {
  		  rePaymentCtx.calculateRepayment(returnValue, title, year, month, amount)
  		  	.then(returnValue => {
  		  		paymentCtx.calculatePayment(returnValue, title,year, month, amount).then(paymentValue => {
              q.resolve(paymentValue);
	      		});
  		  	});
  	}else{
	  	q.resolve(returnValue);
  	}
	return q.promise;
}
module.exports = {
	getPayment, getCashFlow, calculateTIR
}