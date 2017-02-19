var request = require('sync-request');
var util = require('util');
var fs = require('fs');
var fileName = './dolar.json';
var schedule = require('node-schedule');
var xml = require('xml2js');
var dateformat = require('dateformat');
var $ = require('cheerio');

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function getCurrentDollarRate() {
  var returnValue = '';
  var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22USDARS%22)&env=store://datatables.org/alltableswithkeys';
  var response = request('GET',url);
  var rawResponse = response.getBody('utf8');
  xml.parseString(rawResponse,
     function (err, result) {
      returnValue = result.query.results[0].rate[0].Bid[0];
  });
  return returnValue;
}

function getCurrentEuroRate() {
  var returnValue = '';
  var url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20yahoo.finance.xchange%20where%20pair%20in%20(%22EURUSD%22)&env=store://datatables.org/alltableswithkeys';
  var response = request('GET',url);
  var rawResponse = response.getBody('utf8');
  xml.parseString(rawResponse,
     function (err, result) {
      returnValue = result.query.results[0].rate[0].Bid[0];
  });
  return returnValue;
}
function processRates() {
  var currentDate = new Date();
  var fee = {
    processDate: currentDate,
    dollarRate: null,
    euroRate:null,
    values: []
  };
  var key='DLR%s2017';
  var url = 'https://www.rofex.com.ar';

  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);

  var html = request('GET',url);
  var rawHtml = html.getBody('utf8');
  var node = $.load(rawHtml);
  for (var i = 1; i <= 12; i++) {

    var selector = util.format(".table-rofex > tbody > tr:contains('%s') td", util.format(key, pad(i,2)  ) );

    var value = node(selector).first().next().text();
    if (value != '') {
      var el = fee.values.find ( o => o.month == i);
      if (el){
        el.value= value;
      }else{
        fee.values.push({month: i, value: value});
      }
    }
  }
  fee.dollarRate = getCurrentDollarRate();
  fee.euroRate = getCurrentEuroRate();
  var rawOutput = JSON.stringify( fee , null , '  ');
  fs.writeFile(fileName, rawOutput);
  fs.writeFile('./history/' + dateformat(currentDate,'yyyymmdd') + '.json', rawOutput);

  return rawOutput;
}


module.exports = {
    pad,  getCurrentDollarRate, processRates
};
