// Dependencies
const express = require('express');
const router = express.Router();

// Helpers
const exampleModel = require('../models/exampleModel');

// Middleware
// optional error handler
// const errorHandler = require('../middleware/errorHandler');

// getExamples
router.get('/', (req, res) => {
	exampleModel
		.getExamples()
		.then(examples => {
			res.status(200).json(examples);
		})
		.catch(err => res.status(500).json(err));
});

// Error handler
// router.use(errorHandler);

module.exports = router;
