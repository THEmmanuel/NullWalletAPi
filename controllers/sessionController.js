const { Users } = require('../models/user');
const jwt = require('jsonwebtoken');

/**
 * Get current user session
 */
const getSession = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({ error: 'No active session' });
		}

		// Return user data without sensitive information
		const userData = {
			userID: req.user.userID,
			username: req.user.username,
			email: req.user.email,
			isEmailVerified: req.user.isEmailVerified,
			authMethod: req.user.authMethod,
			currentChain: req.user.currentChain,
			supportedChains: req.user.supportedChains,
			supportedTokens: req.user.supportedTokens,
			userWallets: req.user.userWallets,
			lastLogin: req.user.lastLogin,
			createdAt: req.user.createdAt,
			updatedAt: req.user.updatedAt
		};

		res.json({ user: userData });
	} catch (error) {
		console.error('Get session error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

/**
 * Update user session
 */
const updateSession = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({ error: 'No active session' });
		}

		const { currentChain, supportedChains, supportedTokens } = req.body;
		const updateData = {};

		if (currentChain) updateData.currentChain = currentChain;
		if (supportedChains) updateData.supportedChains = supportedChains;
		if (supportedTokens) updateData.supportedTokens = supportedTokens;

		const updatedUser = await Users.findByIdAndUpdate(
			req.user._id,
			updateData,
			{ new: true, runValidators: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		res.json({ 
			message: 'Session updated successfully',
			user: {
				userID: updatedUser.userID,
				username: updatedUser.username,
				currentChain: updatedUser.currentChain,
				supportedChains: updatedUser.supportedChains,
				supportedTokens: updatedUser.supportedTokens
			}
		});
	} catch (error) {
		console.error('Update session error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

/**
 * End user session
 */
const endSession = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({ error: 'No active session' });
		}

		// In a real implementation, you might want to blacklist the token
		// For now, we'll just return success
		res.json({ message: 'Session ended successfully' });
	} catch (error) {
		console.error('End session error:', error);
		res.status(500).json({ error: 'Internal server error' });
	}
};

module.exports = {
	getSession,
	updateSession,
	endSession
}; 