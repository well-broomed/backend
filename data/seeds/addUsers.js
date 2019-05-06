const faker = require('faker');

const createFakeUser = () => ({
	user_name: faker.name.findName(),
	role: ~~(Math.random() * 2) ? 'manager' : 'assistant',
	email: faker.internet.email()
});

exports.seed = async function(knex, Promise) {
	const fakeUsers = [];
	for (let i = 0; i < 500; i++) {
		fakeUsers.push(createFakeUser());
	}
	await knex('users').insert(fakeUsers);
};
