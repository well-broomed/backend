// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');
const checkUserInfo = require('../Middleware/checkUserInfo');

// Helpers
const guestModel = require('../models/guestModel');

// Routes
/** Get guests by user_id */
router.get('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	try {
		const guests = await guestModel.getGuests(user_id, role);

		res.status(200).json({ guests });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Get a guest by guest_id */
router.get('/:guest_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { guest_id } = req.params;

	try {
		const guest = await guestModel.getguest(user_id, guest_id, role);

		if (!guest) {
			return res.status(404).json({ error: 'guest not found' });
		}

		res.status(200).json({ guest });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

module.exports = router;
