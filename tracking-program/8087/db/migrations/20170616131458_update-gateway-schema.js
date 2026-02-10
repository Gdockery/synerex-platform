
exports.up = function(knex, Promise) {

  return knex.schema.table('gateway', function (table) {
    table.string('meshId');
    table.renameColumn('macAddress', 'deviceId');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('gateway', function (table) {
    table.dropColumn('meshId');
    table.renameColumn('deviceId', 'macAddress');
  });

};
