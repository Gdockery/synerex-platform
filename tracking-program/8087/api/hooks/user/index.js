/**
 * Module dependencies
 */
var flaverr = require('flaverr');

/**
 * User hook
 *
 * @description :: A hook to add the logged-in user record (if any) to the request
 */

module.exports = function defineUserHook(sails) {

  return {

    routes: {

      before: {

        '/*': {
          target: function (req, res, next) {

            // FOR DEVELOPMENT ONLY:
            // Allow forcing a user ID via command-line argument.
            if (sails.config.user_id && process.env.NODE_ENV !== 'production') {
              req.session.userId = sails.config.user_id;
            }

            // If there is no logged-in user, continue.
            if (!req.session.userId) { return next(); }

            // Look up the logged-in user.
            User.findOne({id: req.session.userId})
            .populate('projects', { isDeleted: false })
            .exec(function(err, user) {
              if (err) { return res.serverError(err); }

              // If the supposedly-logged-in user could not be found, throw an error.
              if (!user) { return res.serverError(flaverr('E_LOGGED_IN_USER_NOT_FOUND', new Error('The supposedly-logged-in user with ID `' + req.session.userId + '` could not be found.'))); }

              // If this is a XECO admin, then fetch all of the projects and attach them to `user`
              (function (proceed){
                if (user.role === sails.config.constants.USER_ROLES.XECO_ADMIN) {
                  // Synerex admin: gets all projects
                  Project.find().exec(function(err, projects){
                    if (err) { return proceed(err); }
                    user.projects = projects;
                    return proceed();
                  });
                } else if (user.role === 9 && user.org_id) {
                  // OEM user: gets projects for all clients they sponsor
                  sails.sendNativeQuery(
                    'SELECT p.* FROM `project` p JOIN `client` c ON p.client = c.id WHERE (c.sponsor_org_id = ? OR c.org_id = ?) AND p.isDeleted = 0 AND c.isDeleted = 0',
                    [user.org_id, user.org_id],
                    function(err, result) {
                      if (err) { return proceed(err); }
                      user.projects = (result && result.rows) ? result.rows : [];
                      return proceed();
                    }
                  );
                } else {
                  return proceed();
                }

              })(function (err) {
                if (err) { return res.serverError(err); }

                // Add the user record to the request.
                req.user = user;

                // Set the user's last logged-in timestamp, at our convenience.
                User.update({id: req.session.userId}).set({lastActiveAt: Date.now()}).exec(function (err){
                  if (err) {
                    sails.log.warn('Encountered an unexpected error setting this user\'s (id: '+req.session.userId+') lastActiveAt timestamp.  Details:',err);
                  }
                });//_∏_

                Project.populateServicePlansIn(user.projects, err => {
                  // Continue.
                  return next();
                })

              });//</ ß >

            });//</ User.findOne().exec() >

          },
          skipAssets: true
        }

      }

    }

  };

};
