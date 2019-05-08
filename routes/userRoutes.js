// Dependencies
const express = require('express');
const router = express.Router();

// Helpers
const userModel = require('../models/userModel');
const inviteModel = require('../models/inviteModel');

/* Check for a valid token, add the user to our db if they aren't registered, and create a partnership if provided a valid invite code */
router.get('/login/:inviteCode*?', checkJwt, (req, res) => {
	const { nickname: user_name, email, picture: img_url } = req.user;
	const { inviteCode } = req.params;

	// TODO: verify the values are properly formatted and respond with errors for bad strings

	userModel
		.getUserByEmail(email)
		.then(user => {
			// Return existing user's info, else create new user
			return user ? { user } : userModel.addUser(user_name, email, img_url);
		})
		.then(({ notUnique, user }) => {
			if (notUnique) {
				// user_name and/or email are already taken
				res.status(403).json({ notUnique });
			} else if (inviteCode) {
				// Attempt to accept invite
				inviteModel
					.acceptInvite(email, inviteCode)
					.then(({ inviteAccepted, alreadyAccepted }) => {
						// Return user info and status of invite
						res.status(200).json({ user, inviteAccepted, alreadyAccepted });
					});
			} else {
				// Return user info
				res.status(200).json({ user });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

module.exports = router;
