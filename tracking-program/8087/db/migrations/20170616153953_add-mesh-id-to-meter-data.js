
exports.up = function(knex, Promise) {

  return knex.schema.table('meterdata', function (table) {
    table.string('meshId');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('meterdata', function (table) {
    table.dropColumn('meshId');
  });

};
