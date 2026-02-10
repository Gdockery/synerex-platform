
exports.up = function(knex, Promise) {

  return knex.schema.table('project', function (table) {
    table.renameColumn('avgL1Amp', 'totalL1Amp');
    table.renameColumn('avgL2Amp', 'totalL2Amp');
    table.renameColumn('avgL3Amp', 'totalL3Amp');
  });
  
};

exports.down = function(knex, Promise) {

  return knex.schema.table('project', function (table) {
    table.renameColumn('totalL1Amp', 'avgL1Amp');
    table.renameColumn('totalL2Amp', 'avgL2Amp');
    table.renameColumn('totalL3Amp', 'avgL3Amp');
  });
  
};
