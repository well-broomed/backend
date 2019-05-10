// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');
const checkUserInfo = require('../middleware/checkUserInfo');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');


router.get('/manager/properties', checkJwt, checkUserInfo, (req, res) => {
    console.log('req.user', req.user);
    if(req.user.role === 'manager'){
        propertyModel.getPropertiesByManager(req.user.user_id).then(properties => {
            console.log('properties', properties);
    
            if(properties.length === 0){
                return res.status(200).json({message: `No properties found for that user.`})
            } else {
                return res.status(200).json({properties});
            }
        }).catch(err => {
            console.log(err);
            return res.status(500).json({error: `Internal server error.`})
        })
    } else {
        return res.status(403).json({error: `You are not a property manager.`})
    }
})



module.exports = router;