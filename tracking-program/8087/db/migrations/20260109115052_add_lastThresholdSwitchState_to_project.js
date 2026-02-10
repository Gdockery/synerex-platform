
exports.up = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.string('lastThresholdSwitchState', 10).nullable();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.dropColumn('lastThresholdSwitchState');
  });
};
