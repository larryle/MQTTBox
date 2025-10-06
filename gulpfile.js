/*
  gulpfile.js
  ===========
  Rather than manage one giant configuration file responsible
  for creating multiple tasks, each task has been broken out into
  its own file in gulp/tasks. Any files in that directory get
  automatically required below.
  To add a new task, simply add a new task file that directory.
  gulp/tasks/default.js specifies the default set of tasks to run
  when you run `gulp`.
*/

// Explicitly require task files to avoid require-dir compatibility issues
require('./gulp/tasks/browserSync');
require('./gulp/tasks/browserify');
require('./gulp/tasks/build');
require('./gulp/tasks/default');
require('./gulp/tasks/markup');
require('./gulp/tasks/setWatch');
require('./gulp/tasks/watch');
