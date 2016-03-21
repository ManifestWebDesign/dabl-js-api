'use strict';

angular.module('dablApi')
.factory('serverApi', [
	'$q',
	'$http',
	'dablApiConfig',
function(
	$q,
	$http,
	dablApiConfig
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
					url: dablApiConfig.baseUrl + '/' + endpoint,
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
