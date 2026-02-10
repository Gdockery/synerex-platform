
exports.up = function(knex, Promise) {
  return knex.schema.table('gatewaycommand', function(table) {
    table.integer('duration');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('gatewaycommand', function(table) {
    table.dropColumn('duration');
  });
};
