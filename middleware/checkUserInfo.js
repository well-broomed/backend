const jwt = require('jsonwebtoken');

const checkUserInfo = (req, res, next) => {
	const token = req.headers['user-info'];

	if (token) {
		jwt.verify(
			token,
			process.env.JWT_SECRET,
			(err, { user_id, user_name, email, role, img_url, exp }) => {
				if (err || req.user.email !== email || req.user.exp !== exp) {
					return res.status(401).json({ error: 'invalid userInfo token' });
				} else {
					req.user = { ...req.user, user_id, user_name, role, img_url };
					next();
				}
			}
		);
	} else {
		return res.status(401).json({ error: 'no userInfo token supplied' });
	}
};

module.exports = checkUserInfo;
