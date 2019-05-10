// Dependencies
const express = require('express');
const router = express.Router();

// Middleware
const checkJwt = require('../middleware/checkJwt');

// Helpers
const userModel = require('../models/userModel');
const propertyModel = require('../models/propertyModel');





module.exports = router;