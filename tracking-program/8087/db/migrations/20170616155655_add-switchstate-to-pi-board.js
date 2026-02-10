
exports.up = function(knex, Promise) {

  return knex.schema.table('piboard', function (table) {
    table.boolean('switchState').defaultTo(false);
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('piboard', function (table) {
    table.dropColumn('switchState');
  });

};
