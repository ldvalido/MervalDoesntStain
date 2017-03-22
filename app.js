var express = require('express')
var app = express()
var $ = require('cheerio');
var request = require('sync-request');
var util = require('util');
var fs = require('fs');
var fileName = './dolar.json';
var bondRulesFileName = './bondRules.json';
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
app.get('/getAverageBadlarRate/:days', function(req,res) {
  var days = parseInt(req.params.days);
  var rawData = fs.readFileSync(fileName,'utf8');
  var financialData = JSON.parse(rawData);
  var returnValue = functions.getBadlarAverage(financialData, days);
  res.send(JSON.stringify(returnValue.toFixed(2)));

})

app.get('/bond/:symbol/flow',function (req,res) {
  var returnValue = [];
  for (var i = 1; i <= 12; i++){

  }
  res.send(JSON.stringify(returnValue))

})
app.get('/bond/:symbol/flow/:year/:month/:amount',function (req,res) {
  var returnValue = {interest:0,repayment:0,total:0};
  var month = parseInt(req.params.month);
  var year = parseInt(req.params.year);
  var amount = parseFloat(req.params.amount);
  
  var rawData = fs.readFileSync(bondRulesFileName, 'utf8');
  var bondRules = JSON.parse(rawData);
  
  var rawProcFile = fs.readFileSync(fileName, 'utf8');
  var financialData = JSON.parse(rawProcFile);

  var bond = bondRules.find(bondRule => bondRule.symbol == req.params.symbol);
  var hasPayment = (month - bond.paymentMonth) % bond.paymentFrequency == 0;
  if (hasPayment) {
    var expireDate = new Date(bond.expireDate);
    var isExpired = (year > expireDate.getFullYear()) || (year == expireDate.getFullYear() && month > expireDate.getMonth() + 1);
    if (!isExpired){
      //Calculate Repayment
      switch(bond.repayment) {
        case 'finish':
          if ( (month == expireDate.getMonth() + 1) && (year == expireDate.getFullYear() ) ) {
            returnValue.repayment = amount;
          }
          break;
        case 'fixLinked':
          var dolarRate = financialData.values.find( o => o.month == month);
          returnValue.repayment = (bond.repaymentAmount * amount * parseFloat(dolarRate.value) / 100);
          break;
      }
      //Calculate Rent
      switch (bond.rentMode) {
        case 'fixedRent':
          returnValue.interest = amount * bond.interest * (bond.paymentFrequency / 12) / 100;
          break;
        case 'badlar':
          var finalInterest = (functions.getBadlarAverage(financialData,bond.badlarAverage) + bond.interest) / 12 * bond.paymentFrequency;
          returnValue.interest = (amount * finalInterest / 100);
          break;
        case 'linked':
          var dateFirstRepayment = new Date(bond.firstRepaymentDate);
          var qtyMonth = functions.noOfmonths(dateFirstRepayment, new Date(year,month-1,dateFirstRepayment.getDate()+1,0,0,0,0))
          var payments = qtyMonth / bond.paymentFrequency;
          var pendingPayment = 100 - payments *  bond.repaymentAmount;
          var rentPercentage = pendingPayment * bond.interest / 12 * bond.paymentFrequency / 100;
          var rent = amount * rentPercentage / 100;
          var dolarRate = financialData.values.find( o => o.month == month);
          var rentLocalCurrency = rent * parseFloat( dolarRate.value);
          returnValue.interest = rentLocalCurrency;
          break;
      }
      returnValue.total = returnValue.interest + returnValue.repayment;
    }
  }
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