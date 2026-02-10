/**
 * index.js
 *
 */

module.exports = function index(req, res) {

  var path = require('path');

  // Log when index is hit to debug routing
  sails.log.info('web/index hit for URL:', req.url, 'originalUrl:', req.originalUrl, 'path:', req.path);

  // Handle invite token - if token is in query string, show invite acceptance page
  if (req.query && req.query.token) {
    sails.log.info('web/index: Token detected in query, handling invite');
    var token = req.query.token;
    
    User.findOne({ resetPasswordToken: token }).exec(function(err, user) {
      if (err) {
        sails.log.error('web/index: Error finding user for invite token:', err);
        return res.serverError(err);
      }
      if (!user) {
        sails.log.warn('web/index: No user found for invite token:', token);
        return res.notFound();
      }
      
      sails.log.info('web/index: Found user for invite:', user.email);
      return res.view('accept-invite', {
        token: user.resetPasswordToken,
        email: user.email,
        fullName: user.firstName + ' ' + user.lastName
      });
    });
    return; // Don't continue with normal index logic
  }

  /*if (req.findOne('textRequest')) {
    return res.redirect('/tickerFile.json');
  } else 
  */
  if (!req.session.userId) {
    sails.log.info('web/index: No userId in session, redirecting to /login');
    return res.redirect('/login');
  }

  // Look up the logged-in user.
  User.findOne({id: req.session.userId})
  .omit(['hashedPassword','resetPasswordToken'])
  .populate('client')
  .populate('projects', {
    where: {
      isDeleted: false
    },
    omit: ['proposalSrc', 'depositInvoiceSrc', 'finalInvoiceSrc', 'installationInvoiceSrc']
  })
  .exec(function(err, user) {
    if (err) { return res.serverError(err); }
    if (!user) { return res.serverError(new Error('Consistency violation: Logged-in user record should exist in the database!')); }

    console.log("projects this user has: " , user.projects);
    user.projects.forEach(function(project){
      Meter.find({ isDeleted: false, project: project.id }).exec(function(err, meters){
          if (err) { return proceed("error in finding meters in index.js"); }
          project.meters = meters;
      });//</ Project.find().exec() >
    })
    // Set up some locals.
    // (Note that we'll continue editing this thing's properties like `user` by reference below.)
    var locals = {
      environment: process.env.NODE_ENV || 'development',
      user: user
    };
    // Attach the app version, for debugging purposes.
    try {
      var packageJSON = require(path.resolve(sails.config.appPath, 'package.json'));
      locals.appVersion = packageJSON.version;
    } catch (e) { return res.serverError(e); }

    (function (proceed){

      Xeco.find().exec(function(err, xecos){
        if (err) { return proceed(err); }
        locals.xecoAdvancedOptions = xecos[0];

        Client.find({ isDeleted: false }).select(['id', 'name', 'legalName', 'createdBy', 'logoImgSrc']).exec(function(err, clients) {
            if (err) { return proceed(err); }
            locals.clients = clients;
            var roleIds = [
              sails.config.constants.USER_ROLES.XECO_ADMIN,
              sails.config.constants.USER_ROLES.XECO_USER,
              sails.config.constants.USER_ROLES.ACCOUNT_MANAGER
            ];
            User.getDatastore().sendNativeQuery(
              'SELECT id, firstName, lastName, role, lastActiveAt FROM user WHERE (isDeleted = 0 OR isDeleted IS NULL) AND role IN ($1, $2, $3)',
              roleIds
            ).exec(function(err, result) {
              if (err) { return proceed(err); }
              var users = result && result.rows ? result.rows : result;

              // For convenience:
              // • Mix in the "friendly name" of each user's role
              // • Combine each user's name
              if (user.role != sails.config.constants.USER_ROLES.XECO_ADMIN) {
                user.fullName = user.firstName + ' ' + user.lastName;
                locals.xecoUsersAndAdmins = [user];
                
              } else {
                locals.xecoUsersAndAdmins = _.map(users, function(user){
                  user.roleFriendlyName = _.startCase(
                    _.camelCase(
                      _.invert(sails.config.constants.USER_ROLES)[user.role+'']
                    )
                  );
                  user.fullName = user.firstName + ' ' + user.lastName;
                  delete user.firstName;
                  delete user.lastName;
                  return user;
                });
              }

        // If this is a XECO admin, then fetch all of the projects and attach them to `req.user`.
        // Also, in this case, look up a lightweight list of the clients and attach them to the
        // top level of locals.  Same thing for XECO users+XECO admins.
        // > (the list of clients and the list of xeco users are just for use in dropdowns)
        //
        // If this is not a XECO admin, we're done gathering data.

            if (user.role != sails.config.constants.USER_ROLES.XECO_ADMIN ) {
              return proceed();
            }

            Project.find({ isDeleted: false }).populate('meters', {
              where: {
                isDeleted: false
              }}).exec(function(err, projects){
                    if (err) { return proceed(err); }
                    user.projects = projects;
         
              return proceed();
            });//</ User.find().exec() >
          });//</ Client.find().exec() >
        });//</ Project.find().exec() >
      });//</ Xeco.find().exec() >

    })(function (err) {
      if (err) { return res.serverError(err); }

      // Mix in the "friendly name" of this role, for convenience.
      user.roleFriendlyName = _.startCase(
        _.camelCase(
          _.invert(sails.config.constants.USER_ROLES)[user.role+'']
        )
      );

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // FUTURE: When Waterline bug preventing omit in populate from working is fixed, we can get rid of this.
      // (See https://trello.com/c/VX8QaWpX/119-waterline-forgestagethreequery-omit-in-subcriteria-is-not-being-properly-expanded-to-exclude-column-names-in-the-physical-layer-)
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // Marshal project data so that it doesn't contain properties that would be kinda confusing.
      // ```
      user.projects = _.map(user.projects, function(project){
        delete project.proposalSrc;
        delete project.depositInvoiceSrc;
        delete project.finalInvoiceSrc;
        delete project.installationInvoiceSrc;
        return project;
      });
      // ```
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      Project.populateServicePlansIn(user.projects, err => {
        // Display the home page with some locals.
        res.view('app', locals);
      })

    });//</ ß >


  });//</ User.findOne().exec() >

};
