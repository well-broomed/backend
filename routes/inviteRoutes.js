// Dependencies
const express = require('express');
const router = express.Router();

// Helpers
const inviteModel = require('../models/inviteModel');

// TODO: authentication middleware

// Invite a user
router.post('/', (req, res) => {
	const { user_id, role } = req.body; // Change to auth0 object
	const { cleaner_id, email } = req.body;

	// TODO: verify the values are properly formatted and respond with errors for bad strings

	// Verify that user is a manager
	if (role !== 'manager') {
		res.status(401).json({ error: 'Must be manager to invite users' });
		return;
	}

	inviteModel
		.inviteUser(user_id, cleaner_id, email)
		.then(({ alreadyInvited, inviteCode }) => {
			if (alreadyInvited) {
				res.status(403).json({ alreadyInvited });
			} else {
				res.status(201).json({ inviteCode });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

// Accept an invitation
router.post('/:inviteCode', (req, res) => {
	const { user_id } = req.user;
	const { inviteCode } = req.params;

	inviteModel.acceptInvite(user_id, inviteCode);
});

module.exports = router;
