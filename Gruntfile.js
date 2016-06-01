'use strict';

var LIVERELOAD_PORT = 35728;

module.exports = function (grunt) {

	// Load npm plugins to provide necessary tasks.
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


	grunt.initConfig({
		// Make sure code styles are up to par and there are no obvious mistakes
		jshint: {
			options: {
				jshintrc: '.jshintrc',
				reporter: require('jshint-stylish'),
				ignores: [
					'Gruntfile.js'
				]
			},
			all: {
				src: [
					'Gruntfile.js',
					'src/**/*.js'
				]
			}
		},
		clean: {
			all: ['dist/*', 'dist/**/*']
		},
		concat: {
			options: {
				separator: ';'
			},
			depsJs: {
				files: {
					'dist/dabl-js.api.js': [
						'bower_components/dabl/dist/scripts/dabl.js',
						'bower_components/dabl/dist/scripts/dabl.adapter.rest.js',
						'bower_components/dabl/dist/scripts/dabl.adapter.rest.angular.js',
						'bower_components/dabl-js-security/dist/dabl-js.security.js',
						'src/main.js',
						'src/services/*.js',
						'src/models/Model.js'
					]
				}
			}
		},
		uglify: {
			depsJs: {
				files: {
					'dist/dabl-js.api.min.js': 'dist/dabl-js.api.js'
				}
			}
		}
	});

	// Default task to be run.
	grunt.registerTask('build', [
		'clean',
		'concat',
		'uglify'
	]);

	grunt.registerTask('hint', [
		'newer:jshint'
	]);
};
