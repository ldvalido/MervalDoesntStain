var request = require('request');
var util = require('util');
var utils = require('./utils.js')
var fs = require('fs');
var fileName = './dolar.json';
var xml = require('xml2js');
var dateformat = require('dateformat');
var $ = require('cheerio');
var synchro = require('./synchro.js');
var config = require('config');
var bondManager = require('./bonds.js');
var mervalProxy = require('./mervalitoProxy.js');
var yahooFinance = require('./yahooFinanceManager.js');
var _ = require('lodash');
var Q = require('q');
var bcbaManager = require('./BCBAManager.js');

function getCurrentDollarRate() {
  var q = Q.defer();
   yahooFinance.getRate('ARS').
      then( res => { return q.resolve(res) }, 
        err => { return q.reject(err) }); 
  return q.promise;
}

function getCurrentEuroRate() {
  var q = Q.defer();
   yahooFinance.getRate('USD').
      then( res => { return q.resolve(res) }, 
        err => { return q.reject(err) }); 
  return q.promise;
}
function getBadlarRate() {
  var q = Q.defer();
  var returnValue = [];
  var url = 'http://www.ambito.com/economia/mercados/tasas/info/?ric=ARSBADPR1MD=RR';
  request({
      method:'GET',
      url:url
    }, (err,res,rawHtml) => {
      var node = $.load(rawHtml);
      var selectorTableForQty = ".tablaMercados>tr";
      var cells = node(selectorTableForQty).find('td');
      var tableQuantity = cells.length / 3;
      for (var i = 1; i < tableQuantity; i++) {
        var rateRaw = cells[i*3+2].children[0].next.children[0].data;
        var dateRaw = cells[i*3].children[0].children[0].data;
        var rate = parseFloat(rateRaw.replace(',','.'));
        var date = utils.parseEuropeanDate(dateRaw);
        returnValue.push ({date:date,rate:rate});
      }
      q.resolve(returnValue);
    });
  return q.promise;
}

function getRateByYear(node, fee, year){
  var key='DLR%s' + year;
   for (var i = 1; i <= 12; i++) {

    var selector = util.format(".table-rofex > tbody > tr:contains('%s') td", util.format(key, utils.pad(i,2)  ) );

    var value = node(selector).first().next().text();
    if (value != '') {
      var el = fee.dollarValues.find ( o => o.month == i && o.year == year);
      var normalizedValue =  parseFloat(utils.normalizeValue(value));
      if (el){
        el.value = normalizedValue;
      }else{
        fee.dollarValues.push({year:year, month: i, value: normalizedValue});
      }
    }
  }
  return fee;
}
function processFundMutual(){
  var q = Q.defer();
  var returnValue = {
    companyManager:[]
  };
  var url = 'http://fondosargentina.org.ar/scripts/cfn_CAFCIHome.html';
  var urlCompanyManager = config.get('mutualFund.companyManager');
  
  var urlSheet = 'http://www.cafci.org.ar/Scripts/cfn_PlanillaDiariaXMLList.asp';
  var apiUrl = config.get('apiUrl');
  
  var urlListCompanyManager = apiUrl + 'companymanager';
  request.get(urlCompanyManager, function(err, response, body) {
    //var rawCookies = response.headers['set-cookie'];
    //var urlSheet = 'http://www.cafci.org.ar/Scripts/cfn_PlanillaDiariaXMLList.asp';
    xml.parseString(response.body, function (err, result) {
      if (result.Coleccion.Datos) {
        var companyManagers = result.Coleccion.Datos[0].Dato;
        for (var i = 0; i < companyManagers.length; i++) {
          var companyRaw = companyManagers[i];
          var company = {
            ExternalId:parseInt( companyRaw.SGI[0]),
            Description: companyRaw.SGN[0],
            Id: 0
          };
          returnValue.companyManager.push(company);
        }
        mervalProxy.getCompanyManagers().then( lst => {
          synchro.synch(lst, returnValue.companyManager,
              {
                remoteField: 'ExternalId', 
                localField: 'ExternalId', 
                direction: synchro.direction.onlyRemote
              }, 
              function (syncEl) {
                mervalProxy.updateCompanyManager(syncEl);
              });
              q.resolve(returnValue);
        } );
      } else {
        q.resolve(returnValue);
      }
    });
  });
  return q.promise;
}
function processRates() {
  var q = Q.defer();
  var currentDate = new Date();
  var fee = {
    processDate: currentDate,
    dollarRate: null,
    euroRate:null,
    badlarRate: null,
    dollarValues: [],
    badlarValues:[]
  };
  var url = config.get('rofexUrl');
  var rawData = fs.readFileSync(fileName, 'utf8');
  var fee = JSON.parse(rawData);
  var chain = Q.when();
  chain.then(function(){
    return request({
      method:'GET',
      url:url
    }, (err,res,body) => {
      return body;
    })
  }).then(function(rawHtml) {
    var node = $.load(rawHtml);
    var nowDate = new Date();
    getRateByYear(node, fee,nowDate.getFullYear());
    getRateByYear(node, fee,nowDate.getFullYear() + 1);
    return fee;
  }).then(function(fee) {
    return getCurrentDollarRate();
  }).then(function (dollarRate) {
    fee.dollarRate = dollarRate;
    return fee;
  }).then(function (fee){
    return getCurrentEuroRate();
  }).then(function(euroRate){
    fee.euroRate = euroRate;
    return fee;
  }).then(function(fee) {
    return getBadlarRate();
  }).then(function(badlarValues){
    fee.badlarValues = badlarValues;
    fee.badlarRate = badlarValues[0].rate;
    fee.processDate = currentDate;
    var rawOutput = JSON.stringify( fee , null , '  ');
    fs.writeFile(fileName, rawOutput);
    fs.writeFile('./history/' + dateformat(currentDate,'yyyymmdd') + '.json', rawOutput);
    return q.resolve(rawOutput);
  });
  return q.promise;
}

function updateBondsRate() {
  var q = Q.defer();
  
  var returnValue = 
  {
    ok: [],
    err: []
  };
  mervalProxy.getBonds().then ( lst => {
    var chain = Q.when();
    _.forEach (lst, function(title) {
      chain = chain.then (function() {
        return yahooFinance.getBondValue(title.Symbol)
      }).then ( bondValue => {
        if (bondValue) {
          title.Price = bondValue;
        }
        //title.TIR = bondManager.calculateTIR(title).plainTIR;
        return mervalProxy.updateTitle(title);
      }).then(el => {
        returnValue.ok.push(el);
        q.notify(el);
      });
    });
    chain.then (function() {
      q.resolve(returnValue);
    });
  })
  return q.promise;
}
function updateCurrency() {
  var q = Q.defer();
  var returnValue = [];
  mervalProxy.getCurrencies().then ( lst => {
    return _.filter(lst,  c => c.Id != 1);
  }).then( lst => {
    var chain = Q.when();
    _.forEach(lst, currency => {
       chain = chain.then( function() {
          return yahooFinance.getRate(currency.Symbol)
       }).then( rate => {
          currency.Rate = rate;
          return mervalProxy.updateCurrency(currency);
      }).then(currency => {
          returnValue.push(currency);
      });
    })
    chain.then (function () {
      q.resolve(returnValue);
    })
  });
  return q.promise;
}

function updateStockExchangeBond() {
  var q = Q.defer();
  jobPromise = [];
  jobPromise.push(bcbaManager.getStockExchangeBond() );
  jobPromise.push(mervalProxy.getStockExchangeBond() );
  Q.all(jobPromise).then(job => {
    var bcbaData = job[0];
    var mervalData = job[1];
    console.log(bcbaData);
    _.forEach(bcbaData, item => {
      var elem = _.filter(mervalData,function(mervalItem) {
        return mervalItem.Days == item.Days && mervalItem.Currency.Id == item.Currency.Id;
      });
      console.log(elem);
      if (elem.length > 0) {
        item.Percentage = mervalItem.Percentage;
        mervalProxy.updateStockExchangeBond(item);
      }else{
        mervalProxy.createStockExchangeBond({
          Days: mervalItem.Days,
          Percentage: mervalItem.Percentage,
          Currency: mervalItem.Currency
        });
      }
    })
    q.resolve(mervalData);
  });
  return q.promise;
}

module.exports = {
    getCurrentDollarRate, getCurrentEuroRate, processRates, processFundMutual, updateBondsRate, updateCurrency, updateStockExchangeBond
};