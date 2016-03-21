'use strict';

angular.module('dablAuth')
.factory('httpInterceptor', [
	'API_HASH',
	'API_SECRET',
	'security',
	'Auth',
	'$q',
	'$rootScope',
function (
	API_HASH,
	API_SECRET,
	security,
	Auth,
	$q,
	$rootScope
) {
	function getAuthHeader(hmac) {
		return 'dabl-auth-header' + API_HASH + ':' + hmac;
	}

	function generateHeaders(endpoint) {
		var date = (Date.now() / 1000) | 0;
		var hmac = security.getHMAC(API_SECRET, [endpoint, date].join(','));
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
			$rootScope.$broadcast('dabl-auth.response.error', rejection);
			return $q.reject(rejection);
		},
		generateHeaders: generateHeaders
	};
}]);
