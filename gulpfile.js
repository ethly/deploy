'use strict';

/**
  Create tasks for build

  @param gulp         The gulp object, related to the project
  @param srcDir       The path of the directory with sources
  @param buildDir     The patj of the output directory
  @param buildTestDir The path of the output directory for tests
*/
function createBuildTasks(gulp, srcDir, buildDir, buildTestDir) {

  const babel = require('gulp-babel');
  const del = require('del');
  const execFile = require('child_process').execFile;
  const eslint = require('gulp-eslint')
  const flow = require('flow-bin');
  const jasmine = require('gulp-jasmine');
  const lazypipe = require('lazypipe');
  const rename = require('gulp-rename');
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
    gulp.task(taskName, () => gulp.src(from)
      .pipe(lint(eslintConfig)())
      .pipe(babel({
        presets: ["env"],
        plugins: [
          "transform-flow-strip-types",
          ["module-resolver", {
            root: [`./${srcDir}`],
          }],
        ],
      }))
      .pipe(gulp.dest(to))
    );
  }

  /* Tasks for Type Checking */

  gulp.task('typecheck', cb => {
    execFile(flow, [], (err, stdout) => {
      console.log(stdout);
      cb(err);
    });
  });

  gulp.task('lint', () => {
    const fixConfig = Object.assign({}, eslintConfig, { fix: true });
    return gulp.src([
        `${srcDir}/**/*.js`
      ])
      .pipe(lint(fixConfig)())
      .pipe(gulp.dest(srcDir))
  });

  /* JS processing */

  // Exclude tests
  const jsFiles = [`${srcDir}/**/*.js`, `!${srcDir}/**/__tests__/**/*.js`];
  createProcessJSTask(
    'build-src',
    jsFiles,
    buildDir
  );

  createProcessJSTask('build-test', `${srcDir}/**/*.js`, buildTestDir);

  gulp.task('copy-flow', () => gulp.src(jsFiles)
    .pipe(rename({
      extname: '.js.flow',
    }))
    .pipe(gulp.dest(buildDir))
  );

  /* Test start */

  gulp.task('run-test', () => gulp.src(`${buildTestDir}/**/__tests__/**/*.js`)
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
    'copy-flow',
    cb
  ));

  gulp.task('test', cb => sequence(
    'clean-test',
    'typecheck',
    'build-test',
    'run-test',
    cb
  ));
}

module.exports = createBuildTasks;
