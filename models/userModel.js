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

async function addUser(user_name, email, img_url, role) {
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
		{ user_name, email, img_url, role },
		'*'
	);

	console.log('New user:\n', user);

	return { user };
}

/* Old code */

// async function addUser(user_name, email, role, inviteCode) {
// 	try {
// 		// Is user_name or email already taken?
// 		const [notUnique] = await db('users')
// 			.where({ user_name })
// 			.orWhere({ email })
// 			.select('user_name', 'email');

// 		if (notUnique) {
// 			// Response: user_name and/or email not available
// 			return {
// 				notUniqueName: notUnique.user_name === user_name,
// 				notUniqueEmail: notUnique.email === email
// 			};
// 		}

// 		// Start a transaction
// 		return db.transaction(async trx => {
// 			// Insert the user
// 			const [userInfo] = trx('users')
// 				.insert({ user_name, email, role })
// 				.returning(['user_id', 'user_name', 'email', 'role']);

// 			// Failed insert?
// 			if (!userInfo) {
// 				trx.rollback;
// 			}

// 			// Registered via an invite link?
// 			if (inviteCode) {
// 				// Does this email/inviteCode pair exist?
// 				const [invite] = await trx('invites').where({ email, inviteCode });

// 				if (!invite) {
// 					// Response: successful signup, invalid inviteCode
// 					return { userInfo, invalidCode: true };
// 				}

// 				// Create a new partnership
// 				const [partnership] = await trx('partners')
// 					.insert({
// 						manager_id: invite.manager_id,
// 						cleaner_id: userInfo.user_id
// 					})
// 					.returning(['manager_id', 'cleaner_id']);

// 				// Failed insert?
// 				if (!partner) {
// 					trx.rollback;
// 				}
// 			}

// 			// Response: successful signup
// 			return { userInfo };
// 		});
// 	} catch (error) {
// 		console.error(error);

// 		return { error };
// 	}
// }
