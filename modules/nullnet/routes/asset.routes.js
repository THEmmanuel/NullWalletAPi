const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');

// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'NullNet Asset Service',
        timestamp: new Date().toISOString()
    });
});

// List all assets
router.get('/all', async (req, res) => {
    try {
        const assets = await assetController.listAllAssets();
        res.json({
            success: true,
            data: assets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Asset management routes
router.post('/', assetController.createAsset);
router.get('/', assetController.listAssets);
router.get('/:ticker', assetController.getAsset);
router.patch('/:ticker/price', assetController.updateAssetPrice);

// Trading routes
router.post('/:walletAddress/buy', assetController.buyAsset);
router.post('/:walletAddress/sell', assetController.sellAsset);

module.exports = router; 