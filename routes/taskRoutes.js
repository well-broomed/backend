// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const taskModel = require('../models/taskModel');
const propertyModel = require('../models/propertyModel');

// Routes
/** Get tasks by property_id */

router.get('/p/:property_id', checkJwt, checkUserInfo, (req, res) => {

	const property_id = req.params.property_id;

	taskModel.getByProperty(property_id).then(status => {
		console.log(status);

		return res.status(200).json({tasks: status})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
});

router.get('/l/:list_id', checkJwt, checkUserInfo, (req, res) => {
	const list_id = req.params.list_id;

	taskModel.getByList(list_id).then(status => {
		console.log(status);
		return res.status(200).json({tasks: status})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
});

router.post('/', checkJwt, checkUserInfo, (req, res) => {
	const task = req.body;

	taskModel.add(task).then(status => {
		console.log(status);
		return res.status(201).json({task: status});
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`});
	})
});

router.put('/', checkJwt, checkUserInfo, (req, res) => {
	const changes = req.body;

	taskModel.update(changes.task_id, changes).then(status => {
		console.log(status);

		return res.status(200).json({task: status});
		
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

router.delete('/', checkJwt, checkUserInfo, (req, res) => {
	const task_id = req.body.task_id;

	taskModel.delete(task_id).then(status => {
		console.log(status);
		return res.status(200).json({status});
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`});
	})
});

// router.get('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
// 	const { user_id, role } = req.user;
// 	const { property_id } = req.params;

// 	try {
// 		const tasks = await taskModel.getTasks(user_id, property_id, role);

// 		// A valid property could have no tasks. Might want a better response for an invalid user/property combo.
// 		// if (!tasks[0]) {
// 		// 	return res.status(404).json({ error: 'property not found' });
// 		// }

// 		res.status(200).json({ tasks });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ error });
// 	}
// });

// /** Add a task */
// router.post('/:property_id', checkJwt, checkUserInfo, async (req, res) => {
// 	const { user_id, role } = req.user;
// 	const { property_id } = req.params;
// 	const { text, deadline } = req.body;

// 	if (role !== 'manager') {
// 		return res.status(403).json({ error: 'not a manager' });
// 	}

// 	try {
// 		const validProperty = await propertyModel.checkOwner(user_id, property_id);

// 		if (!validProperty) {
// 			return res.status(403).json({ error: 'invalid property' });
// 		}

// 		const { task_id, notUnique } = await taskModel.addTask(
// 			property_id,
// 			text,
// 			deadline
// 		);

// 		if (notUnique) {
// 			return res.status(409).json({ notUnique });
// 		}

// 		res.status(200).json({ task_id });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ error });
// 	}
// });

// /** Update a task*/
// router.put('/:task_id', checkJwt, checkUserInfo, async (req, res) => {
// 	const { user_id, role } = req.user;
// 	const { task_id } = req.params;
// 	const { text, deadline } = req.body;

// 	if (role !== 'manager') {
// 		return res.status(403).json({ error: 'not a manager' });
// 	}

// 	try {
// 		const { updated, notUnique } = await taskModel.updateTask(
// 			user_id,
// 			task_id,
// 			text,
// 			deadline
// 		);

// 		if (notUnique) {
// 			return res.status(409).json({ notUnique });
// 		}

// 		if (!updated) {
// 			return res.status(403).json({ error: 'invalid task' });
// 		}

// 		res.status(200).json({ updated });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ error });
// 	}
// });

// /** Delete a task */
// router.delete('/:task_id', checkJwt, checkUserInfo, async (req, res) => {
// 	const { user_id, role } = req.user;
// 	const { task_id } = req.params;

// 	if (role !== 'manager') {
// 		return res.status(403).json({ error: 'not a manager' });
// 	}

// 	try {
// 		const { deleted } = await taskModel.removeTask(user_id, task_id);

// 		if (!deleted) {
// 			return res.status(403).json({ error: 'invalid task' });
// 		}

// 		res.status(200).json({ deleted });
// 	} catch (error) {
// 		console.error(error);
// 		res.status(500).json({ error });
// 	}
// });

module.exports = router;
