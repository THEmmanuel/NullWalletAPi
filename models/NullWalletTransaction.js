const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const nullWalletTransactionSchema = new Schema({
	userID: {
		type: String,
		required: true
	},
	transactionHash: {
		type: String,
		required: true,
		unique: true
	},
	transactionType: {
		type: String,
		required: true,
		enum: ['send', 'receive', 'swap', 'stake', 'unstake', 'other']
	},
	fromAddress: {
		type: String,
		required: true
	},
	toAddress: {
		type: String,
		required: true
	},
	assetSymbol: {
		type: String,
		required: true
	},
	amount: {
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
	gasUsed: {
		type: String,
		default: "0"
	},
	gasPrice: {
		type: String,
		default: "0"
	},
	status: {
		type: String,
		required: true,
		enum: ['pending', 'confirmed', 'failed'],
		default: 'pending'
	},
	blockNumber: {
		type: Number,
		default: null
	},
	confirmations: {
		type: Number,
		default: 0
	},
	errorMessage: {
		type: String,
		default: null
	},
	timestamp: {
		type: Date,
		default: Date.now
	}
}, {
	timestamps: true
});

const NullWalletTransaction = mongoose.model('NullWalletTransaction', nullWalletTransactionSchema);

module.exports = NullWalletTransaction; 