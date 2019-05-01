exports.up = function(knex, Promise) {
	return knex.schema.createTable('reassignments', table => {
		table
			.integer('guest_id')
			.unsigned()
			.notNullable()
			.references('guests.guest_id')
			.onDelete('CASCADE');

		table
			.integer('user_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table.boolean('rejected');

		table.unique(['guest_id', 'user_id']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('reassignments');
};
