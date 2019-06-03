exports.up = function(knex, Promise) {
	return knex.schema.createTable('tasks', table => {
		table.increments('task_id'); //primary key

		table
			.integer('property_id')
			.unsigned()
			.notNullable()
			.references('properties.property_id');

		table.string('text', 128).notNullable();

		table.integer('deadline').notNullable();

		table.unique(['property_id', 'text', 'deadline']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('tasks');
};
