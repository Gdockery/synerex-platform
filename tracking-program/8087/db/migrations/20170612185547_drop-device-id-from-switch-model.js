
exports.up = function(knex, Promise) {

  return knex.schema.table('switch', function (table) {
    table.dropColumn('deviceId');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('switch', function (table) {
    table.string('deviceId');
  });

};
