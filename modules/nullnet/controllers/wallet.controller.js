const { WalletService } = require('../services/wallet.service');
const { validateWalletAddress } = require('../utils/wallet');

class WalletController {
    constructor() {
        this.walletService = new WalletService();
    }

    async listAllWallets(req, res) {
        try {
            const wallets = await this.walletService.listAllWallets();
            return res.status(200).json({
                success: true,
                data: wallets
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createWallet(req, res) {
        try {
            const wallet = await this.walletService.createWallet(req.body);
            return res.status(201).json({
                success: true,
                data: wallet
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getWallet(req, res) {
        try {
            const { walletAddress } = req.params;
            if (!validateWalletAddress(walletAddress)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid wallet address format'
                });
            }

            const wallet = await this.walletService.getWallet(walletAddress);
            if (!wallet) {
                return res.status(404).json({
                    success: false,
                    message: 'Wallet not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: wallet
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getWalletBalance(req, res) {
        try {
            const { walletAddress } = req.params;
            if (!validateWalletAddress(walletAddress)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid wallet address format'
                });
            }

            const balance = await this.walletService.getWalletBalance(walletAddress);
            return res.status(200).json({
                success: true,
                data: balance
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new WalletController(); 