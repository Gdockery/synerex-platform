
exports.up = function(knex, Promise) {

  return knex.schema.table('meteralertgroup', function(table) {
    table.string('note').defaultTo(false);
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('meteralertgroup', function(table) {
    table.dropColumn('note');
  });

};
