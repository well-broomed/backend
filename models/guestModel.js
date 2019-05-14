const db = require('../data/dbConfig');

const Promise = require('bluebird');

module.exports = {
	getGuests,
	getGuest,
	addGuest
};

function getGuests(user_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	return role === 'manager'
		? db('guests as g')
				.join('properties as p', 'g.property_id', 'p.property_id')
				.where({ 'p.manager_id': user_id })
				.select('g.*')
		: db('guests as g')
				.join('properties as p', 'g.property_id', 'p.property_id')
				.join('partners', 'p.manager_id', 'partners.manager_id')
				.where({
					'partners.cleaner_id': user_id
				})
				.select('p.manager_id', 'g.*');
}

function getGuest(user_id, guest_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	return role === 'manager'
		? db('guests as g')
				.join('properties as p', 'g.property_id', 'p.property_id')
				.where({ manager_id: user_id, guest_id })
				.select('g.*')
				.first()
		: db('properties')
				.join('properties as p', 'g.property_id', 'p.property_id')
				.join('partners', 'p.manager_id', 'partners.manager_id')
				.where({ 'partners.cleaner_id': user_id, guest_id })
				.select('g.*')
				.first();
}

async function addGuest(
	property_id,
	guest_name,
	checkin,
	checkout,
	email,
	cleaner_id
) {
	const [notUnique] = await db('guests')
		.where({ property_id, guest_name, checkin, checkout })
		.select('guest_id');

	if (notUnique) {
		return { notUnique };
	}

	// Start a transaction
	return db.transaction(async trx => {
		// Add a new guest
		const [guest_id] = await trx('guests').insert(
			{
				property_id,
				guest_name,
				checkin,
				checkout,
				email,
				cleaner_id
			},
			'guest_id'
		);

		if (!guest_id) {
			trx.rollback();
		}

		console.log('guest_id:', guest_id);

		// Get tasks by property_id
		const tasks = await trx('tasks')
			.where({ property_id })
			.select('task_id');

		// Create new guest_tasks

		const guest_tasks =
			tasks[0] &&
			(await Promise.map(tasks, ({ task_id }) => {
				return trx('guest_tasks').insert({ task_id, guest_id });
			}));

		if (guest_tasks.length !== tasks.length) {
			trx.rollback();
		}

		return { guest_id };
	});
}
