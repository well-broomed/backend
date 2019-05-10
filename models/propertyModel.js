const db = require('../data/dbConfig');

module.exports = {
	addProperty
};

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
			notUnique: notUnique.property_id
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
