
/* Notes:
   - gulp/tasks/browserify.js handles js recompiling with watchify
   - gulp/tasks/browserSync.js watches and reloads compiled files
*/

var gulp   = require('gulp');
var config = require('../config');

gulp.task('watch', gulp.series('setWatch', 'browserSync', function watchTask() {
  gulp.watch(config.markup.src, gulp.series('markup'));
}));
