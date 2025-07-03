const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const assetXSchema = new Schema({
	userID: {
		type: String,
		required: true
	},
	assetType: {
		type: String,
		required: true,
		enum: ['token', 'nft', 'other']
	},
	assetSymbol: {
		type: String,
		required: true
	},
	assetName: {
		type: String,
		required: true
	},
	chainId: {
		type: String,
		required: true
	},
	contractAddress: {
		type: String,
		default: null
	},
	balance: {
		type: String,
		default: "0"
	},
	decimals: {
		type: Number,
		default: 18
	},
	isEnabled: {
		type: Boolean,
		default: true
	},
	lastUpdated: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true
});

const AssetX = mongoose.model('AssetX', assetXSchema);

module.exports = AssetX; 