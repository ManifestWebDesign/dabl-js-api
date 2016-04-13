'use strict';

angular.module('dablApi')
.factory('dablHttpInterceptor', [
	'dablApiConfig',
	'dablSecurity',
	'dablAuth',
	'$q',
	'$rootScope',
function (
	dablApiConfig,
	dablSecurity,
	dablAuth,
	$q,
	$rootScope
) {
	function getAuthHeader(hmac) {
		return dablApiConfig.headerName + ' ' + dablApiConfig.hash + ':' + hmac;
	}

	function generateHeaders(endpoint) {
		var date = (Date.now() / 1000) | 0;
		var hmac = dablSecurity.getHMAC(dablApiConfig.secret, [endpoint, date].join(','));
		var obj = {
			'X-Timestamp': date,
			'Authorization': getAuthHeader(hmac)
		};
		if (dablAuth.isLoggedIn()) {
			obj['X-Username'] = dablAuth.getUser()['username'];
			obj['X-User-Token'] = dablAuth.getUser()['authToken'];
		}
		return obj;
	}

	return {
		request: function (config) {
			var headers = generateHeaders(config.url);

			if (typeof config['headers']['X-Timestamp'] !== 'undefined') {
				return config;
			}

			for(var header in headers) {
				config['headers'][header] = headers[header];
			}

			return config;
		},
		responseError: function(rejection) {
			$rootScope.$broadcast('dablApi.response.error', rejection);
			return $q.reject(rejection);
		},
		generateHeaders: generateHeaders
	};
}]);
