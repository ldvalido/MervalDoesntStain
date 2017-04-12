var request = require('sync-request');
var requestAsync = require('request');
var util = require('util');
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
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
function normalizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(',','.'); 
  }
  return value;
}
function parseEuropeanDate(value) {
  var sections = value.split('/');
  return new Date(sections[2],sections[1],sections[0],0,0,0,0);
}
function roundNumber(value,decimalQuantity) {
  var factor = 1;
  for (var i = 1; i<= decimalQuantity; i++){
    factor = factor * 10;
  }
  return Math.round(value * factor) / factor;
}
function getCurrentDollarRate() {
  var q = Q.defer();
   yahooFinance.getRate('USDARS').
      then( res => { return q.resolve(res) }, 
        err => { return q.reject(err) }); 
  return q.promise;
}

function getCurrentEuroRate() {
  var q = Q.defer();
   yahooFinance.getRate('EURUSD').
      then( res => { return q.resolve(res) }, 
        err => { return q.reject(err) }); 
  return q.promise;
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

function getRateByYear(node, fee, year){
  var key='DLR%s' + year;
   for (var i = 1; i <= 12; i++) {

    var selector = util.format(".table-rofex > tbody > tr:contains('%s') td", util.format(key, pad(i,2)  ) );

    var value = node(selector).first().next().text();
    if (value != '') {
      var el = fee.dollarValues.find ( o => o.month == i && o.year == year);
      var normalizedValue =  parseFloat(normalizeValue(value));
      if (el){
        el.value = normalizedValue;
      }else{
        fee.dollarValues.push({year:year, month: i, value: normalizedValue});
      }
    }
  }
  return fee;
}
function processFundMutual(res,cb){
  var returnValue = {
    companyManager:[]
  };
  var url = 'http://fondosargentina.org.ar/scripts/cfn_CAFCIHome.html';
  var urlCompanyManager = config.get('mutualFund.companyManager');
  
  var urlSheet = 'http://www.cafci.org.ar/Scripts/cfn_PlanillaDiariaXMLList.asp';
  var apiUrl = config.get('apiUrl');
  
  var urlListCompanyManager = apiUrl + 'companymanager';
  requestAsync.get(urlCompanyManager, function(err, response, body) {
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
              cb(res,returnValue);
        } );
      } else {
        cb(res,returnValue);
      }
    });
  });
}
function processRates() {
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

  var html = request('GET',url);
  var rawHtml = html.getBody('utf8');
  var node = $.load(rawHtml);
  var nowDate = new Date();
  getRateByYear(node, fee,nowDate.getFullYear());
  getRateByYear(node, fee,nowDate.getFullYear() + 1);
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

function updateBondsRate(res, cb) {
  var returnValue = 
  {
    ok: [],
    err: []
  };
  mervalProxy.getBonds().then ( lst => {
    _.forEach (lst, function(title) {
      yahooFinance.getBondValue(title.Symbol).then( value => {
          if (value) {
            title.Price = value;  
          }
          title.TIR = bondManager.calculateTIR(title).plainTIR;
          mervalProxy.updateTitle(title)
            .then( el => {returnValue.ok.push(title);},
                   el => {returnValue.err.push(title)});
      })
    });
    cb(res,returnValue);
  })
}
function updateCurrency() {
  var q = Q.defer();
  var returnValue = [];
    mervalProxy.getCurrencies().then ( lst => {
      _.forEach (lst, function (currency) {
        if (currency.Id != 1) {
          yahooFinance.getRate('USD' + currency.Symbol).then(res => {
            currency.Rate = res;
            mervalProxy.updateCurrency(currency).then(
              el => {
                returnValue.push(el); 
              });
          })
        }
      });
      return q.resolve(returnValue);
    });
  return q.promise;
}

module.exports = {
    pad,  getCurrentDollarRate, getCurrentEuroRate, processRates, parseEuropeanDate, roundNumber, processFundMutual, updateBondsRate, updateCurrency
};