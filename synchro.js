var _ = require('lodash');

direction = {
	onlyRemote: 1
}
function synch( remoteSource, localSource, options, syncCb) {
	if (options.direction == direction.onlyRemote) {
		synchroRemote(remoteSource, localSource, options, syncCb)
	}	
}

function synchroRemote( remoteSource, localSource, options, syncCb) {
	var delta = _.filter(localSource, el => {
		var pos = _.findIndex(remoteSource, (rEl) => {
			rEl[options.remoteField] == el[options.localField]
		});
		return pos == -1;
	});
	_.each(delta, function (el) {
		syncCb(el);
		});
}
module.exports = 
{
	synch, direction
}