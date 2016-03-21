'use strict';

angular.module('dablAuth', [
	'dabl'
]);'use strict';

angular.module('dablAuth')

.service('Auth', [
	'$rootScope',
	'$localstorage',
function (
	$rootScope,
	$localstorage
) {
		var obj = {}, loggedInUser = null;

		obj.setLoggedInUser = function (user) {
			loggedInUser = user;
		};

		obj.setUser = function (user) {
			var olduser = loggedInUser;
			obj.setLoggedInUser(user);

			if (olduser === null && user && user.id) {
				$rootScope.$broadcast('dabl-auth.user.logged-in');

			} else if (user === null) {
				$rootScope.$broadcast('dabl-auth.user.logged-out');
			}

			$localstorage.set('user', user);
		};

		obj.getUser = function () {
			return loggedInUser;
		};

		obj.getToken = function () {
			if (loggedInUser && typeof loggedInUser.authentication_token !== 'undefined') {
				return loggedInUser.authToken;
			}
			return null;
		};

		obj.getEmail = function () {
			if (loggedInUser && typeof loggedInUser.email !== 'undefined') {
				return loggedInUser.email;
			}
			return null;
		};

		obj.isLoggedIn = function () {
			return (
				loggedInUser &&
				typeof loggedInUser.email !== 'undefined' &&
				typeof loggedInUser.authToken !== 'undefined'
			);
		};

		obj.checkAuthorization = function (toState) {
			return !((
					typeof toState === 'undefined' ||
					typeof toState.data === 'undefined' ||
					typeof toState.data.bypassAuth === 'undefined' ||
					!toState.data.bypassAuth
				) &&
				!obj.isLoggedIn()
			);
		};

		obj.globalAdminIsLoggedIn = function () {
			var user = obj.getUser();
			return user && user.type === 1;
		};

		obj.projectManagerIsLoggedIn = function () {
			var user = obj.getUser();
			return user && user.type === 2;
		};

		obj.reset = function() {
			obj.setUser(null);
		};

		obj.passwordIsValid = function(password) {
			return (password.length >= 8 && password.match(/[A-Z]+/) && password.match(/[a-z]+/) && password.match(/[0-9]+/));
		}

		var u = $localstorage.get('user');
		if (u) {
			obj.setUser(u);
		}

		return obj;
	}
]);
;'use strict';

angular.module('dablAuth')
.factory('httpInterceptor', [
	'API_HASH',
	'API_SECRET',
	'security',
	'Auth',
	'$q',
	'$rootScope',
	'dablAuthConfig',
function (
	API_HASH,
	API_SECRET,
	security,
	Auth,
	$q,
	$rootScope,
	dablAuthConfig
) {
	function getAuthHeader(hmac) {
		return dablAuthConfig.header + API_HASH + ':' + hmac;
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
;'use strict';

angular.module('dablAuth')

.factory('$localstorage', [
	'$window',
function(
	$window
){
	return {
		get: function (key, defaultValue) {
			var val = $window.localStorage[key];
			return val ? JSON.parse(val) : defaultValue;
		},
		set: function (key, value) {
			$window.localStorage[key] = JSON.stringify(value);
		},
		remove: function(key) {
			return delete $window.localStorage[key];
		}
	};
}]);
;'use strict';
/*global jsSHA: false */
angular.module('dablAuth')
.factory('security', [
	'jsSHA',
function(
	jsSHA
){
	var obj = {};

	if (typeof jsSHA === 'undefined') {
		throw new Error('jsSHA is not included');
	}

	obj.getHMAC = function(skey, content){
		var hasher = new jsSHA('SHA-512', 'TEXT');
		hasher.setHMACKey(skey, 'TEXT');
		hasher.update(content);
		return hasher.getHMAC('HEX');
	};

	obj.getHash = function(content, type) {
		type = type || 'SHA-512';
		var hasher = new jsSHA(type, 'TEXT');
		hasher.update(content);
		return hasher.getHash('HEX');
	};

	obj.encode64 = function(d) {
		return btoa(d);
	};

	obj.decode64 = function(d) {
		return atob(d);
	};

	return obj;
}]);
;'use strict';

angular.module('dablAuth')
.factory('serverApi', [
	'$q',
	'$http',
	'API_URL',
function(
	$q,
	$http,
	API_URL
){
	var serverApi = {
		makeRequest: function(endpoint, data, method, contentType) {
			data = data || '';
			method = method ? method.toUpperCase() : (data === '' ? 'GET' : 'POST');
			if (endpoint.charAt(0) === '/') {
				endpoint = endpoint.substring(1);
			}

			var deferredAbort = $q.defer(),
				options = {
					method: method,
					url: API_URL + '/' + endpoint,
					data: data,
					timeout: deferredAbort.promise
				};

			if (typeof contentType !== 'undefined') {
				options['headers'] = {'Content-Type': contentType};
			}

			//console.log('making request: ', JSON.stringify(options));

			var promise = $http(options).then(function(r){
				return r.data;
			}, function(e){
				return $q.reject(e);
			});

			promise.abort = function() {
				deferredAbort.resolve();
			};

			promise.finally(function(){
				promise.abort = angular.noop;
				deferredAbort = promise = null;
			});
			return promise;
		},
		serialize: function (obj, prefix) {
			//Method from http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
			var str = [];
			for (var p in obj) {
				if (obj.hasOwnProperty(p)) {
					var k = prefix ? prefix + '[' + p + ']' : p, v = obj[p];
					str.push(typeof v === 'object' ?
						serverApi.serialize(v, k) :
						encodeURIComponent(k) + '=' + encodeURIComponent(v));
				}
			}
			return str.join('&');
		},
		unserialize: function (query) {
			var result = {};
			var spl = query.split('&');
			angular.forEach(spl, function(val) {
				if (val.length < 1) {
					return;
				}
				var sides = val.split('=');
				if (sides[0].indexOf('[') !== -1) {
					var start = sides[0].indexOf('[');
					var end = sides[0].indexOf(']');
					var key;
					var idx;
					++start;
					end = end - start;
					idx = sides[0].substr(0, start - 1);
					key = sides[0].substr(start, end);
					if (typeof result[idx] === 'undefined') {
						result[idx] = {};
					}
					result[idx][key] = sides[1];
				} else {
					result[decodeURIComponent(sides[0])] = decodeURIComponent(sides[1]);
				}
			});
			return result;
		}
	};

	return serverApi;
}]);
;'use strict';

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
;'use strict';

angular.module('dablAuth')
.service('userApi', [
	'security',
	'serverApi',
function(
	security,
	serverApi
){
	var obj = {},
		url = 'users';

	obj.signIn = function(username, password) {
		var endpoint = url + '/login',
			contentType = 'application/x-www-form-urlencoded',
			data = 'credentials=' + security.encode64([username, password].join(':'));
		return serverApi.makeRequest(endpoint, data, 'post', contentType);
	};

	obj.signOut = function() {
		var endpoint = url + '/login/logout';
		return serverApi.makeRequest(endpoint, null, 'get');
	};

	return obj;
}]);
