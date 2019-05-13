// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');


/** Add a new property */
router.post('/', checkJwt, checkUserInfo, async (req, res) => {
	const { user_id: manager_id } = req.user;
	const {
		property_name,
		address,
		cleaner_id,
		guest_guide,
		assistant_guide
	} = req.body;

	try {
		const partnered =
			cleaner_id && (await userModel.getPartner(manager_id, cleaner_id));

		if (cleaner_id && !partnered) {
			return res.status(404).json({ error: 'invalid assistant' });
		}

		const { property_id } = await propertyModel.addProperty(
			manager_id,
			property_name,
			address,
			cleaner_id,
			guest_guide,
			assistant_guide
		);

		res.status(201).json({ property_id });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error });
	}
});

router.get('/', checkJwt, checkUserInfo, async (req, res) => {
    console.log('req.user', req.user);
    if(req.user.role === 'manager'){
        try {
            const properties = await propertyModel.getPropertiesByManager(req.user.user_id);

            console.log('properties', properties);
    
            if(properties.length === 0){
                return res.status(200).json({message: `No properties found for that user.`, properties: null},)
            } else {
                return res.status(200).json({properties});
            }
        }
        
        catch(error) {
            console.log(error);
            return res.status(500).json({error})
        }
    } else if(req.user.role === 'assistant') {
        try{
            const properties = await propertyModel.getPropertiesByAssistant(req.user.user_id);

            console.log('asst props', properties);

            if(properties.length === 0){
                return res.status(200).json({message: `No properties found.`})
            } else {
                return res.status(200).json({properties});
            }
        } catch(error){
            console.log(error);
            return res.status(500).json({error});
        }
    }
})

module.exports = router;