exports.up = function(knex, Promise) {
	return knex.schema.createTable('guest_tasks', table => {
		table
			.integer('guest_id')
			.unsigned()
			.notNullable()
			.references('guests.guest_id')
			.onDelete('CASCADE');

		table
			.integer('task_id')
			.unsigned()
			.notNullable()
			.references('tasks.task_id');

		table.boolean('completed').defaultTo(false);

		table.unique(['guest_id', 'task_id']);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('guest_tasks');
};
