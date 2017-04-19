const fileName = './dolar.json';
var fs = require('fs');
var Q = require('q');

function getRate(month, year) {
    var q = Q.defer();
  	var rawData = fs.readFile(fileName, 'utf8', (err,rawData) => {
      var financialData = JSON.parse(rawData);
      var el = financialData.dollarValues.find ( o => o.month == month && o.year ==  year);
      if (el == null){
        el = financialData.dollarValues.find ( o => o.month == -1 && o.year ==  year);
      }
      return q.resolve(el);;
    });
    return q.promise;
}

function getBadlarRate() {
  var q = Q.defer();
  fs.readFile(fileName,'utf8', (err,rawData) => {
    var financialData = JSON.parse(rawData);
    return q.resolve(financialData.badlarRate);
  });
  return q.promise;
}

function getBadlarAverage(days) {
	var q = Q.defer();
  var rawData = fs.readFile(fileName, 'utf8', (err,rawData) => {
    var financialData = JSON.parse(rawData);
    var rates = financialData.badlarValues.slice(0,days);
    var sum = 0;
    for (var i = 0; i < rates.length;i++){
      sum += rates[i].rate;
    }
    var returnValue =  sum / days;
    q.resolve(returnValue);
  });
  return q.promise;
  	
}
module.exports = {
	getRate, getBadlarAverage, getBadlarRate
}