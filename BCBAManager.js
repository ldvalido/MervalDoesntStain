var request = require('request');
var Q = require('q');
var config = require('config');
var util = require('./utils.js');
var _ = require('lodash');
var mervalitoProxy = require('./mervalitoProxy.js');

const rowsPerPage = 200;

function getStockExchangeBond() {
	var q = Q.defer();
	var returnValue = [];
	mervalitoProxy.getCurrencies().then ( currencies => {
		var url = config.get('StockExchangeBond');
		var pageNumber = 1;
		var qtyTotal = 0;

		getStockExchangeBondReq(url, pageNumber).then( result => {
			var dollarCurrency = _.filter(currencies, {Id:1});
			var pesoCurrency = _.filter(currencies, {Id:2});
			var data = result.d[0];
			qtyTotal = util.roundUp(data.CantidadTotalFilas / rowsPerPage,1);
			var dataToProcess = _.map(data.aTabla, function(item)
			{
				var el =
				{
					Percentage: item.TasaPromedio,
					Days: item.Plazo,
					Currency: item.TipoLiquidacionSIUIDDescripcion == 'Dólar' ? dollarCurrency : pesoCurrency
				}
				return el;
			});
			var returnValue = _.filter(dataToProcess, item => item.Percentage != 0);
			returnValue.concat(dataToProcess);
			q.resolve(returnValue);
		});
	});
  	return q.promise;
}
function getStockExchangeBondReq(url, pageNumber) {
	//Monitor: https://www.bolsar.com/VistasDL/PaginaCauciones.aspx
	var q = Q.defer();
	var options = { 
		method: 'POST',
  		url: url,
   		body: 
   		{ 
   			aEstadoTabla: 
   			[ 
   				{ 
					TablaNombre: 'tbCauciones',
          			PagActualNro: pageNumber,
          			Orden: 'Plazo',
          			EsOrdenAsc: true,
          			FilasxPagina: rowsPerPage,
          			MensajeNro: 0,
          			HashCode: 0 
          		},
          		{ 
      				TablaNombre: 'tbTotales',
      				FiltroVto: '',
      				FiltroEspecies: '',
      				PagActualNro: '1',
      				Orden: '',
      				EsOrdenAsc: true,
      				FilasxPagina: -1,
      				MensajeNro: 0,
      				HashCode: 0 
      			} 
  			] 
  		},
  		json: true
  	};
  	
  	request(options, (err,res,result) => {
  		if (err) throw new Error(error);  		
  		q.resolve(result);
  	})
  	return q.promise;
}
module.exports = {
	getStockExchangeBond
}