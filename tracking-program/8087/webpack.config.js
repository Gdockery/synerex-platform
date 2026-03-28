/**
 * Module dependencies
 */

var path = require('path');
var webpack = require('webpack');
var webpackMerge = require('webpack-merge');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var UglifyJsPlugin = require('uglifyjs-webpack-plugin');
var WatchLiveReloadPlugin = require('webpack-watch-livereload-plugin');

/**
 * A basic Webpack config to use with a Sails app.
 *
 * This config is used by the api/hooks/webpack hook which initializes a
 * Webpack compiler in "watch" mode.
 *
 * See https://webpack.js.org/configuration for a full guide to Webpack config.
 *
 */
var webpackConfig = {

  /***************************************************************************
  *                                                                          *
  * Create one item in the `entry` dictionary for each page in your app.     *
  *                                                                          *
  ***************************************************************************/
  entry: {
    'main': './src/main.browser.ts'
  },


  /***************************************************************************
  *                                                                          *
  * Output bundled .js files with a `.bundle.js` extension into              *
  * the `.tmp/public/js` directory                                           *
  *                                                                          *
  ***************************************************************************/
  output: {
    filename: 'js/[name].bundle.js',
    path: path.resolve(__dirname, '.tmp', 'public'),
    publicPath: '/tracking/',
    sourceMapFilename: 'js/[name].map',
    chunkFilename: 'js/[id].chunk.js'
  },

  /***************************************************************************
  *                                                                          *
  * Set up a couple of rules for processing .css and .less files. These will *
  * be extracted into their own bundles when they're imported in a           *
  * JavaScript file.                                                         *
  *                                                                          *
  ***************************************************************************/
  module: {
    rules: [
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader',
          'angular2-template-loader',
          'angular-router-loader'
        ]
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.scss$/,
        exclude: /node_modules/,
        use: [
          'raw-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass')
            }
          }
        ] // sass-loader not scss-loader
      },
      { test: /\.css$/, loaders: ['to-string-loader', 'css-loader'] },
      { test: /\.html$/, loader: 'raw-loader' },
      {
        test   : /\.(ttf|eot|svg|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        loader: 'url?limit=10000'
      }
    ]
  },

  /***************************************************************************
  *                                                                          *
  * Set up some plugins to help with Sails development using Webpack.        *
  *                                                                          *
  ***************************************************************************/
  plugins: [

    // This plugin cleans out your .tmp/public folder before lifting.
    new CleanWebpackPlugin(['public'], {
      root: path.resolve(__dirname, '.tmp'),
      verbose: true,
      dry: false
    }),

    // This plugin copies the `images` and `fonts` folders into
    // the .tmp/public folder.  You can add any other static asset
    // folders to this list and they'll be copied as well.
    new CopyWebpackPlugin([
      {
        from: './assets/images',
        to: path.resolve(__dirname, '.tmp', 'public', 'images')
      },
      {
        from: './assets/fonts',
        to: path.resolve(__dirname, '.tmp', 'public', 'fonts')
      },
      {
        from: './assets/css',
        to: path.resolve(__dirname, '.tmp', 'public', 'css')
      },
      {
        from: './assets/scripts',
        to: path.resolve(__dirname, '.tmp', 'public', 'scripts')
      }
    ]),

    new webpack.ContextReplacementPlugin(
      /angular(\\|\/)core(\\|\/)@angular/,
      path.resolve(__dirname, 'src')
    ),

    // Embed NODE_ENV so Angular's enableProdMode() check works in the browser bundle
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),

  ]

};

if (process.env.NODE_ENV !== 'production') {
  webpackConfig.plugins.push(new WatchLiveReloadPlugin({
    files: [
      // Livereload when webpack compiles JS
      './.tmp/**/*.js'
    ]
  }));
}

if (process.env.NODE_ENV === 'production') {
  // Use uglifyjs-webpack-plugin (supports ES6); built-in UglifyJsPlugin only handles ES5
  webpackConfig.plugins.push(new UglifyJsPlugin({
    uglifyOptions: { ecma: 6 },
    sourceMap: true
  }));
  // Split vendor chunk so it can be cached separately (Angular, rxjs, etc.)
  webpackConfig.plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    minChunks: function (module) {
      return module.context && module.context.indexOf('node_modules') !== -1;
    }
  }));
}

// Our Webpack Defaults
var defaultConfig = {
  devtool: 'source-map',

  resolve: {
    extensions: [ '.ts', '.js' ],
    modules: [ path.resolve(__dirname, 'node_modules') ]
  },

  devServer: {
    historyApiFallback: true,
    watchOptions: { aggregateTimeout: 300/*, poll: 1000*/ },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
  },

  node: {
    global: true,
    crypto: 'empty',
    __dirname: true,
    __filename: true,
    process: true,
    Buffer: false,
    clearImmediate: false,
    setImmediate: false
  }
};


module.exports = webpackMerge(defaultConfig, webpackConfig);
