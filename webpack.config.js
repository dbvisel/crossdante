var webpack = require('webpack');

module.exports = {
//  entry: "./src/js/modules/app.js", // can this be an array?
  output: {
//    path: __dirname,
//    filename: "./dist/js/bundle.js"
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/,
				loader: 'babel-loader',
				exclude: /node_modules/,
				options: {
						plugins: ['transform-runtime'],
						presets: ['es2015']
				}
			}
    ],
  },
	devtool: /*dev ? 'eval-cheap-module-source-map' : */ 'source-map',
};
