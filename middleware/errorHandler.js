module.exports = (err, req, res, next) => {
	// console.log('ERROR HANDLER:');
	// console.log(err);

	const errors = {
		UnauthorizedError: {
			code: 401,
			message: 'Invalid auth0 token'
		},

		errorId: {
			code: 000,
			message: ''
		}
	};

	let error = errors[err.name || err];

	if (!error) {
		next();
	}
	if(error === undefined){
		error = {
			code: 999,
			message: 'Oopsie woopsie we made a widdle fuggo boingo UwU'
		}
	}

	return res.status(error.code).json({ error: error.message });
};
