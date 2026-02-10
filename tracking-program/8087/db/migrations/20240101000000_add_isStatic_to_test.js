
exports.up = function(knex, Promise) {
  return knex.schema.table('test', function(table) {
    table.integer('isStatic').defaultTo(0);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('test', function(table) {
    table.dropColumn('isStatic');
  });
};

