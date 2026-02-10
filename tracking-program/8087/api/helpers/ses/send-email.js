module.exports = {


  friendlyName: 'Send email',


  inputs: {

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

    htmlBody: {
      description: 'The HTML body of the email.',
      example: 'This is a <strong>bold</strong> message!'
    },

    textBody: {
      description: 'The plaintext body of the email.',
      example: 'This is not such a strong message.'
    },

    subject: {
      description: 'The subject of the email.',
      example: 'Hello there.',
      defaultsTo: ''
    }

  },


  fn: function(inputs, exits) {

    var child_process = require('child_process');
    var util = require('util');

    // Get sender email from config (default to a system email if not set)
    var fromEmail = sails.config.email && sails.config.email.fromEmail || 'noreply@xecoenergy.com';

    // Build email headers
    var headers = [];
    headers.push('From: ' + fromEmail);
    headers.push('To: ' + inputs.to.join(', '));
    
    if (inputs.cc && inputs.cc.length > 0) {
      headers.push('Cc: ' + inputs.cc.join(', '));
    }
    
    if (inputs.bcc && inputs.bcc.length > 0) {
      headers.push('Bcc: ' + inputs.bcc.join(', '));
    }
    
    headers.push('Subject: ' + inputs.subject);
    headers.push('MIME-Version: 1.0');
    
    // Determine content type and body
    var hasHtml = inputs.htmlBody && inputs.htmlBody.trim().length > 0;
    var hasText = inputs.textBody && inputs.textBody.trim().length > 0;
    
    var emailBody;
    
    if (hasHtml && hasText) {
      // Multipart email with both HTML and text
      var boundary = '----=_Part_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      headers.push('Content-Type: multipart/alternative; boundary="' + boundary + '"');
      
      emailBody = [
        '--' + boundary,
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        inputs.textBody,
        '',
        '--' + boundary,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        inputs.htmlBody,
        '',
        '--' + boundary + '--'
      ].join('\n');
    } else if (hasHtml) {
      // HTML only
      headers.push('Content-Type: text/html; charset=utf-8');
      emailBody = inputs.htmlBody;
    } else if (hasText) {
      // Text only
      headers.push('Content-Type: text/plain; charset=utf-8');
      emailBody = inputs.textBody;
    } else {
      return exits.error(new Error('Either htmlBody or textBody must be provided'));
    }

    // Combine headers and body
    var emailContent = headers.join('\n') + '\n\n' + emailBody;

    // Get all recipients (to, cc, bcc) for sendmail command
    var allRecipients = inputs.to.slice();
    if (inputs.cc) {
      allRecipients = allRecipients.concat(inputs.cc);
    }
    if (inputs.bcc) {
      allRecipients = allRecipients.concat(inputs.bcc);
    }

    // Spawn sendmail process
    var sendmail = child_process.spawn('sendmail', ['-t', '-i'].concat(allRecipients));

    var errorOutput = '';
    
    sendmail.stderr.on('data', function(data) {
      errorOutput += data.toString();
    });

    sendmail.on('close', function(code) {
      if (code !== 0) {
        return exits.error(new Error('sendmail exited with code ' + code + ': ' + errorOutput));
      }
      return exits.success();
    });

    sendmail.on('error', function(err) {
      return exits.error(new Error('Failed to spawn sendmail: ' + err.message));
    });

    // Write email content to sendmail stdin
    sendmail.stdin.write(emailContent);
    sendmail.stdin.end();

  }


};
