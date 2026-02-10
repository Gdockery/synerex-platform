
exports.up = function(knex, Promise) {

  return knex.schema.table('switchcommand', function (table) {
    table.json('executedBySwitchIds');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('switchcommand', function (table) {
    table.dropColumn('executedBySwitchIds');
  });

};
