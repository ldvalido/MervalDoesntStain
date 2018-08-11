var request = require('request');
var Q = require('q');
var util = require('util');
var xml = require('xml2js');
var yahooFinance = require('yahoo-finance');

function getRate(forexKey) {
  var q = Q.defer();
    var maxAttempts = 10;
    var attempts = 0;
    var returnValue = '';
    var result = null;
    var url = 'http://www.floatrates.com/daily/usd.json';
    request({
      method:'GET',
      url: url
      }, (err,res,body) => {
        var result = JSON.parse(body);
        var forexInfo = result[forexKey.toLowerCase()];
        var returnValue = forexInfo.rate;
        return q.resolve(returnValue);
      });
    return q.promise;
}

function getBondValue(symbol) {
  var q = Q.defer();
  yahooFinance.quote({
    symbol: symbol + '.BA',
    modules: [ 'price', 'summaryDetail' ] // see the docs for the full list
  }, function (err, quotes) {

    var returnValue = quotes.price.regularMarketPrice;
    q.resolve(returnValue);
  });
    return q.promise;
    
}

module.exports = {
	getRate, getBondValue
}