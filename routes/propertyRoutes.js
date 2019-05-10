// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');
const checkUserInfo = require('../Middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');

/** Add a new property */
router.post('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id: manager_id } = req.user;
	const {
		property_name,
		address,
		cleaner_id,
		guest_guide,
		assistant_guide
	} = req.body;

	try {
		const partnered =
			cleaner_id && (await userModel.getPartner(manager_id, cleaner_id));

		if (cleaner_id && !partnered) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { property_id } = await propertyModel.addProperty(
			manager_id,
			property_name,
			address,
			cleaner_id,
			guest_guide,
			assistant_guide
		);

		res.status(201).json({ property_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

module.exports = router;
