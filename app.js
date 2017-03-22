var express = require('express')
var app = express()
var $ = require('cheerio');
var request = require('sync-request');
var util = require('util');
var fs = require('fs');
var finance = require('./financeData.js');
var schedule = require('node-schedule');
var xml = require('xml2js');
var dateformat = require('dateformat');
var functions = require('./functions.js');
var bonds = require('./bonds.js');
const statusMonitor = require('express-status-monitor')();

app.use(statusMonitor);
app.get('/getrate/:year/:month', function (req, res) {
  var month =  parseInt(req.params.month);
  var year = parseInt(req.params.year);
  var returnValue = finance.getRate(month,year);
  res.send(JSON.stringify(returnValue));
})

app.get('/getCurrentDollarRate', function(req,res) 
{
  var returnValue = finance.getCurrentDollarRate();
  res.send( JSON.stringify(returnValue) );
})
app.get('/getCurrentEuroRate', function(req,res) {
  var returnValue = finance.getCurrentEuroRate();
  res.send( JSON.stringify(returnValue) );
})
app.get('/getBadlarRate', function(req,res) {
  var returnValue = finance.getBadlarRate();
  res.send( JSON.stringify (returnValue))
})
app.get('/getAverageBadlarRate/:days', function(req,res) {
 var days = parseInt(req.params.days);
 var returnValue = finance.getBadlarAverage(days);
 res.send(JSON.stringify(returnValue) );
})

app.get('/bond/:symbol/flow/:amount',function (req,res) {
  var returnValue = [];

  var symbol = req.params.symbol;
  var amount = parseFloat(req.params.amount);
  var returnValue = bonds.getCashFlow(symbol, amount);
  res.send(JSON.stringify(returnValue))

})
app.get('/bond/:symbol/flow/:year/:month/:amount',function (req,res) {
  
  var month = parseInt(req.params.month);
  var year = parseInt(req.params.year);
  var amount = parseFloat(req.params.amount);
  
  var returnValue = bonds.getPayment(req.params.symbol,year,month,amount);

  res.send( JSON.stringify(returnValue) );
})
app.get('/bond/:symbol/tir',function (req,res) {

})
app.get('/process', function (req, res) {
    var result = functions.processRates();
    res.send(result);
})


app.listen(process.env.PORT || 3000, function () {
  console.log('Merval does not stain app listening on port 3000!');
  var rule = new schedule.RecurrenceRule();
  rule.hour = 5;
  rule.minute = 0;
  rule.second = 0;

  schedule.scheduleJob(rule, function(){
    console.log('Running Schedule for create rates' + new Date().toISOString());
    functions.processRates();
  });
})