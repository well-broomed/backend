// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');

// Mailgun 
const mailgunKey = process.env.MAILGUN_KEY;
const mailgunDomain = process.env.MAILGUN_URL;
const Mailgun = require('mailgun-js');

// Routes
/** Get properties by user_id */
router.get('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	try {
		const properties = await propertyModel.getProperties(user_id, role);

		res.status(200).json({ properties });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Get properties with less info for 'default properties' dropdowns */
router.get('/defaults', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	try {
		const defaultProperties = await propertyModel.getDefaultProperties(
			user_id,
			role
		);

		res.status(200).json({ defaultProperties });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Get Properties and cleaners (for adding/adding guests) */
router.get('/cleaners', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		const { cleaners, unreducedPC } = await propertyModel.getPropertyCleaners(
			user_id
		);

		let p = null;
		let i = -1;

		const propertyCleaners = unreducedPC.reduce(
			(arr, { property_id, property_name, cleaner_id, cleaner_name }) => {
				if (property_id === p) {
					arr[i].cleaners.push({ cleaner_id, cleaner_name });
				} else {
					p = property_id;
					arr.push({
						property_id,
						property_name,
						cleaners: [{ cleaner_id, cleaner_name }],
					});
					i++;
				}

				return arr;
			},
			[]
		);

		res.status(200).json({ cleaners, propertyCleaners });
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
		img_url,
		cleaner_id,
		guest_guide,
		assistant_guide,
	} = req.body;

	const propertyInfo = {
		manager_id,
		property_name,
		address,
		img_url,
		cleaner_id,
		guest_guide,
		assistant_guide,
	};

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		if (cleaner_id && !(await userModel.getPartner(manager_id, cleaner_id))) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { property_id, notUnique } = await propertyModel.addProperty(
			propertyInfo
		);

		if (notUnique) {
			return res.status(409).json({ notUnique });
		}

		res.status(201).json({ property_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Update a property */
router.put('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { property_id } = req.params;
	const {
		property_name,
		address,
		img_url,
		cleaner_id,
		guest_guide,
		assistant_guide,
	} = req.body;

	// Programmatically assign updated values based on what has been submitted
	const propertyInfo = {};

	for(var key in req.body){
		if(key !== undefined){
			propertyInfo[key] = req.body[key]
		}
	}

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		if (cleaner_id && !(await userModel.getPartner(user_id, cleaner_id))) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { updated, notUnique } = await propertyModel.updateProperty(
			user_id,
			property_id,
			propertyInfo
		);

		if (notUnique) {
			return res.status(409).json({ notUnique });
		}

		if (!updated) {
			return res.status(404).json({ error: 'invalid property' });
		}

		res.status(200).json({ updated });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/**
 * Delete a property
 */

router.delete('/:property_id', checkJwt, checkUserInfo, (req, res) => {
	const property_id = req.params.property_id;

	propertyModel.deleteProperty(property_id).then(status => {
		return res.status(200).json({message: `Property successfully deleted.`})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

/** Update availability */
router.put(
	'/:property_id/available/:cleaner_id*?',
	checkJwt,
	checkUserInfo,
	async (req, res) => {
		const { user_id, role } = req.user;
		const { property_id, cleaner_id } = req.params;
		const { available } = req.body;

		// If cleaner_id is provided, user_id is the property manager
		if (cleaner_id && +cleaner_id !== user_id && role !== 'manager') {
			return res.status(403).json({ error: 'not a manager' });
		}

		try {
			// Check property manager
			if (
				cleaner_id &&
				!(await propertyModel.checkOwner(user_id, property_id))
			) {
				return res.status(404).json({ error: 'invalid property' });
			}

			// Check partnership
			if (
				!(await propertyModel.checkCleaner(cleaner_id || user_id, property_id))
			) {
				return res.status(404).json({ error: 'invalid assistant' });
			}

			// Add or remove availability
			const updated = await propertyModel.updateAvailability(
				cleaner_id || user_id,
				property_id,
				available
			);

			if (!updated) {
				return res.status(500).json({ error: 'something went wrong' });
			}

			const mailgun = new Mailgun({
				apiKey: mailgunKey,
				domain: mailgunDomain
			});

			const cleaner = await userModel.getUserById(cleaner_id);
			const newProperty = await propertyModel.getProperty(
				user_id,
				property_id,
				role
			);

			console.log(newProperty, available);

			const data = {
				from: `Well-Broomed <Broom@well-broomed.com>`,
				to: `${cleaner.email}`,
				subject: 'Reassignment',
				html: available
					? `Hello ${cleaner.user_name}, you have been made available for ${
							newProperty.property_name
					  } located at ${
							newProperty.address
					  }. Please contact your manager for further details or questions.`
					: `Hello ${cleaner.user_name}, you have been made unavailable for ${
							newProperty.property_name
					  } located at ${
							newProperty.address
					  }. Please contact your manager for further details or questions.`
			};

			mailgun.messages().send(data, function(err, body) {
				if (err) {
					console.log('Mailgun got an error: ', err);
					return { mailgunErr: err };
				} else console.log('body:', body);
			});

			console.log(updated);

			res.status(200).json({ updated });
		} catch (error) {
			console.error(error);
			res.status(500).json({ error });
		}
	}
);

module.exports = router;
