'use strict';

angular.module('dablApi')
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
