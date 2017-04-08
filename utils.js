function dayDiff(first, second) {
    return Math.round((second-first)/(1000*60*60*24));
}



function noOfmonths(date1, date2) {
    var Nomonths;
    Nomonths= (date2.getFullYear() - date1.getFullYear()) * 12;
    Nomonths-= date1.getMonth() + 1;
    Nomonths+= date2.getMonth() +1; // we should add + 1 to get correct month number
    return Nomonths <= 0 ? 0 : Nomonths;
}

module.exports={
	dayDiff, noOfmonths
}