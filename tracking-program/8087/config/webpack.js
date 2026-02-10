if (process.env.NODE_ENV !== 'production' && process.env.sails_environment !== 'test_prod') {
  module.exports.webpack = require('../webpack.config');
}
