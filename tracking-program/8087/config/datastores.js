/**
 * Datastores
 * (sails.config.datastores)
 *
 * A set of datastore configurations which tell Sails where to fetch or save
 * data when you execute built-in model methods like `.find()` and `.create()`.
 *
 *  > This file is mainly useful for configuring your development database,
 *  > as well as any additional one-off databases used by individual models.
 *  > Ready to go live?  Head towards `config/env/production.js`.
 *
 * For more information on configuring datastores, check out:
 * http://sailsjs.com/config/datastores
 */

module.exports.datastores = {


  /***************************************************************************
  *                                                                          *
  * Your app's default datastore.                                            *
  *                                                                          *
  * Using MySQL for the Tracking Program database                            *
  *                                                                          *
  ***************************************************************************/

  default: {
    // MySQL configuration for Tracking Program (using mysql2 for MySQL 8 compatibility)
    adapter: 'sails-mysql2',
    url: process.env.TRACKING_DB_URL
  }

  /*
  // File-based storage option (for development without MySQL)
  default: {
    adapter: 'sails-disk',
    dir: '.data/tracking-db'
  }
  */

};
