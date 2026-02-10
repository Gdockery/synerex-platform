
exports.up = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.decimal('lowAmpsThreshold', 10, 2).nullable();
    table.decimal('highAmpsThreshold', 10, 2).nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.dropColumn('lowAmpsThreshold');
    table.dropColumn('highAmpsThreshold');
  });
};
