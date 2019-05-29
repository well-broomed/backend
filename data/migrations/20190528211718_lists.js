exports.up = function(knex, Promise) {
	return knex.schema.createTable('lists', table => {
        table
            .increments('list_id'); //primary key

        table
            .integer('property_id')
            .unsigned()
            .notNullable();

        table
            .integer('manager_id')
            .unsigned()
            .notNullable();

        table
            .string('list_type', 255)
            .notNullable();  // this will be either before, during, or after stay
            // not sure if this would be better suited by a foreign key

        table
            .integer('hours_after')
            .defaultTo(null); // only relevant for after stay lists

        table
            .timestamp('createdAt')
            .defaultTo(knex.fn.now());
        
        table
            .timestamp('updatedAt')
            .defaultTo(knex.fn.now());
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('lists');
};
