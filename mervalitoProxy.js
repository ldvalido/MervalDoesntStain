var config = require('config');
var request = require('request');
var promise = require('promise');
var Q = require('q');

function getBondByTitle(symbol) {
  var apiUrl = config.get('apiUrl');
  var urlBond = apiUrl + 'titles/' + symbol;
  return new promise((resolve,reject) => {
	request.get(urlBond, (err, res, body) => {
		if (err == null) {
			var title = JSON.parse(res.body); 
			return resolve(title);
		}else{
			return reject(err);
		}
	});
  });
}

function getBonds() {
  var apiUrl = config.get('apiUrl');
  var urlBond = apiUrl + 'titles/';
  return new promise((resolve,reject) => {
	request.get(urlBond, (err, res, body) => {
		if (err == null) {
			var title = JSON.parse(res.body); 
			return resolve(title);
		}else{
			return reject(err);
		}
	});
  });
}

function updateTitle(title) {	
  	var apiUrl = config.get('apiUrl');
  	var urlBond = apiUrl + 'titles/';
	return new promise((resolve,reject) => {
		request({
		    method:'PUT',
	      	headers: { 'Content-Type': 'application/json' },
	      	url: urlBond,
	      	body: JSON.stringify( title) 
	    }, (err,res,body) => {
	    	if (err == null){
	    		return resolve(JSON.parse(res.body));
	    	}else{
	    		return reject(err);
	    	}
	    })	
	});
	
}
function getCompanyManagers() {
	var apiUrl = config.get('apiUrl');  
  	var urlListCompanyManager = apiUrl + 'companymanager';
  	return new promise((resolve,reject) => {
  		request.get(urlListCompanyManager, (err,res,body) => {
  			if (err == null){
  				var list = JSON.parse(res.body); 
				return resolve(list);
  			}else{
  				return reject(err);
  			}
  		})
  	})
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
  return new promise((resolve,reject) => {
	request.get(urlBond, (err, res, body) => {
		if (err == null) {
			var title = JSON.parse(res.body); 
			return resolve(title);
		}else{
			return reject(err);
		}
	});
  });
}

function getCurrency(idOrSymbol) {
	var q = Q.defer();
	var apiUrl = config.get('apiUrl');
  	var url = apiUrl + 'currency/' + idOrSymbol;
  	console.log(url);
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
	return new promise((resolve,reject) => {
		request({
		    method:'PUT',
	      	headers: { 'Content-Type': 'application/json' },
	      	url: urlCurrency,
	      	body: JSON.stringify( currency) 
	    }, (err,res,body) => {
	    	if (err == null){
	    		return resolve(JSON.parse(body));
	    	}else{
	    		return reject(err);
	    	}
	    })	
	});	
}

module.exports = {
	getBondByTitle, getBonds, updateTitle, updateCompanyManager, getCompanyManagers, getCurrencies, getCurrency, updateCurrency
}