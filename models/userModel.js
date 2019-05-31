const db = require('../data/dbConfig');

module.exports = {
	getUserByEmail,
	addUser,
	getUserById,
	getPartner,
	updateUser,
};

function getUserByEmail(email) {
	return db('users')
		.where({ email })
		.first();
}

async function getUserById(user_id){
	const user = await db('users')
		.where({user_id})
		.first();

	return user;
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
				email: notUnique.email === email
			}
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

function getPartner(manager_id, cleaner_id) {
	return db('partners')
		.where({ manager_id, cleaner_id })
		.first();
}

function updateUser(user_id, changes){
	return db('users').returning('*').where({user_id}).update(changes);
}