module.exports = {


  friendlyName: 'Download invoice or proposal',


  description: 'Download an invoice or proposal for this project.',


  extendedDescription:
  'Note that the input actually used to send the document token itself communicates what _kind_ of document this is.  '+
  '(This approach is just to improve the aesthetics of the magic link itself.)',


  inputs: {

    proposal: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    depositInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    finalInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },
    installationInvoice: { description: 'The document token.', example: 'bab31813459a03913afe1839' },

  },


  exits: {

    success: {
      outputFriendlyName: 'Readable stream',
      outputDescription: 'The requested PDF file.',
      outputExample: '==='
    },

    badRequest: { statusCode: 400 },
    notFound: { statusCode: 404 },

  },


  fn: function (inputs, exits) {

    // Imports
    var flaverr = require('flaverr');
    var HTTP = require('machinepack-http');

    // Constants
    var DOCUMENT_KINDS = ['proposal', 'depositInvoice', 'finalInvoice', 'installationInvoice'];

    // Validate token and figure out what kind of document this requst is referring to.
    var documentShareToken;
    var documentKind;
    var badUsageError;
    _.each(DOCUMENT_KINDS, function(tokenParamName){
      if (badUsageError) { return; }
      else if (documentShareToken && inputs[tokenParamName]) {
        badUsageError = new Error('Cannot specify both `'+documentKind+'` AND `'+tokenParamName+'`!');
      }
      else if (inputs[tokenParamName]) {
        documentShareToken = inputs[tokenParamName];
        documentKind = tokenParamName;
      }
    });

    if (!documentShareToken) {
      badUsageError = new Error('Invalid link.  (A document token must be specified.)');
    }
    if (badUsageError) {
      return exits.badRequest(badUsageError);
    }

    // Determine the attribute name for this document's src URL.
    var documentSrcAttrName = documentKind + 'Src';

    Project.getDatastore()
    .transaction(function $transactionally(db, proceed){

      // Now look up the appropriate project using the token.
      Project.findOne({
        documentShareToken: documentShareToken
      })
      .select(documentSrcAttrName)
      .exec(function(err, project) {
        if (err) { return proceed(err); }
        if (!project) { return proceed(flaverr('E_PROJECT_NOT_FOUND', new Error('...'))); }

        // Now look at the source URL for the document.
        // If there's one already, just use that pre-existing URL.
        // Otherwise, no such document exists yet.  So build it, upload it to S3,
        // then save that URL in the database and use it.
        var documentSrcUrl = project[documentSrcAttrName];
        if (documentSrcUrl) {
          return proceed(undefined, documentSrcUrl);
        }//-•

        sails.helpers.web.pdf.generateInvoiceOrProposal({
          project: project,
          documentKind: documentKind
        })
        .exec(function(err, documentSrcUrl){
          if (err) { return proceed(err); }

          var valuesToSet = {};
          valuesToSet[documentSrcAttrName] = documentSrcUrl;
          Project.update({ documentShareToken: documentShareToken })
          .set(valuesToSet)
          .exec(function(err) {
            if (err) { return proceed(err); }
            return proceed(undefined, documentSrcUrl);
          });//</ Project.update().exec() >
        });//</ generateInvoiceOrProposal().exec() >
      });//</ Project.findOne().exec() >

    })
    .exec(function (err, documentSrcUrl){
      if (err) {
        if (err.code === 'E_PROJECT_NOT_FOUND') { return exits.notFound(); }
        else { return exits.error(err); }
      }

      // Now fetch the PDF document and stream it down to the client.
      HTTP.getStream({ url: documentSrcUrl }).exec(function(err, stream) {
        if (err) { return exits.error(err); }

        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        // FUTURE: Set appropriate content disposition header based on request param to allow
        // a "download" vs. "open" option on the client.
        //
        // (Note that the content type should already be good to go since Sails.js/Express
        // mirrors the content type from the outgoing stream when sending its response headers)
        // If this ever comes up in the future, here's a tangentially related reference impl:
        // https://gist.github.com/mikermcneil/d63c43b190aaf5c71878be3a66ba36fa#file-cache-url-as-data-uri-js-L43-L82)
        // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

        return exits.success(stream);

      });//</ HTTP.getStream().exec() >
    });//</ .transaction() >


  }


};
