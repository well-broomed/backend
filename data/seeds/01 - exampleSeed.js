exports.seed = function(knex, Promise) {
	// Deletes ALL existing entries
	return knex('exampleTable')
		.del()
		.then(function() {
			// Inserts seed entries
			return knex('exampleTable').insert([
				{
					index: 1,
					string: 'example 1'
				},
				{
					index: 2,
					string: 'example 2'
				},
				{
					index: 3,
					string: 'example 3'
				},
				{
					index: 4,
					string: 'example 4'
				}
			]);
		});
};
