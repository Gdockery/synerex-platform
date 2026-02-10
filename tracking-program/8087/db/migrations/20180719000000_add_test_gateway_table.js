
exports.up = function(knex, Promise) {

  return knex.schema.createTable('gateway_tests__test_gateways', function (table) {
    table.increments('id');
    table.integer('gateway_tests');
    table.integer('test_gateways');
  });

};

exports.down = function(knex, Promise) {

  return knex.schema.dropTable('gateway_tests__test_gateways');

};
