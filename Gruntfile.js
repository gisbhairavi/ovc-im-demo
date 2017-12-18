var testFiles = "test/**/Test*.js";
var allJs = ["Gruntfile.js", "src/**/*.js", "test/**/*.js"];

module.exports = function (grunt) {

	grunt.initConfig({

		watch: {

			lint: {
				files: allJs,
				tasks: ["jshint:all"]
			},

			tape: {
				files: [testFiles],
				tasks: ["tape:files"]
			}
		},

		jshint: {
			options: {
				curly: true,
				forin: true,
				eqeqeq: true,
				eqnull: true,
				latedef: "nofunc",
				notypeof: true,
				undef: true,
				unused: true,
				node: true
			},
			all: allJs
		},

		tape: {
			requests: ["test/**/Test*Requests.js"],
			local: [testFiles, "!test/**/Test*Requests.js"],
			ciRequests: {
				src: ["test/**/Test*Requests.js"],
				options: {
					pretty: false
				}
			},
			ciLocal: {
				src: [testFiles, "!test/**/Test*Requests.js"],
				options: {
					pretty: false
				}
			}
		}

	});

	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks('grunt-tape');

	grunt.registerTask("default", ["jshint", "watch:lint"]);
	grunt.registerTask("test", ["tape:requests", "tape:local"]);
	grunt.registerTask("ci", ["jshint", "tape:ciRequests", "tape:ciLocal"]);
};
