const db = require('../data/dbConfig');

// Helpers
const checkForDuplicates = require('../Helpers/checkForDuplicates');

module.exports = {
	getProperties,
	getProperty,
	addProperty,
	updateProperty,
	checkOwner
};

async function getProperties(user_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	return role === 'manager'
		? db('properties').where({ manager_id: user_id })
		: db('properties')
				.join('partners', 'partners.manager_id', 'properties.manager_id')
				.where({ 'partners.cleaner_id': user_id })
				.select('properties.*');
}

function getProperty(user_id, property_id, role) {
	// This implementation doesn't support managers as assistants to other managers
	return role === 'manager'
		? db('properties')
				.where({ manager_id: user_id, property_id })
				.first()
		: db('properties')
				.join('partners', 'partners.manager_id', 'properties.manager_id')
				.where({ 'partners.cleaner_id': user_id, property_id })
				.select('properties.*')
				.first();
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
