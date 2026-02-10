
exports.up = function(knex, Promise) {

  return knex.schema.table('project', function (table) {
    table.string('currencyCode').defaultTo('USD');
    table.dropColumn('currencyType');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('project', function (table) {
    table.string('currencyType').defaultTo('USD');
    table.dropColumn('currencyCode');
  });

};
