// gulpfile.js
//
// following https://css-tricks.com/gulp-for-beginners/

var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var minifyCSS = require('gulp-minify-css');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var autoprefixer = require('gulp-autoprefixer');
var coffee = require('gulp-coffee');

gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app',
      index: "index2.html"

    },
  });
});

gulp.task('useref', function(){
  var assets = useref.assets();

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', minifyCSS()))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest('dist'));
});

gulp.task('sass', function(){
  return gulp.src('app/scss/*.scss')
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', sass.logError))
    .pipe(autoprefixer({browsers: ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1'],cascade:false}))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }));
});

gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*')
  .pipe(gulp.dest('dist/fonts'));
});

gulp.task('coffee', function() {
  gulp.src('app/coffee/*.coffee')
    .pipe(coffee({bare: true})) // this is to get rid of closure on individual files!
    .pipe(gulp.dest('app/js'));
});

gulp.task('lint', function() {
  return gulp.src(['./*.js','app/js/*.js','app/js/translations/*.js'])
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

gulp.task('clean', function(callback) {
  del('dist');
  return cache.clearAll(callback);
});

gulp.task('clean:dist', function(callback){
  del(['dist/**/*', '!dist/images', '!dist/images/**/*'], callback);
});

gulp.task('watch', ['browserSync', 'sass'], function (){
  gulp.watch('app/scss/*.scss', ['sass']);
  gulp.watch('app/coffee/*.coffee', ['coffee']);
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/js/*.js', ['lint', browserSync.reload]);
});

gulp.task('build', function (callback) {
  runSequence('clean:dist',
    ['sass', 'useref', 'fonts'],
    callback
  );
});

gulp.task('default', function (callback) {
  runSequence(['sass','browserSync', 'watch'],
    callback
  );
});

// this doesn't copy fonts/ n

gulp.task('cordovabuild', function(){
  var assets = useref.assets();
  return gulp.src('app-cordova/*.html')
    .pipe(assets)
    .pipe(gulpIf('*.js', uglify()))
    .pipe(gulpIf('*.css', minifyCSS()))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest('crossdante/www'));
});
