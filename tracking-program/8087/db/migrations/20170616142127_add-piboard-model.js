
exports.up = function(knex, Promise) {

  return knex.schema.createTable('piboard', function (table) {
    table.increments('id');
    table.specificType('createdAt', 'bigint(20)');
    table.specificType('updatedAt', 'bigint(20)');
    table.string('deviceId');
    table.unique('deviceId');
    table.string('meshId');
    table.string('softwareVersion');
    table.specificType('lastCommunicatedAt', 'double');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.dropTable('piboard');

};
