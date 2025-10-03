var browserSync = require('browser-sync');
var gulp        = require('gulp');
var config      = require('../config').browserSync;

gulp.task('browserSync', gulp.series('build', function browserSyncTask(done) {
  browserSync(config);
  done();
}));
