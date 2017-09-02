var request = require('request');
var Q = require('q');
var util = require('util');
var xml = require('xml2js');

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
  var rawUrl = 'https://query.yahooapis.com/v1/public/yql';
  var query = util.format('select * from yahoo.finance.quotes where symbol in ("%s")',symbol + '.BA');
  var store = 'store://datatables.org/alltables.env';
  var url = util.format('%s?q=%s&format=json&env=%s&callback=',rawUrl,encodeURIComponent(query),encodeURIComponent(store));
  console.log(url);
  var q = Q.defer();
    var rawJson = request({
      method:'GET',
      url:url
    }, (err,res,body) => {
      console.log(body);
      var jsonResponse = JSON.parse(body);
      var returnValue =  jsonResponse.query.results.quote.Ask || jsonResponse.query.results.quote.LastTradePriceOnly;
      return q.resolve(returnValue);
    });
    return q.promise;
    
}

module.exports = {
	getRate, getBondValue
}