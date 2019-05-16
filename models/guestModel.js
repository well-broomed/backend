const db = require('../data/dbConfig');

const Promise = require('bluebird');

module.exports = {
	getGuests,
	getGuest,
	addGuest,
	updateGuest,
	updateGuestTask,
	checkManager,
	checkCleaner
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

async function getGuest(user_id, guest_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	const guest =
		role === 'manager'
			? await db('guests as g')
					.join('properties as p', 'g.property_id', 'p.property_id')
					.where({ manager_id: user_id, guest_id })
					.select('g.*')
					.first()
			: await db('properties')
					.join('properties as p', 'g.property_id', 'p.property_id')
					.join('partners', 'p.manager_id', 'partners.manager_id')
					.where({ 'partners.cleaner_id': user_id, guest_id })
					.select('g.*')
					.first();

	const tasks = guest
		? await db('guest_tasks as gt')
				.where({ guest_id })
				.join('tasks as t', 'gt.task_id', 't.task_id')
				.select('t.task_id', 'text', 'completed')
		: [];

	return { ...guest, tasks };
}

async function addGuest(guestInfo) {
	const { property_id, guest_name, checkin, checkout } = guestInfo;

	const [notUnique] = await db('guests')
		.where({ property_id, guest_name, checkin, checkout })
		.select('guest_name');

	if (notUnique) {
		return { notUnique };
	}

	// Start a transaction
	return db.transaction(async trx => {
		// Add a new guest
		const [guest_id] = await trx('guests').insert(guestInfo, 'guest_id');

		if (!guest_id) {
			trx.rollback();
		}

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

async function updateGuest(guest_id, guestInfo) {
	// Need to fix this later.
	// const { property_id, guest_name, checkin, checkout } = guestInfo;

	// const [notUnique] = await db('guests')
	// 	.where({ property_id, guest_name, checkin, checkout })
	// 	.andWhereNot({ guest_id })
	// 	.select('guest_name');

	// if (notUnique) {
	// 	return { notUnique };
	// }

	// Update a guest
	const [updated] = await db('guests')
		.where({ guest_id })
		.update(guestInfo, 'guest_id');

	return { updated };
}

function updateGuestTask(guest_id, task_id, completed) {
	return db('guest_tasks')
		.where({ guest_id, task_id })
		.update({ completed });
}

function checkManager(manager_id, guest_id) {
	return db('guests as g')
		.join('properties as p', 'g.property_id', 'p.property_id')
		.where({ manager_id, guest_id })
		.select('guest_id')
		.first();
}

function checkCleaner(cleaner_id, guest_id) {
	return (
		db('guests')
			.where({ cleaner_id, guest_id })
			.select('guest_id')
			.first() ||
		db('guests as g')
			.join('properties as p', 'g.property_id', 'p.property_id')
			.where({ manager_id: cleaner_id, guest_id })
	);
}
