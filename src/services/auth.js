'use strict';

angular.module('dablJs.api')

.service('dablAuth', [
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
		if (loggedInUser && typeof loggedInUser.authToken !== 'undefined') {
			return loggedInUser.authToken;
		}
		return null;
	};

	obj.getUsername = function () {
		if (loggedInUser && typeof loggedInUser.username !== 'undefined') {
			return loggedInUser.username;
		}
		return null;
	};

	obj.getEmail = function () {
		return obj.getUsername();
	};

	obj.isLoggedIn = function () {
		return (
			loggedInUser &&
			typeof loggedInUser.username !== 'undefined' &&
			typeof loggedInUser.authToken !== 'undefined'
		);
	};

	obj.checkAuthorization = function (toState) {
		return !((
				typeof toState === 'undefined' ||
				typeof toState.data === 'undefined' ||
				typeof toState.data.bypassAuth === 'undefined' || !toState.data.bypassAuth
			) && !obj.isLoggedIn()
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

	obj.reset = function () {
		obj.setUser(null);
	};

	obj.passwordIsValid = function (password) {
		return (password.length >= 8 && password.match(/[A-Z]+/) && password.match(/[a-z]+/) && password.match(/[0-9]+/));
	};

	var u = $localstorage.get('user');
	if (u) {
		obj.setUser(u);
	}

	return obj;
}]);
