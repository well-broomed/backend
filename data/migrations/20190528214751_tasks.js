exports.up = function(knex, Promise) {
	return knex.schema.createTable('tasks', table => {
		table.increments('task_id'); //primary key

		table
			.integer('list_id')
			.unsigned()
			.notNullable()
			.references('lists.list_id');

		table
			.integer('property_id')
			.unsigned()
			.notNullable()
			.references('properties.property_id');

		table
			.integer('manager_id')
			.unsigned()
			.notNullable()
			.references('users.user_id')

		table
			.string('list_type', 255) // before, during, after
			.notNullable()

		table
			.integer('hours_after')
			.defaultTo(null); // only relevant for after lists

		table
			.string('text', 255)
			.notNullable();

		table
            .timestamp('createdAt')
            .defaultTo(knex.fn.now());
        
        table
            .timestamp('updatedAt')
            .defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('tasks');
};
