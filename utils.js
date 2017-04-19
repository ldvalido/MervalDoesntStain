function dayDiff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
}

function normalizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(',','.'); 
  }
  return value;
}

function noOfmonths(date1, date2) {
    var Nomonths;
    Nomonths= (date2.getFullYear() - date1.getFullYear()) * 12;
    Nomonths-= date1.getMonth() + 1;
    Nomonths+= date2.getMonth() +1; // we should add + 1 to get correct month number
    return Nomonths <= 0 ? 0 : Nomonths;
}

function parseEuropeanDate(value) {
  var sections = value.split('/');
  return new Date(sections[2],sections[1],sections[0],0,0,0,0);
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

module.exports={
	dayDiff, noOfmonths, normalizeValue, parseEuropeanDate, pad
}