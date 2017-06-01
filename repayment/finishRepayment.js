var Q = require('q');
function calculateRepayment(returnValue, title,year,month, amount) {
 	var expireDate = new Date(title.EndDate);

    if ( (month == expireDate.getMonth() + 1) && (year == expireDate.getFullYear() ) ) {
        returnValue.repayment = amount;
    }
    return Promise.resolve(returnValue);
}

module.exports = {
	calculateRepayment
}