const jwt = require('jsonwebtoken');

const generateToken = ({ user_id, email, role, img_url }, exp) => {
	return jwt.sign(
		{ user_id, email, role, img_url, exp },
		process.env.JWT_SECRET,
		{}
	);
};

module.exports = generateToken;
