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
router.get('/all', assetController.listAssets.bind(assetController));

// Asset management routes
router.post('/', assetController.createAsset.bind(assetController));
router.get('/', assetController.listAssets.bind(assetController));
router.get('/:ticker', assetController.getAsset.bind(assetController));
router.patch('/:ticker/price', assetController.updateAssetPrice.bind(assetController));

// Trading routes
router.post('/:walletAddress/buy', assetController.buyAsset.bind(assetController));
router.post('/:walletAddress/sell', assetController.sellAsset.bind(assetController));

module.exports = router; 