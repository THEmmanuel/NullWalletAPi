const { WalletRepository } = require('../repositories/wallet.repository');
const { generateWalletAddress } = require('../utils/wallet');

class WalletService {
    constructor() {
        this.walletRepository = new WalletRepository();
    }

    async createWallet(userData) {
        const walletAddress = await generateWalletAddress();
        const walletData = {
            walletAddress,
            userId: userData.userId,
            balances: {},
            fiat: {},
            createdAt: new Date(),
            lastActive: new Date()
        };

        return await this.walletRepository.create(walletData);
    }

    // Create wallet with specific address (for migration)
    async createWalletWithAddress(walletAddress, userId) {
        const walletData = {
            walletAddress,
            userId,
            balances: {},
            fiat: {},
            createdAt: new Date(),
            lastActive: new Date()
        };

        return await this.walletRepository.create(walletData);
    }

    async getWallet(walletAddress) {
        return await this.walletRepository.findByAddress(walletAddress);
    }

    async getWalletBalance(walletAddress) {
        const wallet = await this.getWallet(walletAddress);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        return {
            balances: wallet.balances,
            fiat: wallet.fiat
        };
    }

    async updateBalance(walletAddress, assetType, amount, operation = 'add') {
        const wallet = await this.getWallet(walletAddress);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const currentBalance = wallet.balances[assetType] || 0;
        const newBalance = operation === 'add' 
            ? currentBalance + amount 
            : currentBalance - amount;

        if (newBalance < 0) {
            throw new Error('Insufficient balance');
        }

        wallet.balances[assetType] = newBalance;
        wallet.lastActive = new Date();

        return await this.walletRepository.update(walletAddress, wallet);
    }
}

module.exports = { WalletService }; 