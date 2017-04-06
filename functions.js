var request = require('sync-request');
var requestAsync = require('request');
var util = require('util');
var fs = require('fs');
var fileName = './dolar.json';
var xml = require('xml2js');
var dateformat = require('dateformat');
var $ = require('cheerio');
var requestify = require('requestify');
var synchro = require('./synchro.js');
var config = require('config');
function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function dayDiff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
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

function noOfmonths(date1, date2) {
    var Nomonths;
    Nomonths= (date2.getFullYear() - date1.getFullYear()) * 12;
    Nomonths-= date1.getMonth() + 1;
    Nomonths+= date2.getMonth() +1; // we should add + 1 to get correct month number
    return Nomonths <= 0 ? 0 : Nomonths;
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

function getRateByYear(node, fee, year){
  var key='DLR%s' + year;
   for (var i = 1; i <= 12; i++) {

    var selector = util.format(".table-rofex > tbody > tr:contains('%s') td", util.format(key, pad(i,2)  ) );

    var value = node(selector).first().next().text();
    if (value != '') {
      var el = fee.dollarValues.find ( o => o.month == i && o.year == year);
      if (el){
        el.value= value;
      }else{
        fee.dollarValues.push({year:year, month: i, value: value});
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
  var urlCompanyManager = 'http://cafci.org.ar/Scripts/cfn_SGerentesXMLList.asp';
  var urlSheet = 'http://www.cafci.org.ar/Scripts/cfn_PlanillaDiariaXMLList.asp';
  var apiUrl = config.get('apiUrl');
  console.log('url:' + apiUrl);
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
        requestify.get(urlListCompanyManager).then( (res) => {
          var lst = JSON.parse(res.body);
          synchro.synch(lst, returnValue.companyManager,
              {
                remoteField: 'ExternalId', 
                localField: 'ExternalId', 
                direction: synchro.direction.onlyRemote
              }, 
              function (syncEl) {
                requestAsync({
                  method:'POST',
                  headers: { 'Content-Type': 'application/json' },
                  url: urlListCompanyManager,
                  body: JSON.stringify( syncEl) 
                });
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
  var url = 'https://www.rofex.com.ar';

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


module.exports = {
    pad,  getCurrentDollarRate, processRates, parseEuropeanDate, noOfmonths, roundNumber, dayDiff, processFundMutual
};
