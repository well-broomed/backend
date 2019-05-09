const db = require('../data/dbConfig');

/* Retrieves properties for a given id. Checks the manager_id field in the properties table to return all properties */

getProperties = async id => {
	const properties = await db('properties').where({ manager_id: id });
	return properties;
};

/* Inserts new property to the properties table */
insert = async property => {
	const success = await db('properties').insert(property);
	return success;
};

module.exports = {
	getProperties,
	insert
};
