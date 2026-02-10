
exports.up = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.boolean('gwControl').defaultTo(false);
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.dropColumn('gwControl');
  });
};
