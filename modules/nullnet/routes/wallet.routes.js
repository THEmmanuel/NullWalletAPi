const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { validateWalletAddress } = require('../utils/wallet');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'NullNet Wallet Service',
        timestamp: new Date().toISOString()
    });
});

// List all wallets
router.get('/all', async (req, res) => {
    try {
        const wallets = await walletController.listAllWallets();
        res.json({
            success: true,
            data: wallets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Create a new wallet
router.post('/', walletController.createWallet);

// Get wallet by address
router.get('/:walletAddress', 
    (req, res, next) => {
        if (!validateWalletAddress(req.params.walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address format'
            });
        }
        next();
    },
    walletController.getWallet
);

// Get wallet balance
router.get('/:walletAddress/balance', 
    (req, res, next) => {
        if (!validateWalletAddress(req.params.walletAddress)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address format'
            });
        }
        next();
    },
    walletController.getWalletBalance
);

module.exports = router; 