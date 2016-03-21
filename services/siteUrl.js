'use strict';

angular.module('dablAuth')

.factory('siteUrl', [
	'API_URL',
function(
	API_URL
) {
	var version = 16;

	return function(url, rev){

		url = url || '';

		if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
			url = API_URL + '/' + (url ? url : '');
		}

		if (rev) {
			url += '?v=' + version;
		}

		return url;
	};
}]);
