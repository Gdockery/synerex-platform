
exports.up = function(knex, Promise) {

  return knex.schema.createTable('gatewaycommand', function (table) {
    table.increments('id');
    table.specificType('createdAt', 'bigint(20)');
    table.specificType('updatedAt', 'bigint(20)');
    table.specificType('commandType', 'double');
    table.specificType('startAt', 'double');
    table.integer('project');
    table.integer('test');
    table.boolean('isCancelled').defaultTo(false);
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.dropTable('gatewaycommand');

};
