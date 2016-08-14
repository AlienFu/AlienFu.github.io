module.exports = function(grunt) {

    grunt.initConfig({
        concat: {
            "public/app.js": ['scripts/*.js']
        },
        watch: {
            scripts: {
                files: ['scripts/*.js'],
                tasks: ['concat'],
                options: {
                    spawn: false,
                },
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask('default', ['watch']);
};
