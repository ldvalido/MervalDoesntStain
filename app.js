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
var functions = require('./functions.js');
const statusMonitor = require('express-status-monitor')();

app.use(statusMonitor);
app.get('/getrate/:month', function (req, res) {
  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);
  var el = fee.values.find ( o => o.month == parseInt(req.params.month) );
  if (el){
    res.send(JSON.stringify(el));
  }
})

app.get('/getCurrentDollarRate', function(req,res) {
  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);
  res.send( JSON.stringify(fee.dollarRate) );
})
app.get('/getCurrentEuroRate', function(req,res) {
  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);
  res.send( JSON.stringify(fee.euroRate) );
})
app.get('/getBadlarRate', function(req,res) {
  var rawData = fs.readFileSync(fileName,'utf8');
  var fee = JSON.parse(rawData);
  res.send( JSON.stringify (fee.badlarRate))
})
app.get('/process', function (req, res) {
    var result = functions.processRates();
    res.send(result);
})

app.listen(process.env.PORT || 3000, function () {
  console.log('Example app listening on port 3000!');
  var rule = new schedule.RecurrenceRule();
  rule.hour = 5;
  rule.minute = 0;
  rule.second = 0;

  schedule.scheduleJob(rule, function(){
    console.log('Running Schedule for create rates' + new Date().toISOString());
    functions.processRates();
  });
})
