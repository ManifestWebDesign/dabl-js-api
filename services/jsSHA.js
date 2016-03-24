'use strict';

angular.module('dablApi')

.service('jsSHA', function() {
	if (typeof jsSHA === 'undefined') {
		throw new Error('jsSHA is not included');
	}

	return jsSHA;
});