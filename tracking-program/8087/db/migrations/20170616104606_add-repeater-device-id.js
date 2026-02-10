
exports.up = function(knex, Promise) {

  return knex.schema.table('repeater', function (table) {
    table.string('deviceId');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('repeater', function (table) {
    table.dropColumn('deviceId');
  });

};
