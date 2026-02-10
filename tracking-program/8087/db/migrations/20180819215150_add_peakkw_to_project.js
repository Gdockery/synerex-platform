
exports.up = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.double('peakKw');
    table.double('avg15MinuteKw');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.table('project', function(table) {
    table.dropColumn('peakKw');
    table.dropColumn('avg15MinuteKw');
  });
};
