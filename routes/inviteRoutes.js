// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const inviteModel = require('../models/inviteModel');

/** Accept an invitation */
router.get('/accept/:inviteCode', checkJwt, checkUserInfo, (req, res) => {
	const { email, user_id } = req.user;
	const { inviteCode } = req.params;

	inviteModel
		.acceptInvite(email, inviteCode, user_id)
		.then(({ inviteStatus }) => {
			if (inviteStatus !== 'accepted') {
				res.status(403).json({ inviteStatus });
			} else {
				res.status(201).json({ inviteStatus });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

/** Invite a user */
router.post('/', checkJwt, checkUserInfo, (req, res) => {
	const { user_id: manager_id, role } = req.user;
	const { cleaner_email } = req.body;
	// TODO: verify arguments are properly formatted and respond with errors for bad strings

	// Verify that user is a manager
	if (role !== 'manager') {
		return res.status(403).json({ error: 'Must be manager to invite users' });
	}

	// Improve this to detect malformed email strings
	if (!cleaner_email) {
		return res.status(400).json({ error: 'Must provide valid email' });
	}

	inviteModel
		.inviteUser(manager_id, cleaner_email)
		.then(({ alreadyInvited, alreadyPartnered, inviteCode, mailgunErr }) => {
			if (!inviteCode) {
				res.status(403).json({ alreadyInvited, alreadyPartnered });
			}
			else if(mailgunErr)
				res.status(403).json({mailgunErr});
			else {
				res.status(201).json({ inviteCode });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

module.exports = router;
