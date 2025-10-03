var gulp = require('gulp');

gulp.task('build', gulp.series('browserify', 'markup'));
