const db = require('../data/dbConfig');

const moment = require('moment');

const Promise = require('bluebird');

module.exports = {
	getGuests,
	getGuest,
	addGuest,
	updateGuest,
	removeGuest,
	updateGuestTask,
	checkManager,
	checkCleaner,
	reassignCleaner,
	acceptReassignment
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

async function removeGuest(guest_id) {
	// Start a transaction
	return db.transaction(async trx => {
		// Delete guest_tasks
		await trx('guest_tasks')
			.where({ guest_id })
			.del();

		// Delete the guest
		const deleted = await trx('guests')
			.where({ guest_id })
			.del();

		if (!deleted) {
			trx.rollback();
		}

		return deleted;
	});
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

async function reassignCleaner(guest_id, cleaner_id) {
	const [partnered] = await db('guests as g')
		.join('properties as p', 'g.property_id', 'p.property_id')
		.join('partners as prt', 'p.manager_id', 'prt.manager_id')
		.where({ 'prt.cleaner_id': cleaner_id })
		.select('prt.cleaner_id');

	if (!partnered) {
		return {};
	}

	const [notUnique] = await db('reassignments')
		.where({ guest_id, cleaner_id })
		.select('timestamp');

	if (notUnique) {
		return { notUnique };
	}

	const [requested] = await db('reassignments').insert(
		{
			guest_id,
			cleaner_id,
			timestamp: moment.utc(Date.now())
		},
		'timestamp'
	);

	return { requested };
}

async function acceptReassignment(guest_id, cleaner_id, accepted) {
	return db.transaction(async trx => {
		const status = await trx('reassignments')
			.where({ guest_id, cleaner_id })
			.update({ status: accepted ? 1 : 2, timestamp: moment.utc(Date.now()) });

		if (!status) {
			trx.rollback();
		}

		if (!accepted) {
			return { updated: status };
		}

		const updated = await trx('guests')
			.where({ guest_id })
			.update({ cleaner_id });

		if (!updated) {
			trx.rollback();
		}

		return { updated };
	});
}
