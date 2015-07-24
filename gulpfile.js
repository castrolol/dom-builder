'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var jshint = require("gulp-jshint");
var mocha = require("gulp-mocha");
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var stylish = require('jshint-stylish');

var config = {
    path : "./src",
    src: "./src/**/*.js",
    dst : "./dist"
}

function browserifyCode(debug){
    return browserify({debug: debug})
        .add(config.path + '/dom-builder.js')
        .bundle();        
}

gulp.task("test", ["js-hint"], function(){

    return gulp.src("./test/**/*.js")
            .pipe(mocha());

});

gulp.task("js-hint", function(){
    return gulp.src(config.src)
            .pipe(jshint())
            .pipe(jshint.reporter(stylish))
            .pipe(jshint.reporter('fail'));
});

gulp.task('browserify-full', function() {
  return  browserifyCode(true)
            .pipe(source('dom-builder.js'))           
            .pipe(gulp.dest(config.dst));
});

gulp.task('browserify-minified', function() {
  return  browserifyCode(false)
            .pipe(source('dom-builder.min.js'))
            .pipe(buffer())
            .pipe(uglify())
            .pipe(gulp.dest(config.dst));
});

gulp.task("browserify", ["browserify-full", "browserify-minified"]);


gulp.task("build", ["js-hint", "browserify"]);

gulp.task("default", ["build"]);