const { AssetRepository } = require('../repositories/asset.repository');
const { WalletService } = require('./wallet.service');

class AssetService {
    constructor() {
        this.assetRepository = new AssetRepository();
        this.walletService = new WalletService();
    }

    async createAsset(assetData) {
        // Validate ticker format
        if (!/^[A-Z0-9]{1,10}$/.test(assetData.ticker)) {
            throw new Error('Invalid ticker format. Use 1-10 uppercase letters or numbers.');
        }

        // Check if asset already exists
        const existingAsset = await this.assetRepository.findByTicker(assetData.ticker);
        if (existingAsset) {
            throw new Error('Asset with this ticker already exists');
        }

        return await this.assetRepository.create(assetData);
    }

    async getAsset(ticker) {
        const asset = await this.assetRepository.findByTicker(ticker);
        if (!asset) {
            throw new Error('Asset not found');
        }
        return asset;
    }

    async listAssets() {
        return await this.assetRepository.list();
    }

    async updateAssetPrice(ticker, newPrice) {
        const asset = await this.getAsset(ticker);
        if (asset.type !== 'free') {
            throw new Error('Can only update price for free assets');
        }

        return await this.assetRepository.update(ticker, { price: newPrice });
    }

    async buyAsset(walletAddress, ticker, amount) {
        const asset = await this.getAsset(ticker);
        const totalCost = asset.price * amount;

        // TODO: Implement fiat balance check and deduction
        // For now, we'll just add the asset to the wallet

        await this.walletService.updateBalance(walletAddress, ticker, amount, 'add');
        return {
            ticker,
            amount,
            price: asset.price,
            totalCost
        };
    }

    async sellAsset(walletAddress, ticker, amount) {
        const asset = await this.getAsset(ticker);
        
        // Check if user has enough balance
        const wallet = await this.walletService.getWallet(walletAddress);
        if (!wallet || !wallet.balances[ticker] || wallet.balances[ticker] < amount) {
            throw new Error('Insufficient balance');
        }

        await this.walletService.updateBalance(walletAddress, ticker, amount, 'subtract');
        return {
            ticker,
            amount,
            price: asset.price,
            totalValue: asset.price * amount
        };
    }
}

module.exports = { AssetService }; 