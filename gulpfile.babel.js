import webpack from 'webpack';
import gulp from 'gulp';
import livereload from 'gulp-livereload';
import webpackConfig from './webpack.config';
import showStats from './showStats';
import server from 'gulp-webserver';


gulp.task('watchServer', () => {

  let conf = webpackConfig(true, true);

  webpack(conf).watch(100, (err, stats) => {

    showStats(err, stats);

  });

});

gulp.task('watchClient', () => {

  let conf = webpackConfig(false, true);

  gulp.src('./dist')
    .pipe(server({
      directoryListing: {
        enable: true,
        path: './dist',
      },
      host: '127.0.0.1',
      port: 3000,
    }));

  livereload.listen({
    port: 35729,
  });

  webpack(conf).watch(100, (err, stats) => {

    showStats(err, stats);

    livereload.changed('reloaded');

  });

});

gulp.task('buildServer', () => {

  let conf = webpackConfig(true, false);

  webpack(conf, (err, stats) => {

    showStats(err, stats);

  });

});

gulp.task('buildClient', () => {

  let conf = webpackConfig(false, false);

  webpack(conf, (err, stats) => {

    showStats(err, stats);

  });

});

gulp.task('watch', ['watchClient', 'watchServer']);
gulp.task('build', ['buildClient', 'buildServer']);
