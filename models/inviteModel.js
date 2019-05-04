const db = require('../data/dbConfig');

const randomString = require('../helpers/randomString');

module.exports = {
	inviteUser,
	acceptInvite
};

async function inviteUser(manager_id, cleaner_id, email) {
	// Does invite already exist?
	const [alreadyInvited] = await db('invites').where({ manager_id, email });

	if (alreadyInvited) {
		// Response: already invited this user
		return { alreadyInvited: true };
	}

	// Generate an inviteCode
	const inviteCode = randomString(16);

	// Create an invite
	const [invite] = await db('invites').insert(
		{ manager_id, cleaner_id, email, inviteCode },
		'inviteCode'
	);

	console.log(`Invite code '${invite}' sent to ${email}`);

	return { inviteCode: invite };
}

async function acceptInvite(cleaner_id, inviteCode, email) {
	// Is this a valid invite?
	const [invite] = await db('invites').where({ email, inviteCode });

	if (invite) {
		// Start a transaction
		return db.transaction(async trx => {
			const [alreadyPartnered] = await db('partners').where({
				manager_id: invite.manager_id,
				cleaner_id
			});

			if (alreadyPartnered) {
				return { alreadyAccepted: true };
			}

			// Create a new partnership
			const [partnership] = await trx('partners').insert(
				{
					manager_id: invite.manager_id,
					cleaner_id
				},
				'*'
			);

			// Failed insert?
			if (!partnership) {
				trx.rollback;
			}

			// Update invite status
			const [accepted] = await db('invites')
				.where({ inviteCode })
				.update({ status: 1 }, 'inviteCode');

			// Failed update?
			if (!accepted) {
				trx.rollback;
			}

			console.log('New partnership:\n', partnership);

			return { inviteAccepted: true };
		});

		return { inviteAccepted: false };
	}
}
