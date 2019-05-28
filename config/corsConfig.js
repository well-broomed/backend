const corsConfig = {
	credentials: true,
	origin: function(origin, callback) {
		// allow requests with no origin
		// (like mobile apps or curl requests)
		if (!origin) return callback(null, true);

		const allowedOrigins = [
			'http://localhost:3000',
			'https://wellbroomed.com',
			'https://wellbroomed-dev.netlify.com'
		];

		if (allowedOrigins.indexOf(origin) === -1) {
			var msg =
				'The CORS policy for this site does not ' +
				'allow access from the specified Origin.';
			return callback(new Error(msg), false);
		}

		return callback(null, true);
	}
};

module.exports = corsConfig;
