
exports.up = function(knex, Promise) {

  return knex.schema.table('test', function (table) {
    table.dropColumn('switchCommand');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.table('test', function (table) {
    table.integer('switchCommand');
  });

};
