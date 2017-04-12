
var financeData = require('./financeData.js');
var utils = require('./utils.js');
var merval = require('./mervalitoProxy.js');
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
  	if (hasPayment) {
	    var expireDate = new Date(title.EndDate);
	    var isExpired = (year > expireDate.getFullYear()) || (year == expireDate.getFullYear() && month > expireDate.getMonth() + 1);
	    if (!isExpired){
	      //Calculate Repayment
	      switch(title.PaymentPeriod.Id) {
	        case 1:
	          var dolarRate = financeData.getRate(month,year);
	          returnValue.repayment = (title.AmortizationAmount * amount * parseFloat(dolarRate.value) / 100);
	          break;
	        case 2:
	          if ( (month == expireDate.getMonth() + 1) && (year == expireDate.getFullYear() ) ) {
	            returnValue.repayment = amount;
	          }
	          break;
	      }
	      //Calculate Rent
	      switch (title.BondType.Id) {
	        case 2: //Dolar Linked
	          var dateFirstRepayment = new Date(title.RentDate);
	          var qtyMonth = utils.noOfmonths(dateFirstRepayment, new Date(year,month-1,dateFirstRepayment.getDate()+1,0,0,0,0))
	          var payments = qtyMonth / (title.PaymentPeriod.Days / 30);
	          var pendingPayment = 100 - payments *  title.AmortizationAmount;
	          var rentPercentage = pendingPayment * title.RentAmount / 12 * (title.PaymentPeriod.Days / 30 )/ 100;
	          var rent = amount * rentPercentage / 100;
	          var dolarRate = financeData.getRate(month,year);
	          var rentLocalCurrency = rent * parseFloat( dolarRate.value);
	          returnValue.interest = rentLocalCurrency;
	          break;
	        case 4: //Tasa Fija
	          returnValue.interest = amount * title.RentAmount * title.PaymentPeriod.Days / 360 / 100;
	          break;
	        case 6: // Bonos Dolarizados
	        	returnValue.interest = amount * title.RentAmount * title.PaymentPeriod.Days / 360 / 100;
	        	var qCurrency = merval.getCurrency('USD').then(
	        		function (res) {;
	        			getPaymentCurrency(returnValue,res,q);
	        		});
        		break;
	        case 5: //Badlar
	          var finalInterest = (financeData.getBadlarAverage(bond.badlarAverage) + bond.interest) / 12 * bond.paymentFrequency;
	          returnValue.interest = (amount * finalInterest / 100);
	          break;
	      }
	      //returnValue.total = returnValue.interest + returnValue.repayment;
	    }
  	}else{
	  	return q.resolve(returnValue);
  	}
	return q.promise;
}

function getPaymentCurrency(returnValue, currency, q) {
	returnValue.currency = currency;
	returnValue.total = returnValue.interest + returnValue.repayment;
	q.resolve(returnValue);
}
module.exports = {
	getPayment, getCashFlow, calculateTIR
}