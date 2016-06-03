import webpack from 'webpack';
import gulp from 'gulp';
import livereload from 'gulp-livereload';
import webpackConfig from './webpack.config';
import showStats from './showStats';


gulp.task('watchServer', () => {

  let conf = webpackConfig(true);

  webpack(conf).watch(100, (err, stats) => {

    showStats(err, stats);

  });

});

gulp.task('watchClient', () => {

  let conf = webpackConfig();

  livereload.listen({
    port: 35729,
  });

  webpack(conf).watch(100, (err, stats) => {

    showStats(err, stats);

    livereload.changed('reloaded');

  });

});

gulp.task('watch', ['watchClient', 'watchServer']);
