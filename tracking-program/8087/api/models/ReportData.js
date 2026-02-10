/**
 * SwitchCommand.js
 *
 * @description :: A scheduled switch command.
 */

module.exports = {

  attributes: {

    // The project that this switch command belongs to.
    project: {
      model: 'project',
      required: true
    },

    typeId: {
      type: 'number',
      required: true
    },

    type: {
      type: 'string',
      required: true
    },

    valueType: {
      type: 'string',
      required: true
    },

    period: {
      type: 'string',
      required: true
    },

    description: {
      type: 'string',
    },

    value: {
      type: 'number',
      required: true,
    },


  },

};

