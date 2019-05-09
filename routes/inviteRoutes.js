// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');

// Helpers
const inviteModel = require('../models/inviteModel');

/* Accept an invitation */
router.get('/accept/:inviteCode', checkJwt, (req, res) => {
	const { email } = req.user;
	const { inviteCode } = req.params;

	inviteModel
		.acceptInvite(email, inviteCode)
		.then(({ inviteAccepted, alreadyAccepted }) => {
			if (!invitedAccepted) {
				res.status(403).json({ inviteAccepted, alreadyAccepted });
			} else {
				res.status(201).json({ inviteAccepted });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

/* Invite a user */
router.get('/:cleaner_email', checkJwt, (req, res) => {
	const { email: manager_email } = req.user;
	const { cleaner_email } = req.params;

	// TODO: verify the values are properly formatted and respond with errors for bad strings

	// Verify that user is a manager (disabled until roles are included in tokens)
	// if (role !== 'manager') {
	// 	res.status(401).json({ error: 'Must be manager to invite users' });
	// 	return;
	// }

	inviteModel
		.inviteUser(manager_email, cleaner_email)
		.then(({ alreadyInvited, alreadyPartnered, inviteCode }) => {
			if (alreadyInvited) {
				res.status(403).json({ alreadyInvited, alreadyPartnered });
			} else {
				res.status(201).json({ inviteCode });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

module.exports = router;
