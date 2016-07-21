import path from 'path';
import fs from 'fs';
import webpack from 'webpack';

const webpackConf = (isServer = false, debug = false) => {

  let config,
    commonConfig = {
      cache: true,
      debug: true,
      devtool: 'source-map',
      output: {
        filename: 'dist/[name].js',
      },
      resolve: {
        extensions: ['', '.js',],
        modulesDirectories: [
          'node_modules',
          'src',
        ],
      },
      module: {
        loaders: [
          {
            test: /\.(js)$/,
            loader: 'babel',
            exclude: [/node_modules/,],
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin({
          DEBUG: debug,
        }),
      ],
    };

  let serverConfig = {
    ...commonConfig,
    externals: fs.readdirSync(path.resolve('node_modules'))
      .map(dir => dir),
    entry: {
      reader: './src/reader.js',
    },
    output: {
      libraryTarget: 'commonjs2',
      filename: 'dist/[name].js',
    },
    target: 'node',

  };

  let clientConfig = {
    ...commonConfig,
    entry: {
      main: './src/index.js',
    },
    externals: [
      'child_process',
    ],
  };

  if (isServer) return serverConfig;

  return clientConfig;

};

export default webpackConf;
