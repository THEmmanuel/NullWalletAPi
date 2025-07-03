const jwt = require('jsonwebtoken');
const { Users } = require('../models/user');

/**
 * Middleware to authenticate JWT tokens
 */
const auth = async (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
		
		if (!token) {
			return res.status(401).json({ error: 'Access denied. No token provided.' });
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
		const user = await Users.findOne({ userID: decoded.userID });

		if (!user) {
			return res.status(401).json({ error: 'Invalid token.' });
		}

		req.user = user;
		req.token = token;
		next();
	} catch (error) {
		console.error('Auth middleware error:', error);
		res.status(401).json({ error: 'Invalid token.' });
	}
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
		
		if (token) {
			const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
			const user = await Users.findOne({ userID: decoded.userID });
			
			if (user) {
				req.user = user;
				req.token = token;
			}
		}
		
		next();
	} catch (error) {
		// Continue without authentication
		next();
	}
};

module.exports = {
	auth,
	optionalAuth
}; 