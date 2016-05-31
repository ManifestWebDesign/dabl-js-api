'use strict';

angular.module('dablJs.api')

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
			fields: {
				created: Date,
				updated: Date
			}
		});
	}
]);
