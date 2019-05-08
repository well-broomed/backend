exports.up = function(knex, Promise) {
	return knex.schema.createTable('invites', table => {
		table
			.integer('manager_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table
			.integer('cleaner_id')
			.unsigned()
			.references('users.user_id');

		table.string('email', 128).notNullable();

		table
			.string('inviteCode', 16)
			.notNullable()
			.unique();

		table.timestamp('timestamp', { precision: 0 });

		table.integer('status').defaultTo(0); // {0: pending, 1: accepted, 2: rejected}

		table.unique(['manager_id', 'email']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('invites');
};
