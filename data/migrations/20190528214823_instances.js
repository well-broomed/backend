exports.up = function(knex, Promise) {
	return knex.schema.createTable('instances', table => {
        table
            .increments('id');

        table
            .uuid('instance_uuid') // the unique identifier for this instance of the list and its tasks
            .notNullable();

        table
            .integer('list_id')
            .unsigned()
            .notNullable()
            .references('lists.list_id');

		table
			.integer('task_id')
			.unsigned()
			.notNullable()
            .references('tasks.task_id');


        table
            .integer('property_id')
            .unsigned()
            .notNullable()
            .references('properties.property_id');

        table
            .integer('manager_id')
            .unsigned()
            .notNullable()
            .references('users.user_id');

        table
            .integer('guest_id')
            .unsigned()
            .notNullable()
            .references('guests.guest_id');
        
        table
            .boolean('completed')
            .defaultTo(false);

        table
            .string('list_type') // before, during, after
            .notNullable();

        table
            .integer('hours_after') // only relevant for after lists
            .defaultTo(null);

        // the deadline will be calculated either from guest check-in for before, during lists
        // or from guest check-out and the hours_after value for after lists
        table
            .timestamp('deadline') // when the list should be complete by
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
	return knex.schema.dropTableIfExists('instances');
};
