
var fs = require('fs');
var functions = require('./functions.js');
var financeData = require('./financeData.js');
var bondRulesFileName = './bondRules.json';
var util = require('util');
var utils = require('./utils.js');
var request = require('sync-request');

function getBondRule(symbol) {
	var rawProcFile = fs.readFileSync(bondRulesFileName, 'utf8');
	var bondRules = JSON.parse(rawProcFile);

	var bond = bondRules.find(bondRule => bondRule.symbol == symbol);
	return bond;

}
function getCashFlow(title, amount) {
  var returnValue = [];
  var nowDate = new Date();
  var endDate = new Date(title.EndDate);
  var startMonth = nowDate.getFullYear() * 12 + nowDate.getMonth() + 1;
  var endMonth = endDate.getFullYear() * 12 + endDate.getMonth() + 1;
  for (var i = startMonth; i <= endMonth; i++)
  {
  	var year = Math.trunc(i/12);
    var el = getPayment(title, year,i - year*12,amount);
    returnValue.push(el);
  }
  return returnValue;
}
function getBondValue(symbol) {
	var rawUrl = 'https://query.yahooapis.com/v1/public/yql';
	var query = util.format('select * from yahoo.finance.quotes where symbol in ("%s")',symbol + '.BA');
	var store = 'store://datatables.org/alltableswithkeys';
	var url = util.format('%s?q=%s&format=json&env=%s&callback=',rawUrl,encodeURIComponent(query),encodeURIComponent(store));
  	
  	var rawJson = request('GET',url);
  	var jsonResponse = rawJson.getBody('utf8');
  	var obj = JSON.parse (jsonResponse);
  	return obj.query.results.quote.Ask;
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
	var returnValue = {year:year, month:month, repayment:0,interest:0,total:0};
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
	          returnValue.interest = amount * title.AmortizationAmount * title.PaymentPeriod.Days / 360 / 100;
	          break;
	        case 5: //Badlar
	          var finalInterest = (financeData.getBadlarAverage(bond.badlarAverage) + bond.interest) / 12 * bond.paymentFrequency;
	          returnValue.interest = (amount * finalInterest / 100);
	          break;
	      }
	      returnValue.total = returnValue.interest + returnValue.repayment;
	    }
	  }
	return returnValue;
}
module.exports = {
	getPayment, getCashFlow, calculateTIR, getBondValue
}