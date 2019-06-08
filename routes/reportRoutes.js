// Dependencies
const express = require('express');
const router = express.Router();

const moment = require('moment');

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const reportModel = require('../models/reportModel');

// Routes
/** Get reports by user_id */
router.get('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	// Check role
	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	const timeNow = moment.utc().format();

	try {
		const { recent, current, upcoming } = await reportModel.getReports(
			user_id,
			timeNow
		);

		res.status(200).json({ recent, current, upcoming });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

router.get('/past', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id, role } = req.user;

	// Check role
	if (role !== 'manager') {
		return res.status(403).json({ error: 'not a manager' });
	}

	const timeNow = moment.utc().format();

	try {
		const pastReports = await reportModel.getPastReports(user_id, timeNow);

		res.status(200).json({ pastReports });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

module.exports = router;
