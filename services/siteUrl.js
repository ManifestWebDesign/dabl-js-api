'use strict';

angular.module('dabl-api')

.factory('siteUrl', [
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
