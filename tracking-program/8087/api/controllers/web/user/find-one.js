module.exports = {


  friendlyName: 'Find one (User)',


  description: 'Get details about the specified record.',


  extendedDescription: 'Note that this action returns even "soft-deleted" records.',


  inputs: {

    id: {
      description: 'The ID of the record to look up.',
      example: 123,
      required: true
    }

  },


  exits: {

    success: {
      outputExample: {
        meta: {},
        response: {
          isDeleted: true,
          email: 'xjones@xecoenergy.com',
          fullName: 'Xander Jones',
          lastActiveAt: 19238724223,
          resetPasswordToken: '',
          hasPassword: true,
          role: 3,
          roleFriendlyName: 'XECO Admin',
          client: { id: 123, name: 'Foo' },
          projects: [
            { id: 987, name: 'Foo' },
          ],
          meters: [
            { id: 987, name: 'Foo', project: 32 },
          ],
        }
      }
    },

    notFound: { statusCode: 404 }

  },


  fn: function(inputs, exits) {
    var req = this.req;
    User.findOne({ id: inputs.id })
    .populate('client')
    .populate('projects', {
      select: ['id','name', 'lastRollupAt'],
      where: { isDeleted: false }
    })
    .exec(function(err, record){
      if (err) { return exits.error(err); }
      if (!record) { return exits.notFound(); }

      // Munge record before sending it back.
      var hostname = req.hostname || req.get('host') || '';
      var brandName = sails.config.whitelabel ? sails.config.whitelabel.getBrandName(hostname) : 'Synerex';
      record.roleFriendlyName = _.startCase(
        _.camelCase(
          _.invert(sails.config.constants.USER_ROLES)[record.role+'']
        )
      );
      // Replace "Xeco Admin" with dynamic brand name
      if (record.roleFriendlyName === 'Xeco Admin') {
        record.roleFriendlyName = brandName + ' Admin';
      }
      record.fullName = record.firstName + ' ' + record.lastName;
      delete record.firstName;
      delete record.lastName;
      record.hasPassword = !!record.hashedPassword;

      return exits.success({
        response: record
      });
    });
  }

};
