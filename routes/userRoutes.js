// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo  = require('../middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const inviteModel = require('../models/inviteModel');
const generateToken = require('../helpers/generateToken');

/* Check for a valid token, add the user to our db if they aren't registered, and create a partnership if provided a valid invite code */
router.post('/login/:inviteCode*?', checkJwt, async (req, res) => {
	const { nickname: user_name, email, picture: img_url, exp } = req.user;
	const { role } = req.body;
	const { inviteCode } = req.params;

	// TODO: verify arguments are properly formatted and respond with errors for bad strings
	console.log(req.user.sub);

	try {
		// Find user else create a new one
		const auth_provider = req.user.sub.split('|');
		console.log('PROVIDER', auth_provider);
		
		const user =
			(await userModel.getUserByEmail(email)) ||
			(await userModel.addUser(
				user_name,
				email,
				img_url,
				inviteCode ? 'assistant' : role,
				auth_provider[0]
			));

		if (user.notUnique) {
			// user_name and/or email are already taken
			return res.status(409).json({ notUnique });
		}

		// Attempt to accept invite if provided with inviteCode
		const inviteStatus =
			user.role === 'manager'
				? 'notAssistant'
				: inviteCode &&
				  (await inviteModel.acceptInvite(
						user.email,
						inviteCode,
						user.user_id
				  ));

		// Make a new token with the user data from our backend
		const userInfo = generateToken(user, exp);

		// Return user info
		console.log(req.user);
		return res.status(200).json({ userInfo, inviteStatus, user });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});


router.put('/', checkJwt, checkUserInfo, async (req, res) => {
	let user = req.user;

	console.log('old user', user);

	let newUser = {...user, ...req.body};

	console.log('new user', newUser);

	return res.status(200).json({newUser});

})

module.exports = router;
