exports.up = function(knex, Promise) {
	return knex.schema.createTable('exampleTable', table => {
		table.increments('index'); //primary key
		table
			.string('string')
			.notNullable()
			.unique();
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTableIfExists('users');
};
