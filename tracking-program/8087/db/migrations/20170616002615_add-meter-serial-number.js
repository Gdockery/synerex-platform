
exports.up = function(knex, Promise) {

  return knex.schema.table('meter', function (table) {
    table.string('meterSerialNumber');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('meter', function (table) {
    table.dropColumn('meterSerialNumber');
  });

};
