'use strict';

var LIVERELOAD_PORT = 35728;

module.exports = function (grunt) {

	// Load npm plugins to provide necessary tasks.
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// Project configuration.
	// configurable paths
	var yeomanConfig = {
		app: 'src',
		dist: 'dist'
	};

	grunt.initConfig({
		yeoman: yeomanConfig,
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
					'<%yeoman.app%>/**/*.js'
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
						'bower_components/jsSHA/src/sha.js',
						'<%yeoman.app%>/main.js',
						'<%yeoman.app%>/services/*.js',
						'<%yeoman.app%>/models/Model.js'
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