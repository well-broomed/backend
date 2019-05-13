const db = require('../data/dbConfig');

const randomString = require('../helpers/randomString');
const mailgunKey = process.env.MAILGUN_KEY
const mailgunDomain = process.env.MAILGUN_URL
const mg = require('mailgun-js')({apiKey: mailgunKey, domain: mailgunDomain});

module.exports = {
	inviteUser,
	acceptInvite
};

async function inviteUser(manager_id, email) {
	const [cleaner] = await db('users').where({ email });

	if (cleaner) {
		const [alreadyPartnered] = await db('partners').where({
			manager_id,
			cleaner_id: cleaner.user_id
		});

		if (alreadyPartnered) {
			return { alreadyPartnered: true };
		}
	}

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
		{ manager_id, email, inviteCode },
		'inviteCode'
	);

	//Input mailgun code here
	console.log(`Invite code '${invite}' sent to ${email}`);

	return { inviteCode: invite };
}

async function acceptInvite(email, inviteCode, cleaner_id) {
	// Is this a valid invite?
	const [invite] = await db('invites').where({ email, inviteCode });

	if (invite) {
		const { manager_id } = invite;

		// Start a transaction
		return db.transaction(async trx => {
			// Look for existing partnership
			const [alreadyPartnered] = await db('partners').where({
				manager_id,
				cleaner_id
			});

			if (alreadyPartnered) {
				return { inviteStatus: 'alreadyPartnered' };
			}

			// Create a new partnership
			const [partnership] = await trx('partners').insert(
				{ manager_id, cleaner_id },
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

			return { inviteStatus: 'accepted' };
		});
	}

	return { inviteStatus: 'invalid' };
}
