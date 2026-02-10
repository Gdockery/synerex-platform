var _ = require('@sailshq/lodash');
exports.up = function(knex, Promise) {
	return knex.schema.table('project', function (table) {
	  table.string('slug').unique('slug');
	}).then(function(){
		knex('project').select('id', 'name').where({isDeleted: false}).then(function(projects) {
			var updates = _.map(projects, function(project) {
				return knex('project').update('slug', _.kebabCase(project.name)).where({id: project.id});
			});
			return Promise.all(updates);
		});
	});

};

exports.down = function(knex, Promise) {

	return knex.schema.table('project', function (table) {
	  table.dropColumn('slug');
	});

};
