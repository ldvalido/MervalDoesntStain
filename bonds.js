
var fs = require('fs');
var functions = require('./functions.js');
var financeData = require('./financeData.js');
var bondRulesFileName = './bondRules.json';

function getBondRule(symbol) {
	var rawProcFile = fs.readFileSync(bondRulesFileName, 'utf8');
	var bondRules = JSON.parse(rawProcFile);

	var bond = bondRules.find(bondRule => bondRule.symbol == symbol);
	return bond;

}
function getCashFlow(symbol, amount) {
  var returnValue = [];
  var bondRule = getBondRule(symbol);
  var nowDate = new Date();
  var endDate = new Date(bondRule.expireDate);
  var startMonth = nowDate.getFullYear() * 12 + nowDate.getMonth() + 1;
  var endMonth = endDate.getFullYear() * 12 + endDate.getMonth() + 1;
  for (var i = startMonth; i <= endMonth; i++)
  {
  	var year = Math.trunc(i/12);
    var el = getPayment(symbol, year,i - year*12,amount);
    returnValue.push(el);
  }
  return returnValue;
}
function getPayment(symbol,year,month, amount) 
{
	var returnValue = {year:year, month:month, repayment:0,interest:0};
	var bond = getBondRule(symbol);

	var hasPayment = (month - bond.paymentMonth) % bond.paymentFrequency == 0;
  	if (hasPayment) {
	    var expireDate = new Date(bond.expireDate);
	    var isExpired = (year > expireDate.getFullYear()) || (year == expireDate.getFullYear() && month > expireDate.getMonth() + 1);
	    if (!isExpired){
	      //Calculate Repayment
	      switch(bond.repayment) {
	        case 'finish':
	          if ( (month == expireDate.getMonth() + 1) && (year == expireDate.getFullYear() ) ) {
	            returnValue.repayment = amount;
	          }
	          break;
	        case 'fixLinked':
	          var dolarRate = financeData.getRate(month,year);
	          returnValue.repayment = (bond.repaymentAmount * amount * parseFloat(dolarRate.value) / 100);
	          break;
	      }
	      //Calculate Rent
	      switch (bond.rentMode) {
	        case 'fixedRent':
	          returnValue.interest = amount * bond.interest * (bond.paymentFrequency / 12) / 100;
	          break;
	        case 'badlar':
	          var finalInterest = (financeData.getBadlarAverage(bond.badlarAverage) + bond.interest) / 12 * bond.paymentFrequency;
	          returnValue.interest = (amount * finalInterest / 100);
	          break;
	        case 'linked':
	          var dateFirstRepayment = new Date(bond.firstRepaymentDate);
	          var qtyMonth = functions.noOfmonths(dateFirstRepayment, new Date(year,month-1,dateFirstRepayment.getDate()+1,0,0,0,0))
	          var payments = qtyMonth / bond.paymentFrequency;
	          var pendingPayment = 100 - payments *  bond.repaymentAmount;
	          var rentPercentage = pendingPayment * bond.interest / 12 * bond.paymentFrequency / 100;
	          var rent = amount * rentPercentage / 100;
	          var dolarRate = financeData.getRate(month,year);
	          var rentLocalCurrency = rent * parseFloat( dolarRate.value);
	          returnValue.interest = rentLocalCurrency;
	          break;
	      }
	      returnValue.total = returnValue.interest + returnValue.repayment;
	    }
	  }
	return returnValue;
}
module.exports = {
	getPayment, getCashFlow
}