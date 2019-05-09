const db = require('../data/dbConfig');

getProperties = async id => {
	const properties = await db('properties').where({ manager_id: id });
	return properties;
};

insert = async property => {
	const success = await db('properties').insert(property);
	return success;
};

module.exports = {
	getProperties
};
