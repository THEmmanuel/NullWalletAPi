const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    balances: {
        type: Map,
        of: Number,
        default: {}
    },
    fiat: {
        type: Map,
        of: Number,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
});

const Wallet = mongoose.model('Wallet', walletSchema);

class WalletRepository {
    async create(walletData) {
        const wallet = new Wallet(walletData);
        return await wallet.save();
    }

    async findByAddress(walletAddress) {
        return await Wallet.findOne({ walletAddress });
    }

    async findByUserId(userId) {
        return await Wallet.findOne({ userId });
    }

    async update(walletAddress, updateData) {
        return await Wallet.findOneAndUpdate(
            { walletAddress },
            { $set: updateData },
            { new: true }
        );
    }

    async delete(walletAddress) {
        return await Wallet.findOneAndDelete({ walletAddress });
    }
}

module.exports = { WalletRepository }; 