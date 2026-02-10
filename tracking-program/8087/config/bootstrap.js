/**
 * Module dependencies
 */

var Sails = require('sails').constructor;
var stdlib = require('sails-stdlib');
var Moment = require('moment-timezone');


/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.com/config/bootstrap
 */


module.exports.bootstrap = function(cb) {

  // Set the current bootstrap version.
  var bootstrapVersion = 59;

  if (sails.config.skip_bootstrap) {
    return cb();
  }

  // In production, check for required environment, and if it's all there then just return.
  if (process.env.NODE_ENV === 'production' && sails.config.environment !== 'test_prod') {
    if (!_.isString(process.env.S3_BUCKET_NAME)) {
      return cb(new Error('In production, an S3_BUCKET_NAME environment variable must be set!'));
    }
    // We'll handle any data that needs to be bootstrapped in production via migration files.
    return cb();
  }

  var now = new Moment();

  // Get a reference to the default datastore.
  var datastore = sails.getDatastore();

  // Determine whether bootstrap is necessary.
  datastore.leaseConnection(function(db, proceed) {

    // If the "force_bootstrap" config option is set, just run the bootstrap.
    if (sails.config.force_bootstrap) {
      return proceed(undefined, 'bootstrap');
    }

    // First, check if bootstrap table exists.
    datastore.sendNativeQuery('DESCRIBE bootstrap').usingConnection(db).exec(function(err) {
      // No bootstrap table? Run the bootstrap.
      if (err) { return proceed(undefined, 'bootstrap'); }

      // Bootstrap table exists?  Check the version.
      datastore.sendNativeQuery('SELECT * FROM bootstrap').usingConnection(db).exec(function(err, result) {
        if (err) { return proceed(err); }
        // Not the right version?  Run the bootstrap.
        if (!result.rows[0] || result.rows[0].version !== bootstrapVersion) {
          return proceed(undefined, 'bootstrap');
        }
        // Otherwise looks like we're good, so we can skip the boostrap.
        return proceed(undefined, 'skip');
      });

    });
  }, function(err, command) {
    if (err) {return cb(err);}
    if (command === 'skip') {
      console.log();
      console.log('-------------------------------');
      console.log('Using bootstrapped data v' + bootstrapVersion);
      console.log('-------------------------------');
      return cb();
    }
    console.log();
    console.log('------------------------------------');
    console.log('Upgrading to bootstrapped data v' + bootstrapVersion);
    console.log('This may take a few moments...');
    console.log('------------------------------------');
    console.log();

    async.auto({

      migrate: function(cb) {
        sails.log.info(' rebuilding w/ migrate: \'drop\'...');
        var sailsApp = new Sails();
        sailsApp.load({
          models: {
            migrate: 'drop',
          },
          globals: false,
          hooks: {
            webpack: false
          },
          bootstrap: function(cb){cb();}
        }, function(err) {
          if (err) { return cb(err); }
          sailsApp.lower(cb);
        });
      },

      // Add indexes.
      index: ['migrate', function(result, cb) {
        datastore.leaseConnection(function(db, proceed) {
          datastore.sendNativeQuery('CREATE INDEX meter_idx ON meterdata (meter)').usingConnection(db).exec(function(err) {
            if (err) { return proceed(err); }
            datastore.sendNativeQuery('CREATE UNIQUE INDEX uniq_idx ON meterdata (meter, recordedAt)').usingConnection(db).exec(function(err) {
              if (err) { return proceed(err); }
              datastore.sendNativeQuery('CREATE INDEX projday_idx ON meterdataaggregate (project, day)').usingConnection(db).exec(proceed);
            });
          });
        }, cb);
      }],

      // Wipe out all of the DB tables.
      wipe: ['migrate', function(result, cb) {
        sails.log.info(' wiping existing data...');
        datastore.leaseConnection(function(db, proceed) {
          datastore.sendNativeQuery('SHOW TABLES').usingConnection(db).exec(function(err, result) {
            if (err) { return proceed(err); }
            async.each(result.rows, function(row, cb) {
              var tableName = row[_.first(_.keys(row))];
              datastore.sendNativeQuery('TRUNCATE ' + tableName).usingConnection(db).exec(cb);
            }, proceed);
          });
        }, function(err) {
          if (err) { return cb(err); }
          return cb();
        });
      }],

      // Create XECO record.
      xeco: ['wipe', function(result, cb) {
        sails.log.info(' creating XECO record (for storing advanced options)...');
        Xeco.create({
          billingEmail: 'billing@xecoenergy.com',
          billingPhone: '+1 (555) 555.5555',
          address: '352 South 200 West\nSuite 123  #987\nATTN: Arlene Agoncillo',
          city: 'Farmington',
          state: 'UT',
          zip: '84025',
          carbonCreditRate: 11.0,
          xecoManagerCostPercent: 5.0,
        }).exec(function (err) {
          if (err) { return cb(err); }
          return cb();
        });
      }],

      // Create clients.
      client: ['xeco', function(result, cb) {

        sails.log.info(' creating clients...');

        Client.createEach([
          {
            id: 1,
            name: 'Xeco Energy Corporation',
            address: '352 South 200 West',
            city: 'Farmington',
            state: 'UT',
            zip: '84025',
            country: 'US',
            contactName: 'Buck Rogers'
          },
          {
            id: 2,
            name: 'Acme, Inc.',
            address: '123 Industry Lane\nSuite 555',
            city: 'Liberty',
            state: 'TX',
            zip: '71234',
            country: 'US',
            contactName: 'Jim Rich',
            contactTitle: 'President',
            contactPhone: '555-123-4567',
            managerName: 'Jane Boss',
            managerCertificate: 'Some certificate',
            managerPhone: '555-653-1345',
            managerEmail: 'jane.boss@acmeinc.com',

          },
          {
            id: 3,
            name: 'Spacely Sprockets',
            address: '99 Jetsons Way\nPuerto Juarez',
            city: 'Cancun',
            state: 'Q. ROO',
            zip: '77520',
            country: 'Mexico',
            contactName: 'Cosmo Spacely',
            contactTitle: 'CEO',
            contactPhone: '+52 555-444-9999',
            managerName: 'George Jetson',
            managerCertificate: 'Some certificate',
            managerPhone: '555-111-2222',
            managerEmail: 'georgejetson@ssprockets.com',
          },
          {
            id: 4,
            name: 'Cogswell Cogs',
            address: '12 Future Street',
            city: 'New York',
            state: 'NY',
            zip: '10010',
            country: 'US',
            contactName: 'W.C. Cogswell',
            contactTitle: 'CEO',
            contactPhone: '555-112-2233',
            isDeleted: true
          },
        ]).meta({fetch: true}).exec(function(err, clients) {
          if (err) { return cb(err); }
          return cb(undefined, _.indexBy(clients, 'name'));
        });
      }],

      // Create users.
      user: ['client', function(result, cb) {

        sails.log.info(' creating users...');

        User.createEach([
          {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@acmeinc.com',
            resetPasswordToken: 'f4k3t0k3n--1',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            client: result.client['Acme, Inc.'].id,
            // defaultProject: 1
          },
          {
            id: 2,
            firstName: 'Jane',
            lastName: 'Ray',
            email: 'jane.doe@acmeinc.com',
            resetPasswordToken: 'f4k3t0k3n--2',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            client: result.client['Acme, Inc.'].id,
            // defaultProject: 2
          },
          {
            id: 3,
            firstName: 'Ralph',
            lastName: 'Redundant',
            email: 'redundant.ralph@acmeinc.com',
            resetPasswordToken: 'f4k3t0k3n--3',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            client: result.client['Acme, Inc.'].id,
            // defaultProject: 3,
            isDeleted: true
          },
          {
            id: 4,
            firstName: 'Jack',
            lastName: 'Spratt',
            email: 'jackspratt@ssprockets.com',
            resetPasswordToken: 'f4k3t0k3n--4',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            // defaultProject: 7,
            client: result.client['Spacely Sprockets'].id,
          },
          {
            id: 5,
            firstName: 'Mary',
            lastName: 'Moffitt',
            email: 'marymoffitt@ssprockets.com',
            resetPasswordToken: 'f4k3t0k3n--5',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            // defaultProject: 8,
            client: result.client['Spacely Sprockets'].id
          },
          {
            id: 6,
            firstName: 'Fired',
            lastName: 'Spacely',
            email: 'firedspacely@ssprockets.com',
            resetPasswordToken: 'f4k3t0k3n--6',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            client: result.client['Spacely Sprockets'].id,
            // defaultProject: 9,
            isDeleted: true
          },
          {
            id: 7,
            firstName: 'Axed',
            lastName: 'Cogswell',
            email: 'axedcogswell@cogswellcogs.com',
            resetPasswordToken: 'f4k3t0k3n--7',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            client: result.client['Cogswell Cogs'].id,
            role: sails.config.constants.USER_ROLES['CLIENT_USER'],
            // defaultProject: 10,
            isDeleted: 1
          },
          {
            id: 8,
            firstName: 'Xavier',
            lastName: 'Adams',
            email: 'xadams@xecoenergy.com',
            resetPasswordToken: 'f4k3t0k3n--8',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['XECO_USER'],
            // defaultProject: 4,
            client: result.client['Xeco Energy Corporation'].id,
          },
          {
            id: 9,
            firstName: 'Xander',
            lastName: 'Jones',
            email: 'xjones@xecoenergy.com',
            resetPasswordToken: 'f4k3t0k3n--9',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['XECO_ADMIN'],
            // defaultProject: 5,
            client: result.client['Xeco Energy Corporation'].id
          },
          {
            id: 10,
            firstName: 'Xylophone',
            lastName: 'Smith',
            email: 'xsmith@xecoenergy.com',
            resetPasswordToken: 'f4k3t0k3n--10',
            hashedPassword: '$2a$08$3u3zCV16sFAlZH4bZEGOceEkbD8i7SImBUV2AqLmKlYd4dD0ut7aC',
            role: sails.config.constants.USER_ROLES['XECO_ADMIN'],
            client: result.client['Xeco Energy Corporation'].id,
            // defaultProject: 3,
            isDeleted: true
          }
        ]).meta({fetch: true}).exec(function(err, users) {
          if (err) { return cb(err); }
          return cb(undefined, _.indexBy(users, 'email'));
        });

      }],

      // Create projects.
      project: ['user', function(result, cb) {

        sails.log.info(' creating projects...');

        // Note that we generate a random, alphanumeric string which is probabalistically-unique
        // for each project record, to serve as its document share token.
        Project.createEach([

          { id: 1, name: 'Liberty Ice Cream #1', client: result.client['Acme, Inc.'].id, timeZoneId: 'America/Chicago', users: [result.user['john.doe@acmeinc.com'].id, result.user['jane.doe@acmeinc.com'].id, result.user['xadams@xecoenergy.com'].id], documentShareToken: stdlib('strings').random().execSync(), kwPeakSavings: 0.0429, pfSavings: -0.0308, kvarSavings: 0.1659, kvaSavings: 0.0854, kwhSavings: 0.0854, electricBillAnalysis: {'date':1498798800000,'facilitySqFeet':'10000','billReference':'May 2017 Bill','billDate':1496293200000,'accountNumber':'12345','billAmount':'30000','meterNumber':'123','switchGearCount':'1','mainCircuitCount':'5','totalKwh':'1000','daysBilled':'30','kwRatePerTariff':'10.5','kvarTariffRate':'12','tariff':'Electricity company primary voltage > 3MW < 30MW','kwPeak':'4700','customerCharge':'2000','electricCompanyName':'Austin Energy','electricCompanyCountry':'United States','electricCompanyAddress':'1000 Avenue A','electricCompanyCity':'Austin','electricCompanyState':'TX','electricCompanyZip':'78751','lineItems':[{'name':'Electricity Used','type':'KWH','billingRate':'10','meterReading':'1000'},{'name':'Demand','type':'KW','billingRate':'3.45','meterReading':'124'}],'totalSavings':1138.502}},
          { id: 2, name: 'Liberty Ice Cream #2', client: result.client['Acme, Inc.'].id, timeZoneId: 'America/New_York', users: [result.user['john.doe@acmeinc.com'].id], documentShareToken: stdlib('strings').random().execSync() },
          { id: 3, name: 'Liberty Ice Cream #3', client: result.client['Acme, Inc.'].id, timeZoneId: 'America/Mexico_City', users: [result.user['jane.doe@acmeinc.com'].id], documentShareToken: stdlib('strings').random().execSync() },
          { id: 4, name: 'FroYo Palace', client: result.client['Acme, Inc.'].id, timeZoneId: 'Europe/London', users: [result.user['john.doe@acmeinc.com'].id, result.user['xadams@xecoenergy.com'].id], documentShareToken: stdlib('strings').random().execSync() },
          { id: 5, name: 'Liberty Skunkworks', client: result.client['Acme, Inc.'].id, timeZoneId: 'Asia/Dubai', users: [result.user['john.doe@acmeinc.com'].id, result.user['jane.doe@acmeinc.com'].id, result.user['xadams@xecoenergy.com'].id], documentShareToken: stdlib('strings').random().execSync() },
          { id: 6, name: 'Acme Deleted Project', client: result.client['Acme, Inc.'].id, timeZoneId: 'America/Chicago', users: [result.user['john.doe@acmeinc.com'].id, result.user['jane.doe@acmeinc.com'].id, result.user['xadams@xecoenergy.com'].id], isDeleted: true, documentShareToken: stdlib('strings').random().execSync() },

          { id: 7, name: 'Spacely Factory', client: result.client['Spacely Sprockets'].id, timeZoneId: 'America/Chicago', users: [result.user['jackspratt@ssprockets.com'].id, result.user['xadams@xecoenergy.com'].id], documentShareToken: stdlib('strings').random().execSync() },
          { id: 8, name: 'Sprockets HQ', client: result.client['Spacely Sprockets'].id, timeZoneId: 'America/Chicago', users: [result.user['jackspratt@ssprockets.com'].id, result.user['marymoffitt@ssprockets.com'].id], documentShareToken: stdlib('strings').random().execSync() },
          { id: 9, name: 'Sprockets Deleted Project', client: result.client['Spacely Sprockets'].id, timeZoneId: 'America/Chicago', users: [result.user['jackspratt@ssprockets.com'].id, result.user['marymoffitt@ssprockets.com'].id], isDeleted: true, documentShareToken: stdlib('strings').random().execSync() },

          { id: 10, name: 'Cogswell Cogs Deleted Project', client: result.client['Cogswell Cogs'].id, timeZoneId: 'America/Chicago', users: [result.user['axedcogswell@cogswellcogs.com'].id, result.user['xadams@xecoenergy.com'].id], isDeleted: true, documentShareToken: stdlib('strings').random().execSync() }

        ]).meta({fetch: true}).exec(cb);

      }],

      gateway: ['project', function(result, cb) {

        sails.log.info(' creating gateways...');

        Gateway.createEach([

          { id: 1, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 1, name: 'Liberty Bldg 1 Gateway', softwareVersion: 'v1.2.3' },
          { id: 11, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 1, name: 'Liberty Bldg 2 Gateway', softwareVersion: 'v1.2.3' },
          { id: 2, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 2, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 3, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 3, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 4, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 4, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 5, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 5, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 6, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 6, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 7, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 7, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 8, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 8, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 9, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 9, name: 'Gateway', softwareVersion: 'v1.2.3' },
          { id: 10, deviceId: generateMacAddress(), meshId: generateMacAddress(), project: 10, name: 'Gateway', softwareVersion: 'v1.2.3' }

        ]).exec(cb);

      }],

      // Create meters.
      meters: ['project', function(result, cb) {

        sails.log.info('Notice ME!  creating meters...');

        var meterId = 1;
        var time = (new Date()).getTime();

        // Loop through each client.
        async.eachSeries(_.values(result.client), function(client, nextClient) {

          var clientFirstWord = client.name.split(' ')[0];
          var clientMeterNum = 1;
          var clientDeletedMeterNum = 1;

          // Loop through each project in this client.
          var projects = _.where(result.project, {client: client.id});
          async.eachSeries(projects, function(project, nextProject) {

            var data = _.map(_.range(1, 36), function(i) {
              var name;
              if (i <= 30) {
                name = clientFirstWord + ' Meter #' + zeroPad(clientMeterNum++, 3);
              } else {
                name = clientFirstWord + ' Deleted Meter #' + zeroPad(clientDeletedMeterNum++, 3);
              }
              var d = {
                name: name,
                meshId: i === 1 ? '' : generateMacAddress(),
                meterSerialNumber: i === 1 ? '' : generateSerialNo(),
                deviceId: generateMacAddress(),
                isDeleted: i <= 30 ? false : true,
                // hasSwitch: !!(meterId % 40),
                // xecoSwitchedOn: !!(meterId % 20),
                id: meterId++
              };
              [d.lastL1Volt, d.lastL1Amp, d.lastL1Kw, d.lastL1Kva, d.lastL1Pf, d.lastL1Kvar, d.lastL2Volt, d.lastL2Amp, d.lastL2Kw, d.lastL2Kva, d.lastL2Pf, d.lastL2Kvar, d.lastL3Volt, d.lastL3Amp, d.lastL3Kw, d.lastL3Kva, d.lastL3Pf, d.lastL3Kvar, d.lastTotalVolt, d.lastTotalAmp, d.lastTotalKw, d.lastTotalKva, d.lastTotalPf, d.lastTotalKvar] = createMeterRecord();
              d.lastCommunicatedAt = time;
              d.meshLastCommunicatedAt = time;
              d.project = project.id;
              return d;
            });

            Meter.createEach(data).exec(nextProject);

          }, nextClient);

        }, cb);

      }],

      meterData: ['meters', function(result, cb) {

        sails.log.info(' creating meter data...');

        // Get the time 24 hours before the start of the current hour.
        var twentyFourHoursAgo = Moment(now.startOf('hour')).subtract(24, 'hours');
        var startTime = twentyFourHoursAgo.valueOf();

        Meter.find({project: 1, isDeleted: false}).select(['id']).exec(function(err, meters) {
          if (err) {return cb(err);}

          async.eachSeries(meters, function(meter, nextMeter) {

            var data = _.map(_.range(0, 60 * 26), function(i) {
              var hour = Math.floor(i / 60);
              var recordedAt = startTime + (60 * 1000 * i) + _.random(0, 59500);
              var m = (new Moment(recordedAt)).tz('America/Chicago');
              var intervalId = sails.helpers.util.getIntervalFromMoment({ moment: m }).execSync();
              var d = {
                meter: meter.id,
                recordedAt: recordedAt,
                createdAt: recordedAt,
                updatedAt: recordedAt,
                day: m.format('YYYY-MM-DD'),
                minute: m.minute(),
                intervalId: intervalId
              };
              var xecoOn = (hour < 2 || hour > 11 || hour % 2);
              [d.l1Volt, d.l1Amp, d.l1Kw, d.l1Kva, d.l1Pf, d.l1Kvar, d.l2Volt, d.l2Amp, d.l2Kw, d.l2Kva, d.l2Pf, d.l2Kvar, d.l3Volt, d.l3Amp, d.l3Kw, d.l3Kva, d.l3Pf, d.l3Kvar, d.totalVolt, d.totalAmp, d.totalKw, d.totalKva, d.totalPf, d.totalKvar] = createMeterRecord(xecoOn);
              return d;
            });

            MeterData.createEach(data).exec(nextMeter);

          }, cb);

        });

      }],

      meterDataAggregate: ['meterData', function(result, cb) {

        sails.log.info(' creating aggregate data...');

        sails.getActions()['rollup/perform-rollup']({_sails: sails}, {
          ok: function(){ return cb(); },
          serverError: function(err) { return cb(err); }
        });

      }],

      perMeterDataAggregate: ['meterData', function(result, cb) {

        sails.log.info(' creating aggregate data...');

        sails.getActions()['rollup/perform-rollup']({_sails: sails}, {
          ok: function(){ return cb(); },
          serverError: function(err) { return cb(err); }
        });

      }],

      instantaneous: ['meterData', function(result, cb) {

        sails.log.info(' cacheing most recent meter data on project...');

        sails.getActions()['rollup/cache-instantaneous-readings']({_sails: sails, param: function() { return 1; }}, {
          ok: function(){ return cb(); },
          serverError: function(err) { return cb(err); }
        });

      }],

      switchCommand: ['project', 'switches', function(results, cb) {

        sails.log.info(' creating switch commands...');

        Switch.find({ project: 1, isDeleted: false}).exec(function(err, switches) {
          if (err) { return cb(err); }
          SwitchCommand.create({
            project: 1,
            commandType: 3,
            startAt: (new Date()).getTime() - (1000 * 60 * 60 * 10),
            duration: 600,
            interval: 60,
            switches: _.pluck(switches, 'id')
          }).meta({fetch: true}).exec(cb);
        });

      }],

      test: ['switchCommand', function(results, cb) {

        sails.log.info(' creating tests...');
        // Get the time 22 hours before the start of the current hour.
        var twentyTwoHoursAgo = Moment(now.startOf('hour')).subtract(22, 'hours');

        Test.create({
          project: 1,
          startAt: twentyTwoHoursAgo.valueOf(),
          endAt: Moment(twentyTwoHoursAgo).add(10, 'hours').valueOf(),
          duration: 10,
          interval: 1,
          switchCommand: results.switchCommand.id,
          completed: true
        }).meta({fetch: true}).exec(function(err, test) {
          if (err) { return cb(err); }
          SwitchCommand.update({id: results.switchCommand.id}, {test: test.id}).exec(function(err) {
            if (err) { return cb(err); }
            return cb(undefined, test);
          });
        });
      }],

      meterAlertGroups: ['meters', function(result, cb) {

        sails.log.info(' creating meter alert groups...');

        MeterAlertGroup.createEach([
          { alertType: sails.config.constants.METER_ALERT_TYPES.HIGH_DEMAND, threshold: 280, delay: 180, users: [1], project: 1 },
          { alertType: sails.config.constants.METER_ALERT_TYPES.HIGH_DEMAND, threshold: 500, delay: 60, users: [1], project: 1 },
          { alertType: sails.config.constants.METER_ALERT_TYPES.GATEWAY_ERROR, threshold: 600, users: [1], project: 1 },
          { alertType: sails.config.constants.METER_ALERT_TYPES.GATEWAY_ERROR, threshold: 900, users: [1], project: 1 },
        ]).meta({fetch: true}).exec(cb);
      }],

      meterAlerts: ['meterAlertGroups', function(result, cb) {

        sails.log.info(' creating meter alerts...');

        Meter.find({isDeleted: false, project: 1}).select(['id']).exec(function(err, meters) {
          if (err) {return cb(err);}

          async.each(result.meterAlertGroups, function(meterAlertGroup, nextMeterAlertGroup) {
            // Get an array of between 3 and 10 random meter IDs.
            var meterIds = _.map(_.range(1, _.random(3, 10)), function() { return meters[_.random(0, meters.length - 1)].id; });
            // Create a meter alert for each meter.
            var meterAlerts = _.map(meterIds, function(meterId) {
              return {
                meter: meterId,
                group: meterAlertGroup.id
              };
            });
            MeterAlert.createEach(meterAlerts).exec(nextMeterAlertGroup);
          }, cb);

        });
      }],

      meterAlertEvents: ['meterAlerts', function(result, cb) {

        sails.log.info(' creating meter alert events...');

        MeterAlert.find().exec(function(err, meterAlerts) {
          if (err) {return cb(err);}
          // Get a random sampling of meter alert records IDs.
          var meterAlertIds = _.map(_.range(1, 5), function() { return meterAlerts[_.random(1, meterAlerts.length - 1)].id; });
          async.each(meterAlertIds, function(meterAlertId, nextMeterAlertId) {
            var meterAlert = _.find(meterAlerts, {id: meterAlertId});
            var notifiedOn = (new Date()).getTime() - _.random(3600, 360000);
            MeterAlertEvent.create({
              meter: meterAlert.meter,
              alertGroup: meterAlert.group,
              project: 1,
              createdAt: notifiedOn,
              updatedAt: notifiedOn
            }).exec(function(err) {
              if (err) {return nextMeterAlertId(err);}
              MeterAlert.update({id: meterAlertId}, {lastNotificationsSent: notifiedOn}).exec(nextMeterAlertId);
            });
          }, cb);
        });
      }],

      repeaters: ['project', function(result, cb) {

        sails.log.info(' creating repeaters...');

        var deviceId = 1;
        var time = (new Date()).getTime();

        // Loop through each client.
        async.eachSeries(_.values(result.client), function(client, nextClient) {

          var clientFirstWord = client.name.split(' ')[0];
          var clientRepeaterNum = 1;
          var clientDeletedRepeaterNum = 1;

          // Loop through each project in this client.
          var projects = _.where(result.project, {client: client.id});
          async.eachSeries(projects, function(project, nextProject) {

            var data = _.map(_.range(1, 16), function(i) {
              var name;
              if (i <= 10) {
                name = clientFirstWord + ' Repeater #' + zeroPad(clientRepeaterNum++, 3);
              } else {
                name = clientFirstWord + ' Deleted Repeater #' + zeroPad(clientDeletedRepeaterNum++, 3);
              }
              var d = {
                id: deviceId++,
                name: name,
                deviceId: generateMacAddress(),
                meshId: generateMacAddress(),
                isOn: true,
                isDeleted: i <= 10 ? false : true
              };
              d.lastCommunicatedAt = time;
              d.project = project.id;
              return d;
            });

            Repeater.createEach(data).exec(nextProject);

          }, nextClient);

        }, cb);


      }],


      switches: ['project', function(result, cb) {

        sails.log.info(' creating switches...');

        var deviceId = 1;
        var time = (new Date()).getTime();

        // Loop through each client.
        async.eachSeries(_.values(result.client), function(client, nextClient) {

          var clientFirstWord = client.name.split(' ')[0];
          var clientSwitchNum = 1;
          var clientDeletedSwitchNum = 1;

          // Loop through each project in this client.
          var projects = _.where(result.project, {client: client.id});
          async.eachSeries(projects, function(project, nextProject) {

            var data = _.map(_.range(1, 16), function(i) {
              var name;
              if (i <= 10) {
                name = clientFirstWord + ' Switch #' + zeroPad(clientSwitchNum++, 3);
              } else {
                name = clientFirstWord + ' Deleted Switch #' + zeroPad(clientDeletedSwitchNum++, 3);
              }
              var d = {
                id: deviceId++,
                name: name,
                deviceId: generateMacAddress(),
                meshId: generateMacAddress(),
                isOn: true,
                deviceType: 1,
                isDeleted: i <= 10 ? false : true
              };
              d.lastCommunicatedAt = time;
              d.meshLastCommunicatedAt = time;
              d.project = project.id;
              return d;
            });

            Switch.createEach(data).exec(nextProject);

          }, nextClient);

        }, cb);


      }]

    },

    function doneWithBootstrap(err) {
      if (err) {return cb(err);}
      // Create the bootstrap table.
      datastore.leaseConnection(function(db, proceed) {
        datastore.sendNativeQuery('CREATE TABLE IF NOT EXISTS bootstrap (version int)').usingConnection(db).exec(function(err) {
          if (err) { return proceed(err); }
          datastore.sendNativeQuery('TRUNCATE bootstrap').usingConnection(db).exec(function(err) {
            if (err) { return proceed(err); }
            datastore.sendNativeQuery('INSERT INTO bootstrap values (' + bootstrapVersion + ')').usingConnection(db).exec(proceed);
          });
        });
      }, cb);

    });

  });

};

function createMeterRecord(xeco) {
  var phases = [
    _.random(264000, 268000) / 1000, // l1Volt
    _.random(370000, 470000) / 1000, // l1Amp
    _.random( 75000, 115000) / 1000, // l1Kw
    (_.random( 95000, 130000) * (xeco ? 0.95 : 1)) / 1000, // l1Kva,
    (_.random( 70, 90) * (xeco ? 1 : 0.96)), // l1Pf,
    (_.random( 50000, 70000) * (xeco ? 0.8 : 1)) / 1000, // l1Kvar,

    _.random(264000, 268000) / 1000, // l2Volt
    _.random(370000, 470000) / 1000, // l2Amp
    _.random( 75000, 115000) / 1000, // l2Kw
    (_.random( 95000, 130000) * (xeco ? 0.95 : 1)) / 1000, // l2Kva,
    (_.random( 70, 90) * (xeco ? 1 : 0.96)), // l2Pf,
    (_.random( 50000, 70000) * (xeco ? 0.8 : 1)) / 1000, // l2Kvar,

    _.random(264000, 268000) / 1000, // l3Volt
    _.random(370000, 470000) / 1000, // l3Amp
    _.random( 75000, 115000) / 1000, // l3Kw
    (_.random( 95000, 130000) * (xeco ? 0.95 : 1)) / 1000, // l3Kva,
    (_.random( 70, 90) * (xeco ? 1 : 0.96)), // l3Pf,
    (_.random( 50000, 70000) * (xeco ? 0.8 : 1)) / 1000, // l3Kvar,
  ];

  var record = phases.concat([
    (phases[0] + phases[6] + phases[12]) / 3, // totalVolt,
    (phases[1] + phases[7] + phases[13]) / 3, // totalAmp,
    (phases[2] + phases[8] + phases[14]), // totalKw,
    (phases[3] + phases[9] + phases[15]), // totalKva,
    (phases[4] + phases[10] + phases[16]) / 3, // totalPf,
    (phases[5] + phases[11] + phases[17]) / 3, // totalKvar,
  ]);

  return record;

}

function zeroPad(num, places) {
  var zero = places - num.toString().length + 1;
  return Array(+(zero > 0 && zero)).join('0') + num;
}

function generateMacAddress() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, function() {
    return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
  });
}

function generateSerialNo() {
  return 'p37XXXXXXXXXX'.replace(/X/g, function() {
    return '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16));
  });
}
