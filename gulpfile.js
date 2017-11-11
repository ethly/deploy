'use strict';

/**
  Create tasks for build

  @param gulp         The gulp object, related to the project
  @param srcDir       The path of the directory with sources
  @param testDir      The path of the directory with tests
  @param buildDir     The patj of the output directory
  @param buildTestDir The path of the output directory for tests
*/
function createBuildTasks(gulp, srcDir, testDir, buildDir, buildTestDir) {

  const babel = require('gulp-babel');
  const del = require('del');
  const execFile = require('child_process').execFile;
  const eslint = require('gulp-eslint')
  const flow = require('flow-bin');
  const flowRemoveTypes = require('gulp-flow-remove-types');
  const jasmine = require('gulp-jasmine');
  const lazypipe = require('lazypipe');
  const sequence = require('run-sequence').use(gulp);

  const eslintConfig = {
    configFile: "standard-flow",
    parser: "babel-eslint",
    plugin: "jasmine",
    rules: {
      // Always require trailing comma (for better git-diffs)
      "comma-dangle": ["error", "always"],
      // Never require space between function and ()
      "space-before-function-paren": ["error", "never"],
    },
    envs: ["jasmine", "browser", "node"],
  };

  /**
    Creates tasks that starts flow with specified params

    @param taskName   The name of the task to create
    @param flowParams Params for flow
  */
  function createFlowTask(taskName, flowParams) {
    gulp.task(taskName, cb => {
      execFile(flow, flowParams, (err, stdout) => {
        console.log(stdout);
        cb(err);
      });
    });
  }

  const lint = config => lazypipe()
    .pipe(eslint, config)
    .pipe(eslint.format);

  /**
    Creates the task that
    - Removes flow types
    - Converts JS to the old syntax
    - Copies file to other directory

    @param taskName The name of the task to create
    @param from     The path of source directory
    @param to       The path of destination directory
  */
  function createProcessJSTask(taskName, from, to) {
    gulp.task(taskName, () => gulp.src(`${from}/**/*.js `)
      .pipe(lint(eslintConfig)())
      .pipe(flowRemoveTypes(), {
        pretty: true
      })
      .pipe(babel())
      .pipe(gulp.dest(to))
    );
  }

  /* Tasks for Type Checking */

  createFlowTask('typecheck', []);

  createFlowTask(
    'build-declarations', ['gen-flow-files', '--out-dir', buildDir, srcDir]
  );

  gulp.task('lint', () => {
    const fixConfig = Object.assign({}, eslintConfig, { fix: true });
    return gulp.src([
        `@(${srcDir}|${testDir})/**/*.js`
      ])
      .pipe(lint(fixConfig)())
      .pipe(gulp.dest('.'))
  });

  /* JS processing */

  createProcessJSTask('build-src', srcDir, buildDir);

  createProcessJSTask('build-test', testDir, `${buildTestDir}/${testDir}`);
  createProcessJSTask('build-src-test', srcDir, `${buildTestDir}/${srcDir}`);

  /* Test start */

  gulp.task('run-test', () => gulp.src(`${buildTestDir}/${testDir}/**/*.js`)
    .pipe(jasmine())
  );

  /* Clean-up */

  gulp.task('clean', () => del(`${buildDir}/**`));
  gulp.task('clean-test', () => del(`${buildTestDir}/**`));

  /* Build and test tasks */

  gulp.task('build', cb => sequence(
    'clean',
    'typecheck',
    'build-src',
    'build-declarations',
    cb
  ));

  gulp.task('test', cb => sequence(
    'clean-test',
    'typecheck',
    'build-test',
    'build-src-test',
    'run-test',
    cb
  ));
}

module.exports = createBuildTasks;
