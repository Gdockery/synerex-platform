
exports.up = function(knex, Promise) {

  return knex.schema.table('project', function (table) {
    table.specificType('carbonCreditRate', 'double').defaultTo(11);
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('project', function (table) {
    table.string('currencyType').defaultTo('USD');
    table.dropColumn('carbonCreditRate');
  });

};
