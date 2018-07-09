var gulp = require('gulp');
var paths = require('../paths');
var del = require('del');
var vinylPaths = require('vinyl-paths');
var gutil = require('gulp-util');

// deletes all files in the output path
gulp.task('clean', function() {
  gutil.log(`== cleaning the ${paths.output} folder ==`);  
  return gulp.src([paths.output])
    .pipe(vinylPaths(del));
}); 