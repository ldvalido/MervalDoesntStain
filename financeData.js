var fileName = './dolar.json';

var fs = require('fs');

function getRate(month, year) {
  	var rawData = fs.readFileSync(fileName, 'utf8');
  	var financialData = JSON.parse(rawData);
  	var el = financialData.dollarValues.find ( o => o.month == month && o.year ==  year);
    if (el == null){
      el = financialData.dollarValues.find ( o => o.month == -1 && o.year ==  year);
    }
  	return el;
}

function getCurrentDollarRate(month, year) {
    var rawData = fs.readFileSync(fileName, 'utf8');
    var financialData = JSON.parse(rawData);
    return financialData.dollarRate;
}

function getCurrentEuroRate(month, year) {
    var rawData = fs.readFileSync(fileName, 'utf8');
    var financialData = JSON.parse(rawData);
    return financialData.euroRate;
}
function getBadlarRate() {
  var rawData = fs.readFileSync(fileName,'utf8');
  var financialData = JSON.parse(rawData);
  return financialData.badlarRate;
}

function getBadlarAverage(days) {
	var rawData = fs.readFileSync(fileName, 'utf8');
  	var financialData = JSON.parse(rawData);
  	var rates = financialData.badlarValues.slice(0,days);
  	var sum = 0;
  	for (var i = 0; i < rates.length;i++){
    	sum += rates[i].rate;
  	}
  	var returnValue =  sum / days;
  	return returnValue;
}
module.exports = {
	getRate, getBadlarAverage, getCurrentDollarRate, getCurrentEuroRate, getBadlarRate, getBadlarAverage
}