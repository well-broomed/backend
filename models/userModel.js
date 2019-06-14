const db = require('../data/dbConfig');

const knexfile = require('../knexfile');
const knex = require('knex')(knexfile[process.env.NODE_ENV || 'development']);

const moment = require('moment');

const Promise = require('bluebird');

module.exports = {
	getUserByEmail,
	getUserById,
	getPartners,
	getPartner,
	addUser,
	updateUser,
};

function getUserByEmail(email) {
	return db('users')
		.where({ email })
		.first();
}

async function getUserById(user_id) {
	const user = await db('users')
		.where({ user_id })
		.first();

	return user;
}

async function getPartners(manager_id) {
	const timeNow = moment.utc().format();

	const partners = await db('partners as prt')
		.where({ manager_id })
		.join('users as u', 'prt.cleaner_id', 'u.user_id')
		.select(
			'prt.cleaner_id',
			'u.user_name',
			'u.img_url',
			'u.address',
			'u.email',
			'u.phone'
		);

	return await Promise.map(partners, async partner => {
		const defaultProperties = await db('properties as p')
			.where({
				cleaner_id: partner.cleaner_id,
			})
			.select('p.property_id', 'p.property_name')
			.orderBy('p.property_name');

		const availableProperties = await db('available_cleaners as ac')
			.where({ 'ac.cleaner_id': partner.cleaner_id })
			.join('properties as p', 'ac.property_id', 'p.property_id')
			.select('p.property_id', 'p.property_name', 'p.cleaner_id')
			.orderBy('p.property_name');

		const completion = await db('guests as g')
			.where({ 'g.cleaner_id': partner.cleaner_id })
			.join('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
			.where('g.checkout', '<', timeNow)
			.select(
				knex.raw(
					`floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
				)
			)
			.first();

		return {
			...partner,
			defaultProperties,
			availableProperties,
			completion: completion.completion || null,
		};
	});
}

async function getPartner(manager_id, cleaner_id) {
	const timeNow = moment.utc().format();

	const partner = await db('partners as prt')
		.where({ manager_id, cleaner_id })
		.join('users as u', 'prt.cleaner_id', 'u.user_id')
		.select(
			'prt.cleaner_id',
			'u.user_name',
			'u.img_url',
			'u.address',
			'u.email',
			'u.phone'
		)
		.first();

	if (!partner) return null;

	const defaultProperties = await db('properties as p')
		.where({
			cleaner_id,
		})
		.select('p.property_id', 'p.property_name')
		.orderBy('p.property_name');

	const availableProperties = await db('available_cleaners as ac')
		.where({ 'ac.cleaner_id': cleaner_id })
		.join('properties as p', 'ac.property_id', 'p.property_id')
		.select('p.property_id', 'p.property_name', 'p.cleaner_id')
		.orderBy('p.property_name');

	const completion = await db('guests as g')
		.where({ 'g.cleaner_id': cleaner_id })
		.join('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
		.where('g.checkout', '<', timeNow)
		.select(
			knex.raw(
				`floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
			)
		)
		.first();

	const guestFields =
		'g.guest_id, g.guest_name, g.property_id, p.property_name, g.checkin, g.checkout';

	const guests = await db('guests as g')
		.where({ 'g.cleaner_id': cleaner_id })
		.join('properties as p', 'g.property_id', 'p.property_id')
		.join('guest_tasks as gt', 'g.guest_id', 'gt.guest_id')
		.select(
			knex.raw(
				`${guestFields}, floor(avg(case when gt.completed then 1 else 0 end) * 100) as completion`
			)
		)
		.groupBy(knex.raw(guestFields));

	return {
		...partner,
		defaultProperties,
		availableProperties,
		completion: completion.completion || null,
		guests,
	};
}

async function addUser(user_name, email, img_url, role, auth_provider) {
	// Is user_name or email already taken?
	const [notUnique] = await db('users')
		.where({ user_name })
		.orWhere({ email })
		.select('user_name', 'email');

	if (notUnique) {
		// Response: user_name and/or email not available
		return {
			notUnique: {
				name: notUnique.user_name === user_name,
				email: notUnique.email === email,
			},
		};
	}

	// Add new user
	const [user] = await db('users').insert(
		{ user_name, email, img_url, role, auth_provider },
		'*'
	);

	console.log('New user:\n', user);

	return user;
}

function updateUser(user_id, changes) {
	return db('users')
		.returning('*')
		.where({ user_id })
		.update(changes);
}
