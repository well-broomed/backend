const db = require('../data/dbConfig');

module.exports = {
	getUserByEmail,
	addUser
};

function getUserByEmail(email) {
	return db('users')
		.where({ email })
		.first();
}

async function addUser(user_name, email, img_url) {
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
		{ user_name, email, img_url, role: 'manager' },
		'*'
	);

	console.log('New user:\n', user);

	return { user };
}
