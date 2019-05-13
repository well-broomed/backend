// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');
const checkUserInfo = require('../Middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');

// Routes
/** Get properties by user_id */
router.get('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	try {
		const properties = await propertyModel.getProperties(user_id, role);

		if (!properties[0]) {
			return res.status(404).json({ error: 'no properties found' });
		}

		res.status(200).json({ properties });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Get a property by property_id */
router.get('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { property_id } = req.params;

	try {
		const property = await propertyModel.getProperty(
			user_id,
			property_id,
			role
		);

		if (!property) {
			return res.status(404).json({ error: 'property not found' });
		}

		res.status(200).json({ property });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Add a new property */
router.post('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id: manager_id, role } = req.user;
	const {
		property_name,
		address,
		cleaner_id,
		guest_guide,
		assistant_guide
	} = req.body;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		if (cleaner_id && !(await userModel.getPartner(manager_id, cleaner_id))) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { property_id, notUnique } = await propertyModel.addProperty(
			manager_id,
			property_name,
			address,
			cleaner_id,
			guest_guide,
			assistant_guide
		);

		if (notUnique) {
			return res.status(403).json({ notUnique });
		}

		res.status(201).json({ property_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Update a property */
router.put('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id: manager_id, role } = req.user;
	const {
		property_name,
		address,
		cleaner_id,
		guest_guide,
		assistant_guide
	} = req.body;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		if (cleaner_id && !(await userModel.getPartner(manager_id, cleaner_id))) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { property_id, notUnique } = await propertyModel.updateProperty(
			manager_id,
			property_name,
			address,
			cleaner_id,
			guest_guide,
			assistant_guide
		);

		if (notUnique) {
			return res.status(403).json({ notUnique });
		}

		res.status(200).json({ property_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

module.exports = router;
