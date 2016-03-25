'use strict';

angular.module('dablApi')
.service('dablUserApi', [
	'dablSecurity',
	'dablServerApi',
function(
	dablSecurity,
	dablServerApi
){
	var obj = {},
		url = 'users';

	obj.signIn = function(username, password) {
		var endpoint = url + '/login',
			contentType = 'application/x-www-form-urlencoded',
			data = 'credentials=' + [dablSecurity.encode64(username), dablSecurity.encode64(password)].join(':');
		return dablServerApi.makeRequest(endpoint, data, 'post', contentType);
	};

	obj.signOut = function() {
		var endpoint = url + '/login/logout';
		return dablServerApi.makeRequest(endpoint, null, 'get');
	};

	return obj;
}]);
