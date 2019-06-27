// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');
const partnerModel = require('../models/partnerModel');


// Mailgun 
const mailgunKey = process.env.MAILGUN_KEY;
const mailgunDomain = process.env.MAILGUN_URL;
const Mailgun = require('mailgun-js');


/**
 * Get property availability
 * Checks for properties marked as available
 * This will be matched against the partner's properties to see if availability
 * has been added or not
 */

 router.get('/', (req, res) => {
     return res.status(200).json({m: 'success'})
 })

router.get('/available_properties', checkJwt, checkUserInfo, (req, res) => {
	const cleaner_id = req.user.user_id;

	propertyModel.getAvailableProperties(cleaner_id).then(properties => {
		return res.status(200).json({available_properties: properties})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

router.get('/available_cleaners/:property_id', checkJwt, checkUserInfo, (req, res) => {
	const property_id = req.params.property_id;

	propertyModel.getAvailableCleaners(property_id).then(cleaners => {
		console.log('AVAIL CLEANERS', cleaners);

		return res.status(200).json({available_partners: cleaners})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

/** Marks a property as available by adding an entry in the available_cleaners table */

router.post('/available_properties', checkJwt, checkUserInfo, (req, res) => {
	
	const entry = {
		cleaner_id: req.user.user_id,
		property_id: req.body.property_id,
	}

	propertyModel.addAvailability(entry).then(status => {
		return res.status(200).json({message: `Availability added.`})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

router.delete('/available_properties/:property_id', checkJwt, checkUserInfo, (req, res) => {
	const entry = {
		cleaner_id: req.user.user_id,
		property_id: req.params.property_id,
	}

	propertyModel.removeAvailability(entry).then(status => {
		return res.status(200).json({message: `Availability removed.`})
	}).catch(err => {
		console.log(err);
		return res.status(500).json({error: `Internal server error.`})
	})
})

module.exports = router;