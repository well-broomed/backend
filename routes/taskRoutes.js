// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../Middleware/checkJwt');
const checkUserInfo = require('../Middleware/checkUserInfo');

// Helpers
const taskModel = require('../models/taskModel');
const propertyModel = require('../models/propertyModel');

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
router.post('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { property_id } = req.params;
	const { description, deadline } = req.body;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		const valid = await propertyModel.checkOwner(user_id, property_id);

		if (!valid) {
			return res.status(403).json({ error: 'invalid property' });
		}

		const { task_id, notUnique } = await taskModel.addTask(
			user_id,
			property_id,
			description,
			deadline
		);

		if (notUnique) {
			return res.status(403).json({ notUnique });
		}

		res.status(200).json({ task_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Update a task*/
router.put('/:task_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { task_id } = req.params;
	const { description, deadline } = req.body;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		const { task_id, notUnique } = await taskModel.updateTask(
			user_id,
			task_id,
			description,
			deadline
		);

		if (notUnique) {
			return res.status(403).json({ notUnique });
		}

		if (!task_id) {
			return res.status(403).json({ error: 'invalid task' });
		}

		res.status(200).json({ task_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

/** Delete a task */
router.delete('/:task_id', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;
	const { task_id } = req.params;

	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	try {
		const deleted = await taskModel.removeTask(user_id, task_id);

		if (!deleted) {
			return res.status(403).json({ error: 'invalid task' });
		}

		res.status(200).json({ deleted });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

module.exports = router;
