// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');
const checkUserInfo = require('../Middleware/checkUserInfo');

// Helpers
const guestModel = require('../models/guestModel');
const propertyModel = require('../models/propertyModel');

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

/** Add a guest */
router.post('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { property_id } = req.params;
	const { guest_name, checkin, checkout, email, cleaner_id } = req.body;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		const valid = await propertyModel.checkOwner(user_id, property_id);

		if (!valid) {
			return res.status(403).json({ error: 'invalid property' });
		}

		// Need to update this to take availability into account
		if (cleaner_id && !(await userModel.getPartner(manager_id, cleaner_id))) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { guest_id, notUnique } = await guestModel.addGuest(
			property_id,
			checkin,
			checkout,
			email,
			cleaner_id
		);

		if (notUnique) {
			return res.status(403).json({ notUnique });
		}

		res.status(200).json({ guest_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

module.exports = router;
