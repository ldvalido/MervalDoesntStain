var config = require('config');
var request = require('request');
var Q = require('q');

function getBondByTitle(symbol) {
  var q = Q.defer();
  var apiUrl = config.get('apiUrl');
  var urlBond = apiUrl + 'titles/' + symbol;
  request.get(urlBond, (err, res, body) => {
		if (err == null) {
			var title = JSON.parse(res.body); 
			q.resolve(title);
		}else{
      q.reject(err);
		}
	});
  return q.promise;
}

function getBonds() {
  var apiUrl = config.get('apiUrl');
  var urlBond = apiUrl + 'titles/';
  var q = Q.defer();
  request.get(urlBond, (err, res, body) => {
		if (err == null) {
			var title = JSON.parse(res.body); 
			q.resolve(title);
		}else{
			q.reject(err);
		}
	});
  return q.promise;
}

function updateTitle(title) {
	var q = Q.defer();
  	var apiUrl = config.get('apiUrl');
  	var urlBond = apiUrl + 'titles/';
	request({
	    method:'PUT',
      	headers: { 'Content-Type': 'application/json' },
      	url: urlBond,
      	body: JSON.stringify( title) 
    }, (err,res,body) => {
    	if (err == null){
    		return q.resolve(JSON.parse(res.body));
    	}else{
    		return q.reject(err);
    	}
    })
	return q.promise;
	
}
function getCompanyManagers() {
	var q = Q.defer();
  var apiUrl = config.get('apiUrl');  
  var urlListCompanyManager = apiUrl + 'companymanager';
  request.get(urlListCompanyManager, (err,res,body) => {
  	if (err == null){
  		var list = JSON.parse(res.body); 
			q.resolve(list);
  	}else{
  		q.reject(err);
  	}
  });
  return q.promise;
}
function updateCompanyManager(companymanager) {
	var apiUrl = config.get('apiUrl');  
  var urlListCompanyManager = apiUrl + 'companymanager';
	request({
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      url: urlListCompanyManager,
      body: JSON.stringify( companymanager) 
    });
}
function getCurrencies() {
  var apiUrl = config.get('apiUrl');
  var urlBond = apiUrl + 'currency/';
  var q = Q.defer();

  request.get(urlBond, (err, res, body) => {
	if (err == null) {
		var title = JSON.parse(res.body); 
		return q.resolve(title);
	}else{
		return q.reject(err);
	}
	});
  return q.promise;
}

function getCurrency(idOrSymbol) {
	var q = Q.defer();
	var apiUrl = config.get('apiUrl');
  	var url = apiUrl + 'currency/' + idOrSymbol;
  	request.get(url, (err, res, body) => {
		if (err == null) {
			var currency = JSON.parse(body); 
			q.resolve(currency);
		}else{
			q.reject(err);
		}
	});
  	return q.promise;
}

function updateCurrency(currency){
	var apiUrl = config.get('apiUrl');
  	var urlCurrency = apiUrl + 'currency/';
  	var q = Q.defer();
	request({
	    method:'PUT',
      	headers: { 'Content-Type': 'application/json' },
      	url: urlCurrency,
      	body: JSON.stringify( currency) 
    }, (err,res,body) => {
    	if (err == null){
    		return q.resolve(JSON.parse(body));
    	}else{
    		return q.reject(err);
    	}
    });
	return q.promise;
}

module.exports = {
	getBondByTitle, getBonds, updateTitle, updateCompanyManager, getCompanyManagers, getCurrencies, getCurrency, updateCurrency
}