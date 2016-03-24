'use strict';

angular.module('dablApi')

.factory('dablModel', [
	'dabl',
	'dablApiConfig',
	function(
		dabl,
		dablApiConfig
	) {
		var adapter = new dabl.AngularRESTAdapter(dablApiConfig.baseUrl + '/');
		return dabl.Model.extend('model', {
			adapter: adapter,
			fields: {}
		});
	}
]);
