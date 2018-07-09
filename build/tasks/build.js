var gulp = require('gulp');
var debug = require('gulp-debug');
var ts = require('gulp-typescript');
var debug =  require('debug');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var mapSources = require('@gulp-sourcemaps/map-sources');
var paths = require('../paths');
 
gulp.task('build-system', function () {

    gutil.log(`== building typescript to ${paths.output} ==`);
    var tsProject = ts.createProject('tsconfig.json');
    var tsResult = gulp.src(paths.source)
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated 
        .pipe(tsProject());
 
    return tsResult.js
        .pipe(mapSources(function(sourcePath, file) {
            return file.base + sourcePath; //I'm not sure if this will always work but it works for now.
        }))
        .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file 
        .pipe(gulp.dest(paths.output));
});

gulp.task('copy-yaml', function () {
    gulp.src(paths.yaml)
      .pipe(gulp.dest(paths.output));
});

gulp.task('copy-json', function () {
    gulp.src(paths.json)
      .pipe(gulp.dest(paths.output));
});

gulp.task('copy-css', function () {
    gulp.src(paths.css)
      .pipe(gulp.dest(paths.output));
});

gulp.task('copy-swagger', function () {
    gulp.src(paths.swagger)
      .pipe(gulp.dest(paths.output + '/swagger/'));
});

// this task calls the clean task (located
// in ./clean.js), then runs the build-system
// and build-html tasks in parallel
// https://www.npmjs.com/package/gulp-run-sequence
gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    ['build-system', 'copy-yaml', 'copy-json', 'copy-css', 'copy-swagger'],
    callback
  );
});