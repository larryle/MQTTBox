/* browserify task
   ---------------
   Bundle javascripty things with browserify!
   This task is set up to generate multiple separate bundles, from
   different sources, and to use Watchify when run from the default task.
   See browserify.bundleConfigs in gulp/config.js
*/

var browserify   = require('browserify');
var watchify     = require('watchify');
var bundleLogger = require('../util/bundleLogger');
var gulp         = require('gulp');
var handleErrors = require('../util/handleErrors');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');
var config       = require('../config').browserify;
var babelify     = require('babelify');
var path         = require('path');
var fs           = require('fs');

gulp.task('browserify', function(callback) {

  var bundleQueue = config.bundleConfigs.length;

  var browserifyThis = function(bundleConfig) {

    var bundler = browserify({
      // Required watchify args
      cache: {}, packageCache: {}, fullPaths: false,
      // Specify the entry point of your app
      entries: bundleConfig.entries,
      // Add file extensions to make optional in your requires
      extensions: config.extensions,
      // Enable source maps!
      debug: config.debug
    });

    // Define finish reporter before bundle() so it's in scope
    var reportFinished = function() {
      // Log when bundling completes
      bundleLogger.end(bundleConfig.outputName);

      if (bundleQueue) {
        bundleQueue--;
        if (bundleQueue === 0) {
          // If queue is empty, tell gulp the task is complete.
          // https://github.com/gulpjs/gulp/blob/master/docs/API.md#accept-a-callback
          callback();
        }
      }
    };

    var bundle = function() {
      // Log when bundling starts
      bundleLogger.start(bundleConfig.outputName);

      var outDir = bundleConfig.dest;
      var outName = bundleConfig.outputName;
      try {
        // 支持 outputName 中包含子目录，如 "platform/xxx.js"
        var dirname = path.dirname(bundleConfig.outputName);
        var basename = path.basename(bundleConfig.outputName);
        outDir = path.join(bundleConfig.dest, dirname === '.' ? '' : dirname);
        outName = basename;
      } catch (e) {}
      // 规范化为绝对路径，避免 dest() 接收到异常值
      try { outDir = path.resolve(outDir); } catch (_) {}

      try { fs.mkdirSync(outDir, { recursive: true }); } catch(_) {}

      // 直接写入文件，绕过 vinyl 管道，避免 non-Vinyl 错误
      var outPath = path.join(outDir, outName);
      var writeStream = fs.createWriteStream(outPath);

      return bundler
        .bundle()
        .on('error', handleErrors)
        .pipe(writeStream)
        .on('finish', reportFinished);
    };

    bundler.transform(babelify.configure());

    if (global.isWatching) {
      // Wrap with watchify and rebundle on changes
      bundler = watchify(bundler);
      // Rebundle on update
      bundler.on('update', bundle);
    }

    return bundle();
  };

  // Start bundling with Browserify for each bundleConfig specified
  config.bundleConfigs.forEach(browserifyThis);
});
