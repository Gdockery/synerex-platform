
exports.up = function(knex, Promise) {
  return knex.schema.table('meterdataaggregate', function(table) {
    table.double('peakKw');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('meterdataaggregate', function(table) {
    table.dropColumn('peakKw');
  });
};
