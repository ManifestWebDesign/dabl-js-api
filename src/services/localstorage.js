'use strict';

angular.module('dablJs.api')

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
