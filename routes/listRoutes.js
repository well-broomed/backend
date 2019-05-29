// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const guestModel = require('../models/guestModel');
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');
const listModel = require('../models/listModel');

// Router

// Get all lists for a manager
router.get('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id } = req.user;

	try {
		const lists = await listModel.getByManager(user_id);

		return res.status(200).json({ lists });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error });
	}
});

// Get all lists for a property
router.get('/:property_id', checkJwt, checkUserInfo, (req, res) => {
    const property_id = req.params.property_id;

    listModel.getByProperty(property_id).then(lists => {
        console.log(lists);

        return res.status(200).json({lists});
    }).catch(err => {
        console.log(err);
        return res.status(500).json({error: `Internal server error.`})
    })
});

// Create a new list for a property
router.post('/', checkJwt, checkUserInfo, (req, res) => {
    const newProperty = req.body;

    // perform sanitation here

    // ensure property id and manager id are present etc.


    listModel.add(newProperty).then(status => {
        console.log(status);

        return res.status(200).json({list: status})
    }).catch(err => {
        console.log(err);
        return res.status(500).json({error: `Internal server error.`})
    })
});

router.put('/', checkJwt, checkUserInfo, (req, res) => {
    const list_id = req.body.list_id;
    const changes = req.body.changes;

    listModel.update(list_id, changes).then(status => {
        console.log(status);

        return res.status(200).json({list: status});
    }).catch(err => {
        console.log(err);
        return res.status(500).json({error: `Internal server error.`})
    })
});

module.exports = router;