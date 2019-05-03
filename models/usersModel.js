const db = require('../data/dbConfig');

module.exports = {
	getUsers: async () => {
		const allUsers = await db('users');
		return allUsers;
	}
};
