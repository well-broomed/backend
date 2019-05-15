const db = require('../data/dbConfig');

// Helpers
const checkForDuplicates = require('../Helpers/checkForDuplicates');

module.exports = {
	getProperties,
	getProperty,
	addProperty,
	updateProperty,
	checkOwner,
	getCleaners,
	changeCleaner,
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

async function addProperty(
	manager_id,
	property_name,
	address,
	img_url,
	cleaner_id,
	guest_guide,
	assistant_guide
) {
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

	if (notUnique) return { notUnique };

	// Add new property
	const [property_id] = await db('properties').insert(
		{
			manager_id,
			property_name,
			address,
			img_url,
			cleaner_id,
			guest_guide,
			assistant_guide
		},
		'property_id'
	);

	return { property_id };
}

async function updateProperty(
	manager_id,
	property_id,
	property_name,
	address,
	img_url,
	cleaner_id,
	guest_guide,
	assistant_guide
) {
	const notUniqueProperties = await db('properties')
		.where({ manager_id, property_name })
		.orWhere({ manager_id, address })
		.select('property_id', 'property_name', 'address');

	const notUnique = checkForDuplicates(
		{ property_name, address },
		notUniqueProperties,
		'property_name',
		{ key: 'property_id', value: property_id }
	);

	if (notUnique) return { notUnique };

	// Update property
	const [updated] = await db('properties')
		.where({ property_id })
		.update(
			{
				property_name,
				address,
				img_url,
				cleaner_id,
				guest_guide,
				assistant_guide
			},
			'property_id'
		);

	return { updated };
}

function checkOwner(manager_id, property_id) {
	return db('properties')
		.where({ manager_id, property_id })
		.select('property_id')
		.first();
}

function getCleaners(manager_id){
	return db('partners')
		.where({manager_id})
		.select('cleaner_id')
}

async function changeCleaner(property_id, cleaner_id){
	const [updated] = await db('properties')
		.returning('*')
		.where({property_id})
		.update({cleaner_id});
		
		return {updated};
}