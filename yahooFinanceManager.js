var request = require('request');
var Q = require('q');
var util = require('util');
var xml = require('xml2js');

function getRate(forexKey) {
  var q = Q.defer();
    var returnValue = '';
    var url = 'https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22'+forexKey+'%22)&env=store://datatables.org/alltableswithkeys';
    request({
        method:'GET',
        url: url
        }, (err,res,body) => {
          if (err == null) {
            console.log(body);
            xml.parseString(body, function (err, result) {
                var returnValue = result.query.results[0].rate[0].Bid[0];
                return q.resolve(returnValue);
            }); 
          } else{
            return q.reject(err);
          }
        });
    return q.promise;
}

function getBondValue(symbol) {
  var rawUrl = 'https://query.yahooapis.com/v1/public/yql';
  var query = util.format('select * from yahoo.finance.quotes where symbol in ("%s")',symbol + '.BA');
  var store = 'store://datatables.org/alltableswithkeys';
  var url = util.format('%s?q=%s&format=json&env=%s&callback=',rawUrl,encodeURIComponent(query),encodeURIComponent(store));
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