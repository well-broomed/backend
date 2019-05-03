exports.up = function(knex, Promise) {
	return knex.schema.createTable('partners', table => {
		table
			.integer('manager_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table
			.integer('cleaner_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table.unique(['manager_id', 'cleaner_id']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('partners');
};
