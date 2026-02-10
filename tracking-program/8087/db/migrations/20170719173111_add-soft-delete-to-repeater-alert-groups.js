
exports.up = function(knex, Promise) {

  return knex.schema.table('repeateralertgroup', function(table) {
    table.boolean('isDeleted').defaultTo(false);
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('repeateralertgroup', function(table) {
    table.dropColumn('isDeleted');
  });

};
