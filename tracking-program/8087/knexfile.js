// Update with your config settings.
var datastores = require('./config/datastores').datastores;
var developmentConfig = require('./config/env/development');
var stagingConfig = require('./config/env/staging');
module.exports = {

  development: {
    client: 'mysql',
    connection: developmentConfig.datastores.default.url,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations'
    }
  },

  staging: {
    client: 'mysql',
    connection: stagingConfig.datastores.default.url,
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './db/migrations'
    }
  }

};
