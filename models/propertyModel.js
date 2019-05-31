const db = require('../data/dbConfig');

const knex = require('knex');

const Promise = require('bluebird');

// Helpers
const checkForDuplicates = require('../helpers/checkForDuplicates');

module.exports = {
	getProperties,
	getProperty,
	addProperty,
	updateProperty,
	checkOwner,

	getCleaners,
	changeCleaner,
	getPartners,

	checkCleaner,
	updateAvailability
};

async function getProperties(user_id, role) {
	const managerPropertyFields =
		'p.property_id, p.property_name, p.cleaner_id, p.address, p.img_url, p.guest_guide, p.assistant_guide';

	const assistantPropertyFields =
		'p.property_id, p.property_name, p.manager_id, p.address, p.img_url, p.guest_guide, p.assistant_guide';

	const properties =
		role === 'manager'
			? await db('properties as p')
					.where({ manager_id: user_id })
					.leftJoin('tasks as t', 'p.property_id', 't.property_id')
					.select(
						knex.raw(
							`${managerPropertyFields}, count(t.property_id) as task_count`
						)
					)
					.groupByRaw(managerPropertyFields)
					.orderBy('property_name') // Could be improved by using natural-sort
			: await db('properties as p')
					.join('partners as prt', 'p.manager_id', 'prt.manager_id')
					.where({ 'prt.cleaner_id': user_id })
					.leftJoin(
						'available_properties as ap',
						'p.property_id',
						'ap.property_id'
					)
					.leftJoin('tasks as t', 'p.property_id', 't.property_id')
					.select(
						knex.raw(
							`${assistantPropertyFields}, count(t.property_id) as task_count`
						)
					)
					.groupByRaw(assistantPropertyFields)
					.orderBy('property_name'); // Could be improved by using natural-sort

	if (role !== 'manager') return properties;

	return await Promise.map(properties, async property => {
		const available_cleaners = await db('available_properties as ap')
			.where({
				property_id: property.property_id
			})
			.join('users as u', 'ap.cleaner_id', 'u.user_id')
			.select('ap.cleaner_id', 'u.user_name as cleaner_name');

		return { ...property, available_cleaners };
	});
}

async function getProperty(user_id, property_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	const property =
		role === 'manager'
			? await db('properties')
					.where({ manager_id: user_id, property_id })
					.first()
			: await db('properties')
					.join('partners', 'partners.manager_id', 'properties.manager_id')
					.where({ 'partners.cleaner_id': user_id, property_id })
					.select('properties.*')
					.first();

	if (!property) return {};

	const tasks = await db('tasks')
		.where({ property_id })
		.select('task_id', 'text', 'deadline');

	const available_cleaners = await db('available_properties as ap')
		.where({
			property_id: property.property_id
		})
		.join('users as u', 'ap.cleaner_id', 'u.user_id')
		.select('ap.cleaner_id', 'u.user_name as cleaner_name');

	return { ...property, tasks, available_cleaners };
}

async function addProperty(propertyInfo) {
	const { manager_id, property_name, address } = propertyInfo;

	// Check for duplicate property names and addresses
	const notUniqueProperties = await db('properties')
		.where({ manager_id, property_name })
		.orWhere({ manager_id, address })
		.select('property_name', 'address');

	const notUnique =
		notUniqueProperties[0] &&
		(await checkForDuplicates(
			{ property_name, address },
			notUniqueProperties,
			'property_name'
		));

	if (notUnique) {
		return { notUnique };
	}

	// Add new property
	const [property_id] = await db('properties').insert(
		propertyInfo,
		'property_id'
	);

	return { property_id };
}

async function updateProperty(manager_id, property_id, propertyInfo) {
	// Will update this later. Needs to handle undefined property_name and/or address
	// const { property_name, address } = propertyInfo;

	// // Check for duplicate property names and addresses
	// const notUniqueProperties = await db('properties')
	// 	.whereNot({ property_id })
	// 	.andWhere({ manager_id, property_name })
	// 	.orWhereNot({ property_id })
	// 	.andWhere({ manager_id, address })
	// 	.select('property_id', 'property_name', 'address');

	// console.log('notUniqueProperties:', notUniqueProperties);

	// const notUnique =
	// 	notUniqueProperties[0] &&
	// 	(await checkForDuplicates(
	// 		{ property_name, address },
	// 		notUniqueProperties,
	// 		'property_name'
	// 	));

	// if (notUnique) return { notUnique };

	// Update property
	const updated = await db('properties')
		.where({ manager_id, property_id })
		.update(propertyInfo);

	return { updated };
}

function checkOwner(manager_id, property_id) {
	return db('properties')
		.where({ manager_id, property_id })
		.select('property_id')
		.first();
}

function getCleaners(manager_id) {
	return db('partners')
		.where({ manager_id })
		.select('cleaner_id');
}

async function getPartners(manager_id){
	 const partners = await db('users')
	 	.join('partners', 'users.user_id', 'partners.cleaner_id')
	 	.where({manager_id})
	 	.select('*');
	return partners;
}

async function changeCleaner(property_id, cleaner_id) {
	const [updated] = await db('properties')
		.returning('*')
		.where({ property_id })
		.update({ cleaner_id });

	return { updated };
}

function checkCleaner(cleaner_id, property_id) {
	return db('properties')
		.join('partners', 'properties.manager_id', 'partners.manager_id')
		.where({ property_id, 'partners.cleaner_id': cleaner_id })
		.select('property_id')
		.first();
}

// Doesn't check for existing entries; can possibly return ugly errors
async function updateAvailability(cleaner_id, property_id, available) {
	console.log('stuff:', { cleaner_id, property_id, available });

	return available
		? (await db('available_properties').insert(
				{ cleaner_id, property_id },
				'cleaner_id'
		  ))[0]
		: await db('available_properties')
				.where({ cleaner_id, property_id })
				.del();
}
