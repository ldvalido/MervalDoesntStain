var request = require('request');
var promise = require('promise');
var util = require('util');
var xml = require('xml2js');

function getRate(forexKey) {
  return new promise( (resolve, reject ) => {
    var returnValue = '';
    var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22'+forexKey+'%22)&env=store://datatables.org/alltableswithkeys';
    
    request({
      method:'GET',
      url: url
      }, (err,res,body) => {
        if (err == null) {
          xml.parseString(body, function (err, result) {
              var returnValue = result.query.results[0].rate[0].Bid[0];
              return resolve(returnValue);
          }); 
        } else{
          return reject(err);
        }
      });
  });
}

module.exports = {
	getRate
}