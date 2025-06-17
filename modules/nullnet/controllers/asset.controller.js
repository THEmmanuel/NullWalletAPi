const { AssetService } = require('../services/asset.service');

class AssetController {
    constructor() {
        this.assetService = new AssetService();
    }

    async listAllAssets(req, res) {
        try {
            const assets = await this.assetService.listAllAssets();
            return res.status(200).json({
                success: true,
                data: assets
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createAsset(req, res) {
        try {
            const asset = await this.assetService.createAsset(req.body);
            return res.status(201).json({
                success: true,
                data: asset
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAsset(req, res) {
        try {
            const { ticker } = req.params;
            const asset = await this.assetService.getAsset(ticker);
            return res.status(200).json({
                success: true,
                data: asset
            });
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    async listAssets(req, res) {
        try {
            const assets = await this.assetService.listAssets();
            return res.status(200).json({
                success: true,
                data: assets
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateAssetPrice(req, res) {
        try {
            const { ticker } = req.params;
            const { price } = req.body;
            
            if (!price || isNaN(price) || price <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid price value'
                });
            }

            const asset = await this.assetService.updateAssetPrice(ticker, price);
            return res.status(200).json({
                success: true,
                data: asset
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async buyAsset(req, res) {
        try {
            const { walletAddress } = req.params;
            const { ticker, amount } = req.body;

            if (!amount || isNaN(amount) || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount'
                });
            }

            const result = await this.assetService.buyAsset(walletAddress, ticker, amount);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async sellAsset(req, res) {
        try {
            const { walletAddress } = req.params;
            const { ticker, amount } = req.body;

            if (!amount || isNaN(amount) || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid amount'
                });
            }

            const result = await this.assetService.sellAsset(walletAddress, ticker, amount);
            return res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AssetController(); 