const db = require('../data/dbConfig');

// Helpers
const checkForDuplicates = require('../Helpers/checkForDuplicates');

module.exports = {
	getProperties,
	getProperty,
	addProperty,
	updateProperty
};

function getProperties(user_id, role) {
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

async function addProperty(
	manager_id,
	property_name,
	address,
	cleaner_id,
	guest_guide,
	assistant_guide
) {
	const [notUnique] = await db('properties')
		.where({ manager_id, property_name })
		.select('property_id');

	if (notUnique) {
		return {
			notUnique: notUnique.property_name
		};
	}

	// Add new user
	const [property] = await db('properties').insert(
		{
			manager_id,
			property_name,
			address,
			cleaner_id,
			guest_guide,
			assistant_guide
		},
		'property_id'
	);

	return { property_id: property.property_id };
}

async function updateProperty(
	manager_id,
	property_name,
	address,
	cleaner_id,
	guest_guide,
	assistant_guide
) {
	const properties = await db('properties')
		.where({ manager_id })
		.select('property_name', 'address');

	const notUnique = properties.checkForDuplicates(
		{ property_name, address },
		properties,
		'propery_name'
	);

	if (notUnique.property_name || notUnique.address) {
		return {
			notUnique
		};
	}

	// Add new user
	const [property] = await db('properties').update(
		{
			property_name,
			address,
			cleaner_id,
			guest_guide,
			assistant_guide
		},
		'property_id'
	);

	return { property_id: property.property_id };
}
