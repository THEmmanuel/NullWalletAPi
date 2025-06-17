const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    ticker: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['free', 'pegged', 'derivative'],
        default: 'free'
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    // TODO: Implement price source integration
    // For now, we'll use hardcoded values
    priceSource: {
        apiUrl: String,
        jsonPath: String,
        multiplier: {
            type: Number,
            default: 1
        }
    },
    verified: {
        type: Boolean,
        default: false
    },
    creatorId: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Asset = mongoose.model('Asset', assetSchema);

class AssetRepository {
    async create(assetData) {
        const asset = new Asset(assetData);
        return await asset.save();
    }

    async findByTicker(ticker) {
        return await Asset.findOne({ ticker: ticker.toUpperCase() });
    }

    async list() {
        return await Asset.find({});
    }

    async update(ticker, updateData) {
        return await Asset.findOneAndUpdate(
            { ticker: ticker.toUpperCase() },
            { $set: updateData },
            { new: true }
        );
    }

    async delete(ticker) {
        return await Asset.findOneAndDelete({ ticker: ticker.toUpperCase() });
    }
}

module.exports = { AssetRepository }; 