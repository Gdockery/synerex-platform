module.exports = sails.config.constants.buildCreateAction('client', {
  blacklist: ['id','createdAt', 'updatedAt', 'isDeleted', 'users']
});
