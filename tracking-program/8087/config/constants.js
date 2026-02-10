module.exports.constants = {

  DEFAULT_PAGE_SIZE: 10,

  DEVICE_TYPES: {
    'XECO_UNIT': 1
  },

  USER_ROLES: {
    'CLIENT_USER': 1,
    'CLIENT_ADMIN': 2,
    'CLIENT_MANAGER': 3,
    'ACCOUNT_MANAGER': 7,
    'XECO_USER': 4,
    'XECO_ADMIN': 8
  },

  METER_ALERT_TYPES: {
    'HIGH_DEMAND': 1,
    'GATEWAY_ERROR': 2
  },

  METER_CSV_TYPES: {
    'UNOCCUPIED_ENERGY': 1,
    '15_MINUTE': 2,
    'DETAILED_METER': 3
  },

  REPEATER_ALERT_TYPES: {
    'GATEWAY_ERROR': 1
  },

  SWITCH_ALERT_TYPES: {
    'GATEWAY_ERROR': 1
  },

  SWITCH_COMMAND_TYPES: {
    'POWER_ON': 1,
    'POWER_OFF': 2
  },

  GATEWAY_COMMAND_TYPES: {
    'POWER_ON': 1,
    'POWER_OFF': 2,
    'POWER_TEST': 3
  },

  SERVICE_PLAN_TYPES: {
    LAN: 'lan',
    CLOUD: 'cloud',
    OEM: 'OEM',
  },

  SERVICE_PLAN_NAMES: {
    'lan': "Xeco Server (LAN/VPN) + Cloud",
    'cloud': "Xeco Cloud Only",
    'oem': "Xeco Server / OEM Software"
  },

  SERVICE_PLAN_PRICES: {
    'lan': {
      server: 1,
      gateways: 17,
      meters: 40,
      switches: 5,
      repeaters: 2,
      upgrades: 'Free',
      maintenance: 'Free',
      users: 'Free (Max. 5)',
      addlUsers: 10,
      support: 85
    },
    'cloud': {
      server: 'Not Included',
      gateways: 17,
      meters: 62,
      switches: 27,
      repeaters: 5,
      upgrades: 'Free',
      maintenance: 'Free',
      users: 'Free (Max. 5)',
      addlUsers: 10,
      support: 85
    },
    'oem': {
      server: 99,
      gateways: 17,
      meters: 62,
      switches: 'Not Included',
      repeaters: 'Not Included',
      upgrades: 'Not Included',
      maintenance: 'Limited Support',
      users: 'Not Included',
      addlUsers: 'Not Included',
      support: 85
    }
  },

  PAGINATION_INPUTS: {

    page: {
      description: 'Page number to retrieve.',
      extendedDescription: 'If unspecified, the first page of records will be returned.',
      example: 1
    },

    pageSize: {
      description: 'The number of records to retrieve per page.',
      extendedDescription: 'If unspecified, the default configured page size will be used.',
      example: 30,
      defaultsTo: 500
    },

    orderBy: {
      description: 'Attribute to sort results by.',
      example: 'month'
    },

    orderDirection: {
      description: 'Direction to sort the results ("ASC" or "DESC").',
      example: 'DESC',
      defaultsTo: 'DESC'
    }

  },

  // Note that this is a distinct ratio from the `carbonCreditRate` stored in the Xeco model.
  CARBON_EMISSIONS_RATIO: (0.7054/1000),
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  // FUTURE: maybe move this into the `Xeco` model like the other ratio
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

  getPaginationSuccessExit: function(patternExemplar){
    return {
      outputFriendlyName: 'Report',
      outputDescription: 'A report consisting of `meta` (a dictionary w/ more info) and `response` (an array of records).',
      outputExample: {
        meta: { page: 1, total: 33 },
        response: [
          patternExemplar||{}
        ]
      }
    };
  },

  buildFindOneAction: function(modelIdentity){
    return {
      friendlyName: 'Find one ('+modelIdentity+')',
      description: 'Get details about the specified record.',
      extendedDescription: 'Note that this action returns even a "soft-deleted" record.',
      inputs: {
        id: { description: 'The ID of the record to look up.', example: 123, required: true }
      },
      exits: {
        success: { outputExample: { meta: {}, response: {} } },
        notFound: { statusCode: 404 },
        badRequest: { statusCode: 400 },
      },
      fn: function(inputs, exits) {
        var WLModel = sails.models[modelIdentity];
        WLModel.findOne({ id: inputs.id })
        .exec(function(err, record){
          if (err) { return exits.error(err); }
          if (!record) { return exits.notFound(); }

          return exits.success({
            response: record
          });
        });
      }
    };
  },

  buildDestroyAction: function(modelIdentity) {
    return {
      friendlyName: 'Destroy',
      description: 'Destroy (soft-delete) the specified '+modelIdentity+' record.',
      inputs: {
        id: { description: 'The ID of this '+modelIdentity+'.', example: 123, required: true },
      },
      exits: {
        success: { statusCode: 200 },
        notFound: { statusCode: 404 },
        badRequest: { statusCode: 400 },
      },
      fn: function (inputs, exits) {
        var WLModel = sails.models[modelIdentity];
        sails.helpers.web.softDestroy({ model: WLModel, id: inputs.id }).exec({
          error: function(err){ return exits.error(err); },
          notFound: function(){ return exits.notFound(); },
          success: function(){ return exits.success(); },
        });
      }
    };
  },

  buildCreateAction: function(modelIdentity, opts) {
    opts = opts || {};

    // Use a reasonable default for the blacklist, if neither `whitelist` nor `blacklist` is specified.
    if (_.isUndefined(opts.blacklist) && _.isUndefined(opts.whitelist)) {
      opts.blacklist = ['id','createdAt','updatedAt','isDeleted'];
    }
    if (opts.blacklist && opts.whitelist) {
      throw new Error('Can\'t use both `blacklist` AND `whitelist` (please use one or the other)');
    }

    // If no `before` LC was specified, build a no-op for it.
    if (_.isUndefined(opts.before)) {
      opts.before = function(inputs, proceed){ return proceed(); };
    }

    return {
      friendlyName: 'Create',
      description: 'Create '+modelIdentity+'.',
      inputs: {
        valuesToSet: { description: 'A dictionary of new values.', example: {}, required: true }
      },
      exits: {
        success: {
          outputExample: { meta: {}, response: { id: 123 } }
        },
        badRequest: { statusCode: 400 },
        conflict: { statusCode: 409 }
      },
      fn: function (inputs, exits) {

        var WLModel = sails.models[modelIdentity];

        if (opts.blacklist) {
          var reservedKeys = _.intersection(_.keys(inputs.valuesToSet), opts.blacklist);
          if (reservedKeys.length > 0) {
            return exits.badRequest(new Error(
              'Cannot explicitly set reserved keys: '+reservedKeys+'\n'+
              (
                process.env.NODE_ENV !== 'production' ?
                'Tip: You can customize reserved properties by configuring the `blacklist` option.\n'+
                '(This tip will not be displayed in production.)' :
                ''
              )
            ));
          }
        }

        var unrecognizedKeys = _.difference(_.keys(inputs.valuesToSet), opts.whitelist || _.keys(WLModel.attributes));
        if (unrecognizedKeys.length > 0){
          return exits.badRequest(new Error(
            'One or more unrecognized/forbidden properties detected: '+unrecognizedKeys+'\n'+
            (
              process.env.NODE_ENV !== 'production' ?
              'Tip: If you want this endpoint to handle custom values that don\'t match up with model attributes,\n'+
              'you can reshape the incoming data using the `before()` lifecycle callback -- or just write\n'+
              'a custom action.  (This tip will not be displayed in production.)' :
              ''
            )
          ));
        }

        opts.before.apply(this, [inputs, (err)=>{
          if (err) {
            if (err.exit === 'badRequest'){ return exits.badRequest(err); }
            else if (err.exit === 'conflict'){ return exits.conflict(err); }
            else { return exits.error(err); }
          }

          WLModel.create(inputs.valuesToSet)
          .meta({ fetch: true })
          .exec((err, newRecord)=>{
            if (err) {
              if (err.code === 'E_UNIQUE') { return exits.conflict(err); }
              else if (err.name === 'UsageError') { return exits.badRequest(err); }
              else { return exits.error(err); }
            }

            if (opts.after) {
              return opts.after(newRecord, exits);
            }

            return exits.success({
              response: {
                id: newRecord.id
              }
            });

          });//</ WLModel.create().exec() >
        }]);//</ .before() >

      }
    };
  },

  buildUpdateAction: function(modelIdentity, opts) {
    opts = opts || {};

    // Use a reasonable default for the blacklist, if neither `whitelist` nor `blacklist` is specified.
    if (_.isUndefined(opts.blacklist) && _.isUndefined(opts.whitelist)) {
      opts.blacklist = ['id','createdAt','updatedAt','isDeleted'];
    }
    if (opts.blacklist && opts.whitelist) {
      throw new Error('Can\'t use both `blacklist` AND `whitelist` (please use one or the other)');
    }

    // If no `before` LC was specified, build a no-op for it.
    if (_.isUndefined(opts.before)) {
      opts.before = function(inputs, proceed){ return proceed(); };
    }

    return {
      friendlyName: 'Update',
      description: 'Update '+modelIdentity+'.',
      inputs: {
        id: { description: 'The ID of the record to update.', example: 123, required: true },
        valuesToSet: { description: 'A dictionary of new values.', example: {}, required: true }
      },
      exits: {
        success: { statusCode: 200 },
        badRequest: { statusCode: 400 },
        conflict: { statusCode: 409 }
      },
      fn: function (inputs, exits) {

        var WLModel = sails.models[modelIdentity];

        if (opts.blacklist) {
          var reservedKeys = _.intersection(_.keys(inputs.valuesToSet), opts.blacklist);
          if (reservedKeys.length > 0) {
            return exits.badRequest(new Error(
              'Cannot explicitly set reserved keys: '+reservedKeys+'\n'+
              (
                process.env.NODE_ENV !== 'production' ?
                'Tip: You can customize reserved properties by configuring the `blacklist` option.\n'+
                '(This tip will not be displayed in production.)' :
                ''
              )
            ));
          }
        }

        var unrecognizedKeys = _.difference(_.keys(inputs.valuesToSet), opts.whitelist || _.keys(WLModel.attributes));
        if (unrecognizedKeys.length > 0){
          return exits.badRequest(new Error(
            'One or more unrecognized/forbidden properties detected: '+unrecognizedKeys+'\n'+
            (
              process.env.NODE_ENV !== 'production' ?
              'Tip: If you want this endpoint to handle custom values that don\'t match up with model attributes,\n'+
              'you can reshape the incoming data using the `before()` lifecycle callback -- or just write\n'+
              'a custom action.  (This tip will not be displayed in production.)' :
              ''
            )
          ));
        }

        opts.before.apply(this, [inputs, (err)=>{
          if (err) {
            if (err.exit === 'badRequest'){ return exits.badRequest(err); }
            else if (err.exit === 'conflict'){ return exits.conflict(err); }
            else { return exits.error(err); }
          }

          WLModel.update({
            id: inputs.id,
            isDeleted: { '!=': true }
          })
          .set(inputs.valuesToSet)
          .meta({ fetch: true })
          .exec((err, updatedRecords)=>{
            if (err) {
              if (err.code === 'E_UNIQUE') { return exits.conflict(err); }
              else if (err.name === 'UsageError') { return exits.badRequest(err); }
              else { return exits.error(err); }
            }

            if (opts.after) {
              return opts.after(updatedRecords[0], exits);
            }

            return exits.success();
          });//</ WLModel.update().exec() >
        }]);//</ .before.apply() >

      }
    };
  },

  TEST_REPORT_OUTPUT_EXAMPLE: {
    startedAt: 12345,
    endAt: 12345,
    duration: 10,
    totals: {
      xecoOff: {
        kwPeak: 3866.80,
        powerFactor: 86.58,
        kvar: 3819.75,
        kva: 3795.00,
        kwh: 3795.00,
        THD: 455.00
      },
      xecoOn: {
        kwPeak: 3866.80,
        powerFactor: 86.58,
        kvar: 3819.75,
        kva: 3795.00,
        kwh: 3795.00,
        THD: 89.00
      },
      savings: {
        kwPeak: 3866.80,
        powerFactor: 86.58,
        kvar: 3819.75,
        kva: 3795.00,
        kwh: 3795.00,
        THD: 123.00,
      }
    },
    percentSaved: {
      kwPeak: 3.83,
      powerFactor: 5.60,
      kvar: 4.24,
      kva: 5.85,
      kwh: 5.85,
      THD: 56.00,
    },
    cycles: [{
      cycle: 1,
      startedAt: 12345,
      endedAt: 23456,
      percentSaved: {
        kwPeak: 3.83,
        powerFactor: 5.60,
        kvar: 4.24,
        avgKw15MinInterval: 5.85,
        kwh: 5.85,
        THD: 6.78,
      },
      segments: [{
        segment: 1,
        xecoSwitchedOn: false,
        startTime: 12345,
        duration: 1,
        kwPeak: 3866.80,
        powerFactor: 86.58,
        kvar: 3819.75,
        avgKw15MinInterval: 3795.00,
        kwh: 3795.00,
        THD: 7.98,
      }]
    }]
  }

};
