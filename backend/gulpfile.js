const gulp = require('gulp');
const cp = require('child_process');
const eslint = require('gulp-eslint');
const nodemon = require('gulp-nodemon');
const ts = require('gulp-typescript');
const nodeStream = require("stream");
const EventEmitter = require('events');

const tsProject = ts.createProject('./tsconfig.json');
const readiness = {
  types: new EventEmitter(),
  fe:  new EventEmitter(),
  be:  new EventEmitter(),
};

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

gulp.task('backend:compile', () => {
  return gulp.src('./src/**/*.ts')
    .pipe(tsProject()).js
    .pipe(replacePaths(tsProject.config.compilerOptions.paths))
    .pipe(gulp.dest('./dist'))
});

gulp.task('backend:watch', function() {
  return gulp.watch(
    ['./src/**/*.ts', '../types/lib/**'],
    { ignoreInitial: false },
    gulp.series('lint:eslint','backend:compile', async function signalReadiness() { readiness.be.emit('ready') })
  );
});

gulp.task('frontend:copy', () => {
  return gulp.src('../frontend/dist/notes-workshop/**/*')
    .pipe(gulp.dest('./static'));
});

gulp.task('frontend:watch', () => {
  return gulp.watch(
    '../frontend/dist/notes-workshop/**',
    { ignoreInitial: false },
    gulp.series('frontend:copy', async function signalReadiness() { readiness.fe.emit('ready') })
  );
});

gulp.task('frontend:watch:passive', () => {
  readiness.fe.emit('ready');
  return gulp.watch(
    '../frontend/dist/notes-workshop/**',
    { ignoreInitial: false },
    function feLogger() { console.log('Frontend files updated') }
  );
});

gulp.task('types:build', (done) => {
  cp.execSync('npm run build', {
    cwd: '../types'
  });
  done();
});

gulp.task('types:watch', () => {
  return gulp.watch(
    '../types/src/**',
    { ignoreInitial: false },
    gulp.series('types:build', async function signalReadiness() { readiness.types.emit('ready') })
  );
});

gulp.task('run_nodemon_deamon_app', (done) => {
  return nodemon({
    script: './dist/app.js',
    watch: './dist/**',
    ext: '*',
    delay: 200,
    done
  });
});

gulp.task('default', function () {
  readiness.types.once('ready', () => console.log('Types watcher ready...'));
  readiness.types.once('ready', gulp.parallel('frontend:watch:passive', 'backend:watch'));
  const feReady = new Promise(resolve => {
    readiness.fe.once('ready', () => {
      console.log('Front-end watcher ready...');
      resolve();
    })
  });
  const beReady = new Promise(resolve => {
    readiness.be.once('ready', () => {
      console.log('Back-end watcher ready...');
      resolve();
    })
  });
  
  Promise.all([feReady, beReady])
    .then(() => {
      console.log('Starting Nodemon with server!');
      gulp.series('run_nodemon_deamon_app')();
    });

  gulp.parallel('types:watch')();
});