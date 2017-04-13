var express = require('express')
var app = express()
var finance = require('./financeData.js');
var schedule = require('node-schedule');
var functions = require('./functions.js');
var bonds = require('./bonds.js');
var mervalito = require('./mervalitoProxy.js')
var yahooFinance = require('./yahooFinanceManager.js')
const statusMonitor = require('express-status-monitor')();

app.use(statusMonitor);
app.get('/getrate/:year/:month', function (req, res) {
  var month =  parseInt(req.params.month);
  var year = parseInt(req.params.year);
  var returnValue = finance.getRate(month,year);
  res.send(JSON.stringify(returnValue));
})

app.get('/price/:symbol', function(req,res){
  yahooFinance.getBondValue(req.params.symbol).then( value => {
    res.send(JSON.stringify(value));
  }
  );
})

app.get('/getCurrentDollarRate', function(req,res) 
{
  functions.getCurrentDollarRate().then(rate => {
    res.send( JSON.stringify(rate) );
  });
})
app.get('/getCurrentEuroRate', function(req,res) {
  functions.getCurrentEuroRate().then(rate => {
    res.send( JSON.stringify(rate) );
  });
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
  mervalito.getBondByTitle(symbol).then( (title) => {
      var returnValue = bonds.getCashFlow(title, amount).then( returnValue => {
        res.send(JSON.stringify(returnValue));  
      })
    });
})
app.get('/bond/:symbol/flow/:year/:month/:amount',function (req,res) {
  var month = parseInt(req.params.month);
  var year = parseInt(req.params.year);
  var amount = parseFloat(req.params.amount);
  var symbol = req.params.symbol;
  mervalito.getBondByTitle(symbol).then( (title) => {
    bonds.getPayment(title,year,month,amount).then ( returnValue => 
      {
        res.send( JSON.stringify(returnValue) );
      });
  });
})
app.get('/bond/:symbol/tir',function (req,res) {
  var returnValue = [];
  var symbol = req.params.symbol;
  mervalito.getBondByTitle(symbol).then( (title) => {
      var returnValue = bonds.calculateTIR(title);
      res.send(JSON.stringify(returnValue));
    });
})
app.get('/process', function (req, res) {
    var result = functions.processRates();
    res.send(result);
})

app.get('/updatemutualfund', function(req,res) {
  var result = functions.processFundMutual( res, function(res, result) {
      res.send(JSON.stringify( result));
    }
  );
})

app.get('/updatebond', function (req,res) {
  var result = functions.updateBondsRate().then ( result => {
    res.header("Content-Type", "application/json");
    res.send(JSON.stringify(result))
  }, err => {
    res.send (err);
  }, progress => {
    console.log(progress);
  });
});

app.get('/updatecurrency', function (req,res) {
  var result = functions.updateCurrency().then(lst => {
    res.send(JSON.stringify(lst));
  })
});

app.all("/*", function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST");
  return next();
});

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