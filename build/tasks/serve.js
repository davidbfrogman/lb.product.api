var gulp = require('gulp');
var browserSync = require('browser-sync');
var gutil = require('gulp-util');

// this task utilizes the browsersync plugin
// to create a dev server instance
// at http://localhost:9000
gulp.task('serve', ['build'], function(done) {
  gutil.log('== instantiation of browswerSync ==');  
  browserSync({
    online: false,
    open: false,
    port: 8081,
    server: {
      baseDir: ['.'],
      middleware: function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
      }
    }
  }, done);
});