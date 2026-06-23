var exec = require('child_process').exec;
var Sails = require('sails').constructor;
var stdlib = require('sails-stdlib');
var prompt = require('prompt');
var Moment = require('moment-timezone');
var mysql = require('mysql');
var async = require('async');

// Start the prompt
prompt.start();
prompt.message = '';

// Get the URL of the database to set up.
//
prompt.get({
  properties: {
    dbUrl: {
      description: 'Enter the full URL of the database to use',
      message: 'Please enter a valid database URL.',
      type: 'string',
      required: true
    },
    confirm: {
      description: 'This database will be destroyed if it exists!  Type "yes" to confirm',
      message: 'Please type "yes" to confirm or "no" to cancel.',
      type: 'string',
      pattern: /^(yes|no)$/,
      required: true
    }
  }
}, function (err, result) {

  if (err) { process.exit(1); }
  if (result.confirm !== 'yes') { process.exit(0); }

  var dbUrl = result.dbUrl;
  var dbName;
  var dbHost;
  [,dbHost,dbName]=Array.prototype.slice.call(dbUrl.match(/^(.*)\/(.+)$/));
  var connection = mysql.createConnection(dbHost + '/');
  connection.query('DROP DATABASE IF EXISTS `' + dbName + '`', function(err) {
    if (err) {
      console.error('Error dropping database `' + dbName + '`:');
      console.error(err);
      process.exit(1);
    }
    connection.query('CREATE DATABASE `' + dbName + '`', function(err) {
      if (err) {
        console.error('Error creating database `' + dbName + '`:');
        console.error(err);
        process.exit(1);
      }

      var sailsApp = new Sails();
      sailsApp.load({
        models: {
          migrate: 'alter',
        },
        hooks: {
          webpack: false,
        },
        datastores: {
          default: {
            url: dbUrl
          }
        },
        bootstrap: function(cb){cb();}
      }, function(err) {
        if (err) {
          console.error('Error loading Sails:');
          console.error(err);
          process.exit(1);
        }

        var datastore = sails.getDatastore();

        datastore.leaseConnection(function(db, proceed) {

          async.auto({

            meterdata__meter_idx: function(cb) {

              datastore.sendNativeQuery('CREATE INDEX meter_idx ON meterdata (meter)').usingConnection(db).exec(cb);

            },

            meterdata__uniq_idx: function(cb) {

              datastore.sendNativeQuery('CREATE UNIQUE INDEX uniq_idx ON meterdata (meter, recordedAt)').usingConnection(db).exec(cb);

            },

            meterdataaggregate__projday_idx: function(cb) {

              datastore.sendNativeQuery('CREATE INDEX projday_idx ON meterdataaggregate (project, day)').usingConnection(db).exec(cb);

            },

            synerex: function(cb) {
              sails.log.info(' creating SYNEREX record (for storing advanced options)...');
              Synerex.create({
                billingEmail: 'billing@xecoenergy.com',
                billingPhone: '+1 (555) 555.5555',
                address: '352 South 200 West\nSuite 123  #987\nATTN: Arlene Agoncillo',
                city: 'Farmington',
                state: 'UT',
                zip: '84025',
                carbonCreditRate: 11.0,
                xecoManagerCostPercent: 5.0,
              }).exec(function (err) {
                if (err) {
                  console.error('Error creating SYNEREX record:');
                  console.error(err);
                }
                return cb(err);
              });
            },

            // Create clients.
            client: function(cb) {

              sails.log.info(' creating SYNEREX client...');

              Client.create(
                {
                  id: 1,
                  name: 'Synerex Labs',
                  address: '352 South 200 West',
                  city: 'Farmington',
                  state: 'UT',
                  zip: '84025',
                  country: 'US',
                  contactName: 'Buck Rogers'
                }
              ).exec(function(err) {
                if (err) {
                  console.error('Error creating client record:');
                  console.error(err);
                }
                return cb(err);
              });

            },

            users: ['client', function(result, cb) {

              sails.log.info(' creating users...');

              User.createEach([
                {
                  id: 1,
                  firstName: 'Greg',
                  lastName: 'Dockery',
                  email: 'greg.dockery@xecoenergy.com',
                  resetPasswordToken: 'f4k3t0k3n--1',
                  hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
                  role: sails.config.constants.USER_ROLES['XECO_ADMIN'],
                  client: 1,
                },
                {
                  id: 2,
                  firstName: 'Landon',
                  lastName: 'Dockery',
                  email: 'landon.dockery@xecoenergy.com',
                  resetPasswordToken: 'f4k3t0k3n--2',
                  hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
                  role: sails.config.constants.USER_ROLES['XECO_ADMIN'],
                  client: 1,
                },
                {
                  id: 3,
                  firstName: 'Enola',
                  lastName: 'Labs',
                  email: 'marcus.turner@enolalabs.com',
                  resetPasswordToken: 'f4k3t0k3n--3',
                  hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
                  role: sails.config.constants.USER_ROLES['XECO_ADMIN'],
                  client: 1,
                },
                {
                  id: 4,
                  firstName: 'Sails',
                  lastName: 'Company',
                  email: 'sailsco@enolalabs.com',
                  resetPasswordToken: 'f4k3t0k3n--3',
                  hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
                  role: sails.config.constants.USER_ROLES['XECO_ADMIN'],
                  client: 1,
                }
              ]).meta({fetch: true}).exec(function(err, users) {
                if (err) {
                  console.error('Error creating users:');
                  console.error(err);
                }
                return cb(err);
              });

            }],

          }, proceed);

        }, function(err) {
          if (!err) {
            console.log('DB created successfully.');
          }
          sailsApp.lower(function() {
            var parsedUrl = require('url').parse(dbUrl);
            var user;
            var pass;
            [user, pass] = parsedUrl.auth.split(':');
            var cmd = 'mysqldump -h ' + parsedUrl.hostname + ' -P ' + parsedUrl.port + ' -u ' + user + ' -p' + pass + ' --add-drop-database --databases ' + dbName + ' > ' + dbName + '.sql';
            console.log('Dumping: ', cmd);
            exec(cmd, function(err, stdout, stderr) {
              if (err) {
                console.error('Error occurred outputting db dump:');
                console.error(stderr);
                process.exit(1);
              }
              process.exit(0);
            });

          });
        });

      });

    });
  });
});

