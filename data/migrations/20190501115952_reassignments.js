exports.up = function(knex, Promise) {
	return knex.schema.createTable('reassignments', table => {
		table
			.integer('guest_id')
			.unsigned()
			.notNullable()
			.references('guests.guest_id')
			.onDelete('CASCADE');

		table
			.integer('cleaner_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table.timestamp('timestamp', { precision: 0 });

		table.integer('status').defaultTo(0); // {0: pending, 1: accepted, 2: rejected}

		table.unique(['guest_id', 'cleaner_id']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('reassignments');
};
