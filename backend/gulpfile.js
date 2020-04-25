const gulp = require('gulp');
const cp = require('child_process');
const eslint = require('gulp-eslint');
const nodemon = require('gulp-nodemon');

gulp.task('lint:eslint', () => {
  return gulp.src('src/**/*.ts')
    .pipe(eslint('./.eslintrc.json'))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('ts:compile', (done) => {
  try {
    cp.spawnSync('tsc', { stdio: 'inherit' });
  } catch {
    console.log('TypeScript compilation failed. Will try again on file change.');
  }
  done();
});

gulp.task('lint-than-compile', gulp.series('lint:eslint','ts:compile'));

gulp.task('run_nodemon_deamon_app', () => {
  return nodemon({
    script: './dist/app.js',
    watch: './src/**',
    ext: '*',
    tasks: ['lint-than-compile'],
  });
});

gulp.task('watch', gulp.series('lint-than-compile', 'run_nodemon_deamon_app'));
