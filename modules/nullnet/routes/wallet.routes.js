const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { validateWalletAddress } = require('../utils/wallet');

/**
 * @swagger
 * tags:
 *   name: NullNet Wallets
 *   description: NullNet blockchain wallet operations
 */

/**
 * @swagger
 * /api/nullnet/wallets/health:
 *   get:
 *     summary: NullNet wallet service health check
 *     tags: [NullNet Wallets]
 *     description: Check the health status of the NullNet wallet service
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
 *                   example: "NullNet Wallet Service"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'NullNet Wallet Service',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /api/nullnet/wallets/all:
 *   get:
 *     summary: List all NullNet wallets
 *     tags: [NullNet Wallets]
 *     description: Retrieve all NullNet wallets from the system
 *     responses:
 *       200:
 *         description: All wallets retrieved successfully
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
 *                     $ref: '#/components/schemas/Wallet'
 *       500:
 *         description: Failed to retrieve wallets
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

/**
 * @swagger
 * /api/nullnet/wallets:
 *   post:
 *     summary: Create a new NullNet wallet
 *     tags: [NullNet Wallets]
 *     description: Create a new wallet on the NullNet blockchain
 *     responses:
 *       201:
 *         description: Wallet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       500:
 *         description: Failed to create wallet
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
// Create a new wallet
router.post('/', walletController.createWallet);

/**
 * @swagger
 * /api/nullnet/wallets/{walletAddress}:
 *   get:
 *     summary: Get NullNet wallet by address
 *     tags: [NullNet Wallets]
 *     description: Retrieve wallet information by wallet address
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: NullNet wallet address
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Invalid wallet address format
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
 *       404:
 *         description: Wallet not found
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

/**
 * @swagger
 * /api/nullnet/wallets/{walletAddress}/balance:
 *   get:
 *     summary: Get NullNet wallet balance
 *     tags: [NullNet Wallets]
 *     description: Retrieve the balance of a NullNet wallet
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: NullNet wallet address
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     walletAddress:
 *                       type: string
 *                       description: Wallet address
 *                     balance:
 *                       type: object
 *                       description: Balance for different tokens
 *       400:
 *         description: Invalid wallet address format
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
 *       404:
 *         description: Wallet not found
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