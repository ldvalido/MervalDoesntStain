var express = require('express')
var app = express()
var $ = require('cheerio');
var request = require('sync-request');
var util = require('util');
var fs = require('fs');
var fileName = './dolar.json';

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

app.get('/getrate/:month', function (req, res) {
  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);
  var el = fee.values.find ( o => o.month == parseInt(req.params.month) );
  if (el){
    res.send(el.value);
  }
})

app.get('/process', function (req, res) {
    var fee = {
      processDate: new Date,
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
    var rawOutput = JSON.stringify( fee );
    fs.writeFile(fileName, rawOutput);
    res.send(rawOutput + ' <BR/> Process OK');
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
})
