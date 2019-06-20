const db = require('../data/dbConfig');

const randomString = require('../helpers/randomString');

//Mailgun variables
const mailgunKey = process.env.MAILGUN_KEY;
const mailgunDomain = process.env.MAILGUN_URL;
const Mailgun = require('mailgun-js');
const frontendUrl = process.env.REACT_APP_FRONTEND_URL || `http:/localhost:3000`;

module.exports = {
	inviteUser,
	acceptInvite,
	deleteInvite,
	getInviteInfo,
	getAllInvites,
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

	// // Generate an inviteCode
	const inviteCode = randomString(16);
	console.log('INVITE CODE', inviteCode);

	// Create an invite
	const [invite] = await db('invites').insert(
		{ manager_id, email, inviteCode },
		'inviteCode'
	);

	//MailGun
	const mailgun = new Mailgun({ apiKey: mailgunKey, domain: mailgunDomain });
	
	const manager = await db('users').where({user_id: manager_id}).select('user_name').first();
	//Content of Email Being Sent
	const data = {
		from: `${manager.user_name} <${manager.user_name}@well-broomed.com>`,
		to: email,
		subject: 'Well-Broomed Invitation',
		html:
			'Hello! You have been invited to join a property management team on Well Broomed.' +
			'If you would like to accept this invitation, please click this link: ' +
			`${frontendUrl}/invite?` +
			inviteCode
	};
	mailgun.messages().send(data, function(err, body) {
		if (err) {
			console.log('Mailgun got an error: ', err);
			return { mailgunErr: err };
		} else console.log('body:', body);
	});

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

function deleteInvite(inviteCode){
	return db('invites').where({inviteCode}).del();
}

function getInviteInfo(inviteCode){
	return db.select('*').from('invites').where({inviteCode}).first();
}

function getAllInvites(manager_id){
	return db.select('*').from('invites').where({manager_id});
}