const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');

/**
 * @swagger
 * tags:
 *   name: NullNet Assets
 *   description: NullNet blockchain asset management and trading operations
 */

/**
 * @swagger
 * /api/nullnet/assets/health:
 *   get:
 *     summary: NullNet asset service health check
 *     tags: [NullNet Assets]
 *     description: Check the health status of the NullNet asset service
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 service:
 *                   type: string
 *                   example: "NullNet Asset Service"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'NullNet Asset Service',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /api/nullnet/assets/all:
 *   get:
 *     summary: List all NullNet assets
 *     tags: [NullNet Assets]
 *     description: Retrieve all assets available on the NullNet blockchain
 *     responses:
 *       200:
 *         description: All assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticker:
 *                         type: string
 *                         description: Asset ticker symbol
 *                       name:
 *                         type: string
 *                         description: Asset name
 *                       price:
 *                         type: number
 *                         description: Current asset price
 *                       supply:
 *                         type: number
 *                         description: Total supply
 *       500:
 *         description: Failed to retrieve assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 */
// List all assets
router.get('/all', assetController.listAssets.bind(assetController));

/**
 * @swagger
 * /api/nullnet/assets:
 *   post:
 *     summary: Create a new NullNet asset
 *     tags: [NullNet Assets]
 *     description: Create a new asset on the NullNet blockchain
 *     responses:
 *       201:
 *         description: Asset created successfully
 *       500:
 *         description: Failed to create asset
 *   get:
 *     summary: List NullNet assets
 *     tags: [NullNet Assets]
 *     description: Retrieve all assets available on the NullNet blockchain
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *       500:
 *         description: Failed to retrieve assets
 */
// Asset management routes
router.post('/', assetController.createAsset.bind(assetController));
router.get('/', assetController.listAssets.bind(assetController));

/**
 * @swagger
 * /api/nullnet/assets/{ticker}:
 *   get:
 *     summary: Get NullNet asset by ticker
 *     tags: [NullNet Assets]
 *     description: Retrieve asset information by ticker symbol
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ticker symbol
 *     responses:
 *       200:
 *         description: Asset retrieved successfully
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Failed to retrieve asset
 */
router.get('/:ticker', assetController.getAsset.bind(assetController));

/**
 * @swagger
 * /api/nullnet/assets/{ticker}/price:
 *   patch:
 *     summary: Update asset price
 *     tags: [NullNet Assets]
 *     description: Update the price of a specific asset
 *     parameters:
 *       - in: path
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         description: Asset ticker symbol
 *     responses:
 *       200:
 *         description: Asset price updated successfully
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Failed to update asset price
 */
router.patch('/:ticker/price', assetController.updateAssetPrice.bind(assetController));

/**
 * @swagger
 * /api/nullnet/assets/{walletAddress}/buy:
 *   post:
 *     summary: Buy NullNet asset
 *     tags: [NullNet Assets]
 *     description: Purchase an asset using a NullNet wallet
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: NullNet wallet address
 *     responses:
 *       200:
 *         description: Asset purchased successfully
 *       400:
 *         description: Invalid request or insufficient funds
 *       404:
 *         description: Wallet or asset not found
 *       500:
 *         description: Failed to process purchase
 */
// Trading routes
router.post('/:walletAddress/buy', assetController.buyAsset.bind(assetController));

/**
 * @swagger
 * /api/nullnet/assets/{walletAddress}/sell:
 *   post:
 *     summary: Sell NullNet asset
 *     tags: [NullNet Assets]
 *     description: Sell an asset using a NullNet wallet
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: NullNet wallet address
 *     responses:
 *       200:
 *         description: Asset sold successfully
 *       400:
 *         description: Invalid request or insufficient assets
 *       404:
 *         description: Wallet or asset not found
 *       500:
 *         description: Failed to process sale
 */
router.post('/:walletAddress/sell', assetController.sellAsset.bind(assetController));

module.exports = router; 