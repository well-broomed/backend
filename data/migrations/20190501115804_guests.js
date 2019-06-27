exports.up = function(knex, Promise) {
	return knex.schema.createTable('guests', table => {
		table.increments('guest_id'); //primary key

		table
			.integer('property_id')
			.unsigned()
			.notNullable()
			.references('properties.property_id')
			.onDelete('CASCADE');

		table
			.integer('cleaner_id')
			.unsigned()
			.references('users.user_id');

		table.string('guest_name', 128).notNullable();

		table.datetime('checkin', { useTz: true, precision: 0 }).notNullable();

		table.datetime('checkout', { useTz: true, precision: 0 }).notNullable();

		table.string('email', 128);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('guests');
};
