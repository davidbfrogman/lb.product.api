var gulp = require('gulp');
var paths = require('../paths');
var gutil = require('gulp-util');

// outputs changes to files to the console
function reportChange(event) {
  console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
}

// this task wil watch for changes
// to js, html, and css files and call the
// reportChange method. Also, by depending on the
// serve task, it will instantiate a browserSync session
gulp.task('watch', ['serve'], function() {
  gutil.log('== Setting up watchers for directories ==');   
  gulp.watch(paths.source, ['build-system']).on('change', reportChange);
  gulp.watch(paths.yaml, ['copy-yaml']).on('change', reportChange);
  gulp.watch(paths.json, ['copy-json']).on('change', reportChange);
  gulp.watch(paths.css, ['copy-css']).on('change', reportChange);
  gulp.watch(paths.swagger, ['copy-swagger']).on('change', reportChange);
});