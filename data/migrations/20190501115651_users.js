exports.up = function(knex, Promise) {
	return knex.schema.createTable('users', table => {
		table.increments('user_id'); //primary key

		table
			.string('user_name', 32)
			.notNullable()
			.unique();

		table
			.string('email', 128)
			.notNullable()
			.unique();

		table.string('role', 16).notNullable();

		table.string('img_url', 256);

		table.string('phone', 32);

		table.string('address', 256);

		table.string('auth_provider', 128).notNullable();

		table.timestamp('createdAt').defaultTo(knex.fn.now());

		table.timestamp('updatedAt').defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.raw('DROP TABLE if exists users cascade');
};
