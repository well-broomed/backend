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

const rp = require('request-promise');

/* Check for a valid token, add the user to our db if they aren't registered, and create a partnership if provided a valid invite code */
router.post('/login/:inviteCode*?', checkJwt, async (req, res) => {
	const { nickname: user_name, email, picture: img_url, exp } = req.user;
	const { role } = req.body;
	const { inviteCode } = req.params;

	/**
	 * TODO: Ensure that the user's username is their full name for social logins,
	 * otherwise use the username given at sign-up for database logins.
	 */

	// TODO: verify arguments are properly formatted and respond with errors for bad strings

	try {
		// Find user else create a new one
		const auth_provider = req.user.sub.split('|');
		
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
		return res.status(200).json({ userInfo, inviteStatus, user });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});


router.put('/:user_id', checkJwt, checkUserInfo, async (req, res) => {
	const user_id = req.params.user_id;
	const changes = req.body;

	// update auth0 with the new user information

	// the auth0 api user id
	const auth0id = req.user.sub;

	// initialize the body object
	const updateObj = {};

	// parse which fields to send in the update
	// we have to do this since auth0 uses 'username' and we use 'user_name'
	if(changes.user_name){
		updateObj.username = changes.user_name;
	} else if (changes.password){
		updateObj.password = changes.password;
	} else if (changes.email){
		updateObj.email = changes.email;
	}

	const auth0user = {
		uri: `${process.env.AUTH0_API}users/${auth0id}`,
		headers: {
			Authorization: `Bearer ${process.env.AUTH0_MANAGEMENT_JWT}`,
		},
		body: updateObj,
		json: true,
	}

	rp.patch(auth0user).then(status => {
		console.log('auth0 return status', status);
		
		// parse the returned updated auth0 user object for our internal api
		const userUpdate = {
			user_name: status.username,
			email: status.email,
			img_url: status.picture,
		}

		userModel.updateUser(user_id, userUpdate).then(status => {
			console.log('internal status', status);

			// refresh the userinfo token
			const userInfo = generateToken(status, req.user.exp);
		
			return res.status(200).json({user: status[0], userInfo: userInfo});
		}).catch(err => {
			console.log(err);
			return res.status(500).json({error: `Internal server error.`})
		})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

module.exports = router;
