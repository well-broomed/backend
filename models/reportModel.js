const db = require('../data/dbConfig');

const knexfile = require('../knexfile');
const knex = require('knex')(knexfile[process.env.NODE_ENV || 'development']);

module.exports = { getReports, getPastReports };

async function getReports(manager_id, timeNow) {
	const selectFields =
		'g.property_id, p.property_name, g.guest_id, g.guest_name, g.cleaner_id, u.user_name as cleaner_name, g.checkin, g.checkout';

	const groupdByFields =
		'g.property_id, p.property_name, g.guest_id, g.guest_name, g.cleaner_id, cleaner_name, g.checkin, g.checkout';

	const recent = await db('g')
		.with('g', knex.raw('select * from guests where checkout < ?', timeNow))
		.joinRaw(
			`left join g as g2
			on g.property_id = g2.property_id
			and g.checkin < g2.checkin`
		)
		.join('properties as p', 'g.property_id', 'p.property_id')
		.where({ 'p.manager_id': manager_id, 'g2.checkin': null })
		.leftJoin('users as u', 'g.cleaner_id', 'u.user_id')
		.leftJoin('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
		.join('tasks as t', 'gt.task_id', 't.task_id')
		.where('t.deadline', '>', 0)
		.select(
			knex.raw(
				`${selectFields}, floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
			)
		)
		.groupBy(knex.raw(`${groupdByFields}`));

	const current = await db('guests as g')
		.where('checkin', '<', timeNow)
		.andWhere('checkout', '>', timeNow)
		.join('properties as p', 'g.property_id', 'p.property_id')
		.where({ 'p.manager_id': manager_id })
		.leftJoin('users as u', 'g.cleaner_id', 'u.user_id')
		.leftJoin('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
		.join('tasks as t', 'gt.task_id', 't.task_id')
		.where('t.deadline', '=', 0)
		.select(
			knex.raw(
				`${selectFields}, floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
			)
		)
		.groupBy(knex.raw(`${groupdByFields}`));

	const upcoming = await db('g')
		.with('g', knex.raw('select * from guests where checkin > ?', timeNow))
		.joinRaw(
			`left join g as g2
			on g.property_id = g2.property_id
			and g.checkin > g2.checkin`
		)
		.join('properties as p', 'g.property_id', 'p.property_id')
		.where({ 'p.manager_id': manager_id, 'g2.checkin': null })
		.leftJoin('users as u', 'g.cleaner_id', 'u.user_id')
		.leftJoin('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
		.join('tasks as t', 'gt.task_id', 't.task_id')
		.where('t.deadline', '<', 0)
		.select(
			knex.raw(
				`${selectFields}, floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
			)
		)
		.groupBy(knex.raw(`${groupdByFields}`));

	return { recent, current, upcoming };
}

function getPastReports(manager_id, timeNow) {
	const selectFields =
		'g.property_id, p.property_name, g.guest_id, g.guest_name, g.cleaner_id, u.user_name as cleaner_name, g.checkout';

	const groupdByFields =
		'g.property_id, p.property_name, g.guest_id, g.guest_name, g.cleaner_id, cleaner_name, g.checkout';

	return db('guests as g')
		.where('g.checkout', '<', timeNow)
		.join('properties as p', 'g.property_id', 'p.property_id')
		.where({ 'p.manager_id': manager_id })
		.leftJoin('users as u', 'g.cleaner_id', 'u.user_id')
		.leftJoin('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
		.join('tasks as t', 'gt.task_id', 't.task_id')
		.select(
			knex.raw(
				`${selectFields}, floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
			)
		)
		.groupBy(knex.raw(`${groupdByFields}`))
		.orderBy('g.checkout', 'desc');
}
