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

function parseEuropeanDate(value) {
  var sections = value.split('/');
  return new Date(sections[2],sections[1],sections[0],0,0,0,0);
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

function getBadlarRate() {
  var returnValue = [];
  var url = 'http://www.ambito.com/economia/mercados/tasas/info/?ric=ARSBADPR1MD=RR';
  var response = request('GET',url);
  var rawHtml = response.getBody('utf8');
  var node = $.load(rawHtml);
  var selectorTableForQty = ".tablaMercados>tr";
  var cells = node(selectorTableForQty).find('td');
  var tableQuantity = cells.length / 3;
  for (var i = 1; i < tableQuantity; i++) {
    var rateRaw = cells[i*3+2].children[0].next.children[0].data;
    var dateRaw = cells[i*3].children[0].children[0].data;
    var rate = parseFloat(rateRaw.replace(',','.'));
    var date = parseEuropeanDate(dateRaw);
    returnValue.push ({date:date,rate:rate});
  }
  
  return returnValue;
}
function processRates() {
  var currentDate = new Date();
  var fee = {
    processDate: currentDate,
    dollarRate: null,
    euroRate:null,
    badlarRate: null,
    values: [],
    badlarValues:[]
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
  fee.processDate = currentDate;
  fee.badlarValues = getBadlarRate();
  fee.badlarRate = fee.badlarValues[0].rate;
  var rawOutput = JSON.stringify( fee , null , '  ');
  fs.writeFile(fileName, rawOutput);
  fs.writeFile('./history/' + dateformat(currentDate,'yyyymmdd') + '.json', rawOutput);

  return rawOutput;
}


module.exports = {
    pad,  getCurrentDollarRate, processRates, parseEuropeanDate
};
