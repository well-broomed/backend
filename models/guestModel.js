const db = require('../data/dbConfig');

const knexfile = require('../knexfile');
const knex = require('knex')(knexfile[process.env.NODE_ENV || 'development']);

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
	return role === 'manager'
		? db('guests as g')
				.where({ 'p.manager_id': user_id })
				.join('properties as p', 'g.property_id', 'p.property_id')
				.leftJoin('users as u', 'g.cleaner_id', 'u.user_id')
				.leftJoin('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
				.select(
					'g.*',
					'p.property_name',
					'p.img_url',
					'u.user_name as cleaner_name',
					knex.raw(
						'floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion'
					)
				)
				.groupBy('g.guest_id', 'p.property_name', 'p.img_url', 'cleaner_name')
				.orderBy('g.checkin')
		: db('guests as g')
				.join('properties as p', 'g.property_id', 'p.property_id')
				.join('partners', 'p.manager_id', 'partners.manager_id')
				.where({
					'partners.cleaner_id': user_id
				})
				.leftJoin('users as u', 'g.manager_id', 'u.user_id')
				.leftJoin('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
				.select(
					'g.*',
					'p.property_name',
					'p.img_url',
					'u.user_name as manager_name',
					knex.raw(
						'floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion'
					)
				)
				.groupBy('g.guest_id', 'p.property_name', 'p.img_url', 'manager_name')
				.orderBy('g.checkin');
}

async function getGuest(user_id, guest_id, role) {
	const guest =
		role === 'manager'
			? await db('guests as g')
					.join('properties as p', 'g.property_id', 'p.property_id')
					.where({ manager_id: user_id, guest_id })
					.leftJoin('users as u', 'g.cleaner_id', 'u.user_id')
					.select(
						'g.*',
						'p.property_name',
						'p.img_url',
						'p.guest_guide',
						'p.assistant_guide',
						'u.user_name as cleaner_name'
					)
					.first()
			: await db('properties')
					.join('properties as p', 'g.property_id', 'p.property_id')
					.join('partners', 'p.manager_id', 'partners.manager_id')
					.where({ 'partners.cleaner_id': user_id, guest_id })
					.join('users as u', 'p.manager_id', 'u.user_id')
					.select(
						'g.*',
						'p.property_name',
						'p.img_url',
						'p.manager_id',
						'u.user_name as manager_name',
						'p.guest_guide',
						'p.assistant_guide'
					)
					.first();

	if (!guest) return {};

	const tasks = await db('guest_tasks as gt')
		.where({ guest_id })
		.join('tasks as t', 'gt.task_id', 't.task_id')
		.select('t.task_id', 't.deadline', 'text', 'completed');

	const availableCleaners = await db('available_cleaners as ac')
		.where({
			property_id: guest.property_id
		})
		.andWhereNot({ cleaner_id: guest.cleaner_id })
		.join('users as u', 'ac.cleaner_id', 'u.user_id')
		.select('u.user_id as value', 'u.user_name as label')
		.orderBy('label');

	const otherCleaners = await db('partners as p')
		.leftJoin('available_cleaners as ac', 'p.cleaner_id', 'ac.cleaner_id')
		.where({
			manager_id: guest.manager_id || user_id
		})
		.andWhere({ ['ac.property_id']: null })
		.join('users as u', 'p.cleaner_id', 'u.user_id')
		.select('p.cleaner_id as value', 'u.user_name as label')
		.orderBy('label');

	const reassignments = await db('reassignments as r')
		.where({ guest_id })
		.join('users as u', 'r.cleaner_id', 'u.user_id')
		.select('r.cleaner_id', 'u.user_name', 'r.timestamp', 'r.status');

	return { ...guest, tasks, availableCleaners, reassignments, otherCleaners };
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

		if (tasks.length && guest_tasks.length !== tasks.length) {
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
		.update({ completed }, ['task_id', 'completed']);
}

function checkManager(manager_id, guest_id) {
	return db('guests as g')
		.join('properties as p', 'g.property_id', 'p.property_id')
		.where({ manager_id, guest_id })
		.select('guest_id')
		.first();
}

async function checkCleaner(user_id, guest_id) {
	const valid =
		(await db('guests')
			.where({ cleaner_id: user_id, guest_id })
			.select('guest_id')
			.first()) ||
		(await db('guests as g')
			.join('properties as p', 'g.property_id', 'p.property_id')
			.where({ manager_id: user_id, guest_id })
			.select('guest_id')
			.first());

	return valid;
}

async function reassignCleaner(guest_id, cleaner_id, role) {
	if (role === 'manager') {
		const [newCleaner] = await db('guests')
			.where({ guest_id })
			.update(
				{
					cleaner_id
				},
				'cleaner_id'
			);

		return { newCleaner };
	}

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

	const [newCleaner] = await db('reassignments').insert(
		{
			guest_id,
			cleaner_id,
			timestamp: moment.utc(Date.now())
		},
		'cleaner_id'
	);

	return { newCleaner };
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
