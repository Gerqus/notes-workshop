const gulp = require('gulp');
const cp = require('child_process');
const eslint = require('gulp-eslint');
const nodemon = require('gulp-nodemon');
const ts = require('gulp-typescript');
const nodeStream = require("stream");

const tsProject = ts.createProject('./tsconfig.json');

const pathFindingRegEx = /(?:from (?:'|")(.+?)(?:'|"))|(?:require\((?:'|")(.+?)(?:'|")\))/;

function getPathToRoot(filePath) {
  const depth = (filePath.match(/\//g) || []).length - 1;
  return '../'.repeat(depth);
}

function replacePaths(projectPaths) {
	if (!projectPaths) {
		throw new Error("ts-paths-resolver", "Project paths must be specified.");
  }
  
  const transformStream = new nodeStream.Transform({
    objectMode: true,
    transform: (file, encoding, callback) => {
      if(file.isDirectory() || file.isStream() || file.isNull() || file.isSymbolic()) {
        callback(null, file);
      } else {
        let fileContents;
        if(file.isBuffer()) {
          fileContents = file.contents.toString('utf8');
        } else {
          fileContents = file.contents;
        }

        const lines = fileContents.split("\n");
        const fileRootPath = file.path.replace(file.base, '');
        lines.forEach((line, lineNumber) => {
          if(pathFindingRegEx.test(line)) {
            Object.keys(projectPaths).forEach(tsPath => {
              const serachedPath = tsPath.replace(/\*+$/, '');
              let targetPath = projectPaths[tsPath][0].replace(/\*+$/, '').replace('src/', '');
              targetPath = getPathToRoot(fileRootPath) + targetPath.replace(/^\.?\//, '');
              targetPath = targetPath.startsWith('..') ? targetPath : `./${targetPath}`;
              lines[lineNumber] = line.replace(serachedPath, targetPath);
            })
          }
        })

        file.contents = new Buffer.from(lines.join("\n"));
        callback(null, file);
      }
    }
  });

  return transformStream;
}

gulp.task('lint:eslint', () => {
  return gulp.src('src/**/*.ts')
    .pipe(eslint('./.eslintrc.json'))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('ts:compile', (done) => {
  return gulp.src('./src/**/*.ts')
    .pipe(tsProject()).js
    .pipe(replacePaths(tsProject.config.compilerOptions.paths))
    .pipe(gulp.dest('./dist'));
});

gulp.task('lint-than-compile', gulp.series('lint:eslint','ts:compile'));

gulp.task('frontend:watch', () => {
  gulp.watch(
    '../frontend/dist/notes-workshop',
    { ignoreInitial: false },
    function copyFrontEndFiles(cb) {
      gulp.src('../frontend/dist/notes-workshop/**/*')
        .pipe(gulp.dest('./static'));
      console.log('Files copied to /static ...')
      cb();
    }
  );
})

gulp.task('run_nodemon_deamon_app', (done) => {
  return nodemon({
    script: './dist/app.js',
    watch: './src/**',
    ext: '*',
    tasks: ['lint-than-compile'],
    delay: 200,
    done
  });
});

gulp.task('watch', gulp.parallel('frontend:watch', gulp.series('lint-than-compile', 'run_nodemon_deamon_app')));