
exports.up = function(knex, Promise) {

  return knex.schema.table('switchcommand', function (table) {
    table.dropColumn('duration');
    table.dropColumn('interval');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('switchcommand', function (table) {
    table.specificType('duration', 'double');
    table.specificType('interval', 'double');
  });

};
