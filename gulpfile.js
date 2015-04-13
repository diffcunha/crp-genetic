var gulp = require('gulp');
var git = require('gulp-git');
var bump = require('gulp-bump');
var clean = require('gulp-clean');
var rename = require('gulp-rename');
var template = require('gulp-template');
var defineModule = require('gulp-define-module');

gulp.task('clean', function () {
  return gulp.src('lib', { read: false })
    .pipe(clean());
});

gulp.task('copy', ['clean'], function() {
  return gulp.src(['src/index.js'])
    .pipe(gulp.dest('lib'));
})

gulp.task('build', ['clean', 'copy'], function() {
  return gulp.src(['src/run.jst'])
    .pipe(template.precompile())
    .pipe(defineModule('commonjs'))
    .pipe(rename({ extname: '.js' }))
    .pipe(gulp.dest('lib'));
});


gulp.task('test', ['build'], function() {

});

gulp.task('dist', ['build', 'test'], function() {

});


// Release

gulp.task('bump', ['dist'], function() {
  return gulp.src('./package.json')
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('tag', ['bump'], function() {
  var pkg = require('./package.json');
  var v = 'v' + pkg.version;
  var message = 'Release ' + v;

  return gulp.src('./')
    .pipe(git.commit(message))
    .pipe(git.tag(v, message))
    .pipe(git.push('origin', 'master', '--tags'))
    .pipe(gulp.dest('./'));
});

gulp.task('npm', ['tag'], function(done) {
  require('child_process').spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('publish', ['build', 'test']);

// General

gulp.task('default', ['build']);