// Dependencies
const express = require('express');
const router = express.Router();

// Helpers
const userModel = require('../models/userModel');
const inviteModel = require('../models/inviteModel');

/* Checks for valid token, adds user to db if they aren't registered, and accepts a partnership if provided a valid invite code */

router.post('/login/:inviteCode*?', (req, res) => {
	const { user_name, email, img_url, role } = req.body; // Change to auth0 object
	const { inviteCode } = req.params;

	// TODO: verify the values are properly formatted and respond with errors for bad strings

	userModel
		.getUserByEmail(email)
		.then(user => {
			return user
				? { user }
				: userModel.addUser(user_name, email, img_url, role);
		})
		.then(({ notUnique, user }) => {
			if (notUnique) {
				res.status(403).json({ notUnique });
			} else if (inviteCode) {
				inviteModel
					.acceptInvite(user.user_id, inviteCode, email)
					.then(({ inviteAccepted, alreadyAccepted }) => {
						if (alreadyAccepted) {
							res.status(403).json({ alreadyAccepted });
						} else {
							res.status(200).json({ user, inviteAccepted, alreadyAccepted });
						}
					});
			} else {
				res.status(200).json({ user });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

module.exports = router;
