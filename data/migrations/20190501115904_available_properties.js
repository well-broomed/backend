exports.up = function(knex, Promise) {
	return knex.schema.createTable('available_properties', table => {
		table
			.integer('cleaner_id')
			.unsigned()
			.notNullable()
			.references('users.user_id');

		table
			.integer('property_id')
			.unsigned()
			.notNullable()
			.references('properties.property_id');

		table.unique(['cleaner_id', 'property_id']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('available_properties');
};
