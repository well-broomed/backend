exports.up = function(knex, Promise) {
	return knex.schema.createTable('available_properties', table => {
		table
			.integer('user_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table
			.integer('property_id')
			.unsigned()
			.notNullable()
			.references('properties.property_id');

		table.unique(['user_id', 'property_id']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('available_properties');
};
