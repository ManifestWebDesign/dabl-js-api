'use strict';

var LIVERELOAD_PORT = 35728;

module.exports = function (grunt) {

	// Load npm plugins to provide necessary tasks.
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// Project configuration.
	// configurable paths
	var yeomanConfig = {
		app: 'app',
		dist: 'dist'
	};

	try {
		yeomanConfig.app = require('./bower.json').appPath || yeomanConfig.app;
	} catch (e) {
	}

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
					'js/**/*.js'
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
					'dist/dabl-api.js': [
						'bower_components/dabl/dist/scripts/dabl.js',
						'bower_components/dabl/dist/scripts/dabl.adapter.rest.js',
						'bower_components/dabl/dist/scripts/dabl.adapter.rest.angular.js',
						'main.js',
						'services/*.js',
						'models/Model.js'
					]
				}
			}
		},
		uglify: {
			depsJs: {
				files: {
					'dist/dabl-api.min.js': 'dist/dabl-api.js'
				}
			}
		},
		copy: {
			main: {
				files: [
					{
						src: 'css/fonts/*',
						dest: 'dist/fonts',
						expand: true,
						flatten: true
					}
				]
			}
		}
	});

	// Default task to be run.
	grunt.registerTask('default', [
		'clean',
		'concat',
		'uglify',
		'copy'
	]);

	grunt.registerTask('hint', [
		'newer:jshint'
	]);
};
