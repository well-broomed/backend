const express = require('express');
const router = express.Router();

const propertiesModel = require('../models/propertiesModel');
const responseStatus = require('../config/responseStatusConfig');

router.get('/', async (req, res) => {
	try {
		const properties = await propertiesModel.getProperties();
		res.status(responseStatus.success).json({ properties });
	} catch (err) {
		console.log(err);
		res.status(responseStatus.notFound).json(err);
	}
});

module.exports = router;
