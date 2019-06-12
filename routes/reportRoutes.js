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

		const reports = [];

		current.forEach(current => reports.push({ current }));

		recent.forEach(recent => {
			const i = reports.findIndex(
				({ current }) =>
					recent.property_id === (current ? current.property_id : -1)
			);

			if (i > -1) {
				reports[i].recent = recent;
			} else {
				reports.push({ recent });
			}
		});

		upcoming.forEach(upcoming => {
			const i = reports.findIndex(
				({ current, recent }) =>
					upcoming.property_id ===
					(current ? current.property_id : recent ? recent.property_id : -1)
			);

			if (i > -1) {
				reports[i].upcoming = upcoming;
			} else {
				reports.push({ upcoming });
			}
		});

		res.status(200).json({ reports });
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
