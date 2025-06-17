const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../../models/Users'); // adjust to your actual user model
const {
	processDecryption
} = require('../../utils/KineticKeyHelpers'); // your existing decryption logic


// Utility function to decrypt a KK
async function decryptKK(kkData, signingHash, pin) {
    try {
        // const fullKey = signingHash + pin;
        console.log('--- Decryption Attempt ---');
        console.log('KK:', kkData);
        // console.log('Full Key:', fullKey);

        const decrypted = await processDecryption(kkData, pin, signingHash);
        return decrypted;
    } catch (err) {
        console.error('Decryption Error:', err.message);
        throw new Error('Failed to decrypt transaction');
    }
}


// Route: Get all transaction KKs for a user
router.post('/user/transactions', async (req, res) => {
	const {
		userId
	} = req.body;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({
			error: 'User not found'
		});

		const kks = user.Transactions.filter(tx => tx.KK).map(tx => ({
			id: tx._id,
			KK: tx.KK
		}));

		return res.json({
			success: true,
			transactions: kks
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Route: Get all decrypted transactions for a user
router.post('/user/transactions/decrypted', async (req, res) => {
	const {
		userId,
		pin
	} = req.body;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({
			error: 'User not found'
		});

		const signingHash = user.UserMetaData.SigningHash;
		if (!signingHash) return res.status(400).json({
			error: 'SigningHash missing'
		});

		const decryptedTransactions = await Promise.all(
			user.Transactions.filter(tx => tx.KK).map(async (tx) => {
				const decrypted = await decryptKK(tx.KK, signingHash, pin);
				return {
					id: tx._id,
					decrypted
				};
			})
		);

		return res.json({
			success: true,
			transactions: decryptedTransactions
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Route: Get a specific transaction KK
router.post('/user/transaction/kk', async (req, res) => {
	const {
		userId,
		transactionId
	} = req.body;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({
			error: 'User not found'
		});

		const tx = user.Transactions.find(t => t._id.toString() === transactionId);
		if (!tx || !tx.KK) return res.status(404).json({
			error: 'Transaction or KK not found'
		});

		return res.json({
			success: true,
			KK: tx.KK
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: error.message
		});
	}
});

// Route: Get a specific decrypted transaction
router.post('/user/transaction/decrypted', async (req, res) => {
	const {
		userId,
		transactionId,
		pin
	} = req.body;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({
			error: 'User not found'
		});

		const signingHash = user.UserMetaData.SigningHash;
		if (!signingHash) return res.status(400).json({
			error: 'SigningHash missing'
		});

		const tx = user.Transactions.find(t => t._id.toString() === transactionId);
		if (!tx || !tx.KK) return res.status(404).json({
			error: 'Transaction or KK not found'
		});

		const decrypted = await decryptKK(tx.KK, signingHash, pin);

		return res.json({
			success: true,
			decrypted
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			error: error.message
		});
	}
});




module.exports = router;