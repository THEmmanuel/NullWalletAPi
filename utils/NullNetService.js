const { WalletService } = require('../modules/nullnet/services/wallet.service');
const { AssetService } = require('../modules/nullnet/services/asset.service');
const { validateWalletAddress } = require('../modules/nullnet/utils/wallet');

class NullNetService {
    constructor() {
        this.walletService = new WalletService();
        this.assetService = new AssetService();
    }

    async getTokenBalance(walletAddress, contractAddress, chain) {
        if (chain !== 'nullnet') {
            throw new Error('Invalid chain for NullNet service');
        }

        if (!validateWalletAddress(walletAddress)) {
            throw new Error('Invalid NullNet wallet address format');
        }

        // For NullNet, contractAddress is actually the asset ticker
        const assetTicker = contractAddress.toUpperCase();
        
        try {
            const wallet = await this.walletService.getWallet(walletAddress);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            const balance = wallet.balances[assetTicker] || 0;
            return balance.toString();
        } catch (error) {
            throw new Error(`Failed to get NullNet balance: ${error.message}`);
        }
    }

    async sendToken(amount, receiverWalletAddress, tokenToSend, senderWalletAddress, senderPrivateKey, chainId) {
        if (chainId !== 'nullnet') {
            throw new Error('Invalid chain for NullNet service');
        }

        if (!validateWalletAddress(senderWalletAddress) || !validateWalletAddress(receiverWalletAddress)) {
            throw new Error('Invalid NullNet wallet address format');
        }

        const assetTicker = tokenToSend.toUpperCase();

        try {
            // Check sender balance
            const senderWallet = await this.walletService.getWallet(senderWalletAddress);
            if (!senderWallet) {
                throw new Error('Sender wallet not found');
            }

            const senderBalance = senderWallet.balances[assetTicker] || 0;
            if (senderBalance < amount) {
                throw new Error('Insufficient balance');
            }

            // Transfer tokens
            await this.walletService.updateBalance(senderWalletAddress, assetTicker, amount, 'subtract');
            await this.walletService.updateBalance(receiverWalletAddress, assetTicker, amount, 'add');

            return {
                success: true,
                chain: 'nullnet',
                from: senderWalletAddress,
                to: receiverWalletAddress,
                token: assetTicker,
                amount: amount,
                transactionId: `nullnet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };
        } catch (error) {
            throw new Error(`Failed to send NullNet token: ${error.message}`);
        }
    }

    async getWalletBalances(walletAddress, chainId) {
        if (chainId !== 'nullnet') {
            throw new Error('Invalid chain for NullNet service');
        }

        if (!validateWalletAddress(walletAddress)) {
            throw new Error('Invalid NullNet wallet address format');
        }

        try {
            const wallet = await this.walletService.getWallet(walletAddress);
            if (!wallet) {
                throw new Error('Wallet not found');
            }

            return wallet.balances;
        } catch (error) {
            throw new Error(`Failed to get NullNet wallet balances: ${error.message}`);
        }
    }

    async createAsset(assetData) {
        try {
            return await this.assetService.createAsset(assetData);
        } catch (error) {
            throw new Error(`Failed to create NullNet asset: ${error.message}`);
        }
    }

    async getAsset(ticker) {
        try {
            return await this.assetService.getAsset(ticker);
        } catch (error) {
            throw new Error(`Failed to get NullNet asset: ${error.message}`);
        }
    }

    async listAssets() {
        try {
            return await this.assetService.listAssets();
        } catch (error) {
            throw new Error(`Failed to list NullNet assets: ${error.message}`);
        }
    }
}

module.exports = { NullNetService }; 