'use strict';

angular.module('dablApi')
.factory('httpInterceptor', [
	'dablApiConfig',
	'security',
	'Auth',
	'$q',
	'$rootScope',
function (
	dablApiConfig,
	security,
	Auth,
	$q,
	$rootScope
) {
	function getAuthHeader(hmac) {
		return dablApiConfig.headerName + dablApiConfig.hash + ':' + hmac;
	}

	function generateHeaders(endpoint) {
		var date = (Date.now() / 1000) | 0;
		var hmac = security.getHMAC(dablApiConfig.secret, [endpoint, date].join(','));
		var obj = {
			'X-Timestamp': date,
			'Authorization': getAuthHeader(hmac)
		};
		if (Auth.isLoggedIn()) {
			obj['X-Email'] = Auth.getUser()['email'];
			obj['X-User-Token'] = Auth.getUser()['authToken'];
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
