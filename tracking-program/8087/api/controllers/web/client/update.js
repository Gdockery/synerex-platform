module.exports = sails.config.constants.buildUpdateAction('client', {
  blacklist: ['id', 'createdAt', 'updatedAt', 'isDeleted', 'users']
});
