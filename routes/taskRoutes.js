// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');
const checkUserInfo = require('../Middleware/checkUserInfo');

// Helpers
const taskModel = require('../models/taskModel');

// Routes
/** Get tasks by property_id */
router.get('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { property_id } = req.params;

	try {
		const tasks = await taskModel.getTasks(user_id, property_id, role);

		// A valid property could have no tasks. Might want a better response for an invalid user/property combo.
		// if (!tasks[0]) {
		// 	return res.status(404).json({ error: 'property not found' });
		// }

		res.status(200).json({ tasks });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Add a task */

/** Update a task*/

/** Delete a task */

module.exports = router;
