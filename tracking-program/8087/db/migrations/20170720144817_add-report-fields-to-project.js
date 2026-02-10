
exports.up = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.text('reportFields').defaultTo('{}');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.dropColumn('reportFields');
  });
};
