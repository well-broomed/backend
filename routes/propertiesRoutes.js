const express = require('express');
const router = express.Router();

const propertiesModel = require('../models/propertiesModel');
const responseStatus = require('../config/responseStatusConfig');

router.get('/', async (req, res) => {
	try {
		let id = 10;

		// this should get the USER ID from req object and retrieve properties for that user
		const properties = await propertiesModel.getProperties(id);
		res.status(responseStatus.success).json(properties);
	} catch (err) {
		console.log(err);
		res.status(responseStatus.notFound).json(err);
	}
});

router.post('/', async (req, res) => {
	try {
		//get property and user id from request body
		const {
			manager_id,
			cleaner_id,
			property_name,
			address,
			img_url,
			guest_guide,
			assistant_guide
		} = req.body;

		//create object to insert
		const property = {
			manager_id,
			cleaner_id,
			property_name,
			address,
			img_url,
			guest_guide,
			assistant_guide
		};

		//insert to db
		const success = await propertiesModel.insert(property);
		console.log(success);
		res.status(responseStatus.success).json(success);

		//

		//insert to db
	} catch (err) {
		console.log(err);
		res.status(responseStatus.notFound).json(err);
	}
});

module.exports = router;
