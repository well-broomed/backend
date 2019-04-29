module.exports = (err, req, res) => {
	console.log('ERROR HANDLER:');
	const errors = {
		pNoId: {
			code: 404,
			message: 'Project with specified ID does not exist.'
		},

		errorId: {
			code: 000,
			message: ''
		}
	};

	const error = errors[err];
	res.status(error.code).json(error);
};
