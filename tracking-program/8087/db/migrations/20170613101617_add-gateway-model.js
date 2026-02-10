
exports.up = function(knex, Promise) {

  return knex.schema.createTable('gateway', function (table) {
    table.increments('id');
    table.specificType('createdAt', 'bigint(20)');
    table.specificType('updatedAt', 'bigint(20)');
    table.string('macAddress');
    table.string('name');
    table.string('softwareVersion');
    table.specificType('lastCommunicatedAt', 'double');
    table.boolean('isDeleted');
    table.integer('project');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.dropTable('gateway');

};
