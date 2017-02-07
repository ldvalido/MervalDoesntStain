var express = require('express')
var app = express()
var $ = require('cheerio');
var request = require('sync-request');
var util = require('util');
var fs = require('fs');
var fileName = './dolar.json';
var schedule = require('node-schedule');
var xml = require('xml2js');
var dateformat = require('dateformat');

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function getCurrentDollarRate() {
  var returnValue = '';
  var url = 'http://www.webservicex.net/CurrencyConvertor.asmx/ConversionRate?FromCurrency=USD&ToCurrency=ARS';
  var response = request('GET',url);
  var rawResponse = response.getBody('utf8');
  xml.parseString(rawResponse, function (err, result) {
      returnValue = result.double._;
  });
  return returnValue;
}
function processRates() {
  var currentDate = new Date();
  var fee = {
    processDate: currentDate,
    rate: null,
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
  fee.rate = getCurrentDollarRate();
  var rawOutput = JSON.stringify( fee );
  fs.writeFile(fileName, rawOutput);
  fs.writeFile('./history/' + dateformat(currentDate,'yyyymmdd') + '.json', rawOutput);

  return rawOutput;
}

app.get('/getrate/:month', function (req, res) {
  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);
  var el = fee.values.find ( o => o.month == parseInt(req.params.month) );
  if (el){
    res.send(JSON.stringify(el));
  }
})

app.get('/process', function (req, res) {
    var result = processRates();
    res.send(result);
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port 3000!');
  var rule = new schedule.RecurrenceRule();
  rule.hour = 5;
  rule.minute = 0;

  schedule.scheduleJob(rule, function(){
    console.log('Running Schedule for create rates' + new Date().toISOString());
    processRates();
  });
})
