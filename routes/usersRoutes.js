const express = require('express');
const router = express.Router();

const usersModel = require('../models/usersModel');
const responseStatus = require('../config/responseStatusConfig');

router.get('/users', async (req, res) => {
	try {
		const users = await usersModel.getUsers();
		res.status(responseStatus.success).json({ users });
	} catch (err) {
		res.status(responseStatus.notFound).json(err);
	}
});

module.exports = router;
