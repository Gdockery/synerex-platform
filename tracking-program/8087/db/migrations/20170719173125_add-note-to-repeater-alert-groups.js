
exports.up = function(knex, Promise) {

  return knex.schema.table('repeateralertgroup', function(table) {
    table.string('note').defaultTo(false);
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('repeateralertgroup', function(table) {
    table.dropColumn('note');
  });

};
