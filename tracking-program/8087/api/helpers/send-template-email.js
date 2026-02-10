module.exports = {


  friendlyName: 'Send template email',


  description: 'Send an email using a template.',


  inputs: {

    template: {
      description: 'The relative path to an EJS template within our `views/emails` folder -- WITHOUT the file extension.',
      extendedDescription: 'For example `reset-password` or `marketing/welcome`.  But NEVER e.g. `foo/bar.ejs`.',
      example: 'reset-password',
      required: true,
    },

    templateData: {
      description: 'A dictionary of data which will be accessible from the EJS template.',
      extendedDescription: 'Each key will be a variable accessible in the template.  For instance, if you supply a dictionary with a `friends` key, and `friends` is an array (`[{name:"Chandra"}, {name:"Mary"}]`), then you will be able to access `friends` from the template; i.e. `<ul><% _.each(friends, function (friend){ %><li><%= friend.name %></li> <%}); %></ul>`  Use `<%- %>` to inject the contents of a variable as-is, `<%= %>` to HTML-escape them first, or `<% %>` to execute some JavaScript code.',
      example: {},
      defaultsTo: {}
    },

    to: {
      description: 'Array of email addresses to send to.',
      example: ['foo@bar.com'],
      required: true
    },

    cc: {
      description: 'Array of email addresses to CC.',
      example: ['foo@bar.com']
    },

    bcc: {
      description: 'Array of email addresses to BCC.',
      example: ['foo@bar.com']
    },

    subject: {
      description: 'The subject of the email.',
      example: 'Hello there.',
      defaultsTo: ''
    }

  },


  fn: function(inputs, exits) {

    // Add brandName to templateData if not already present
    var templateData = _.extend({}, inputs.templateData);
    if (!templateData.brandName) {
      // Try to get brandName from emailHost if available
      var emailHost = sails.config.email && sails.config.email.emailHost;
      if (emailHost) {
        templateData.brandName = sails.config.whitelabel.getBrandName(emailHost);
        templateData.emailHost = emailHost; // Also pass emailHost for templates that need it
      } else {
        templateData.brandName = 'Synerex'; // Default
      }
    }

    sails.renderView('emails/' + inputs.template, templateData, function(err, htmlBody) {
      if (err) { return exits.error(err); }

      sails.helpers.ses.sendEmail({
        to: inputs.to,
        cc: inputs.cc,
        bcc: inputs.bcc,
        subject: inputs.subject,
        htmlBody: htmlBody
      }).exec(function(err) {
        if (err) { return exits.error(err); }
        return exits.success();
      });

    });

  }

};
