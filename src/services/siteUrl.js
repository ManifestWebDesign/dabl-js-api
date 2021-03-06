'use strict';

angular.module('dablJs.api')

.factory('dablSiteUrl', [
	'dablApiConfig',
function(
	dablApiConfig
) {
	var version = 16;

	return function(url, rev){

		url = url || '';

		if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
			url = dablApiConfig.baseUrl + '/' + (url ? url : '');
		}

		if (rev) {
			url += '?v=' + version;
		}

		return url;
	};
}]);
