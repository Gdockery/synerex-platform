/**
 * User.js
 *
 * @description :: A user.
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    // The user's first name.
    firstName: {
      type: 'string',
      required: true
    },

    // The user's last name.
    lastName: {
      type: 'string',
      required: true
    },

    // The user's email address.
    email: {
      type: 'string',
      isEmail: true,
      required: true,
      unique: true
    },

    // The user's phone number (optional).
    phone: {
      type: 'string'
    },

    // The user's certificate number (optional)
    certificateNo: {
      type: 'string'
    },

    // The one-way hashed version of the user's password.
    // (if empty string, it means that this password hasn't been set yet)
    hashedPassword: {
      type: 'string'
    },

    // A token that will allow the user to reset their password.
    resetPasswordToken: {
      type: 'string'
    },

    // The user's role.
    // Use a value from the `sails.config.constants.USER_ROLES` set.
    role: {
      type: 'number'
    },

    // The JS timestamp at which this user last interacted with
    // the XECO portal in a logged-in kind of a way.
    lastActiveAt: {
      type: 'number'
    },

    // Whether or not the user has been deleted.
    isDeleted: {
      type: 'boolean',
      defaultsTo: false
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝



    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    // The client that the user belongs to.
    client: {
      model: 'client'
    },

    // The user's default project (optional).
    // (if specified, this project will be displayed when they first log in)
    defaultProject: {
      model: 'project'
    },

    // The projects that the user is assigned to.
    projects: {
      collection: 'project',
      via: 'users'
    },

    // The collection of meter alert groups that the user will received notifications
    // for when an alert event happens.
    meterAlertGroups: {
      collection: 'MeterAlertGroup',
      via: 'users'
    },

    // The collection of repeater alert groups that the user will received notifications
    // for when an alert event happens.
    repeaterAlertGroups: {
      collection: 'RepeaterAlertGroup',
      via: 'users'
    },

    // The collection of switch alert groups that the user will received notifications
    // for when an alert event happens.
    switchAlertGroups: {
      collection: 'SwitchAlertGroup',
      via: 'users'
    },

  },

};

