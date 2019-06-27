// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const inviteModel = require('../models/inviteModel');
const userModel = require('../models/userModel');

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
			} else if (mailgunErr) {
				res.status(403).json({ mailgunErr });
			} else {
				res.status(201).json({ inviteCode });
			}
		})
		.catch(error => {
			console.error(error);
			res.status(500).json({ error });
		});
});

router.delete('/:inviteCode', checkJwt, checkUserInfo, (req, res) => {
	let inviteCode = req.params.inviteCode;

	inviteModel.deleteInvite(inviteCode).then(status => {
		return res.status(200).json({ message: `Invite deletion successful.` });
	});
});

/** Fetch information about a specific invitation code */

router.get('/info/:inviteCode', (req, res) => {
	let inviteCode = req.params.inviteCode;

	inviteModel
		.getInviteInfo(inviteCode)
		.then(status => {
			if (!status || status === []) {
				// handle invalid codes
				return res.status(404).json({ message: `Invitation not found.` });
			}

			let inviteInfo = status;

			// retrieve profile information of the inviting manager
			userModel
				.getUserById(inviteInfo.manager_id)
				.then(status => {
					let managerInfo = {};
					// extract necessary information
					managerInfo.email = status.email;
					managerInfo.user_name = status.user_name;
					managerInfo.img_url = status.img_url;
					// assign profile to inviteInfo object
					inviteInfo.manager_profile = managerInfo;
					return res.status(200).json({ inviteInfo: inviteInfo });
				})
				.catch(err => {
					console.log(err);
					return res.status(500).json({ error: `Internal server error.` });
				});
		})
		.catch(err => {
			console.log(err);
			return res.status(500).json({ error: `Internal server error.` });
		});
});

/** Fetch information about all pending invitations */

router.get('/all', checkJwt, checkUserInfo, (req, res) => {
	let manager_id = req.user.user_id;

	inviteModel
		.getAllInvites(manager_id)
		.then(status => {
			return res.status(200).json({ invites: status });
		})
		.catch(err => {
			console.log(err);
			return res.status(500).json({ error: `Internal server error.` });
		});
});

module.exports = router;
