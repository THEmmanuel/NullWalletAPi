const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
	email: {
		type: String,
		required: function() {
			return this.authMethod === 'password';
		},
		sparse: true,
		unique: true
	},
	username: {
		type: String,
		required: true,
	},
	userID: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: function() {
			return this.authMethod === 'password';
		}
	},
	token: {
		type: String,
		required: function() {
			return this.authMethod === 'token';
		}
	},
	authMethod: {
		type: String,
		enum: ['password', 'token'],
		required: true
	},
	isEmailVerified: {
		type: Boolean,
		default: false
	},
	resetToken: String,
	resetTokenExpiry: Date,
	recoveryToken: String,
	recoveryTokenExpiry: Date,
	transactionPIN: {
		type: String,
	},
	userWallets: [{
		walletName: String,
		walletAddress: String,
		walletKey: String,
		walletPhrase: String,
	}],
	userBankAccounts: [{
		bankName: String,
		bankAccountName: String,
		bankAccountNumber: String,
	}],
	currentChain: {
		type: String
	},
	lastLogin: Date,
	failedLoginAttempts: {
		type: Number,
		default: 0
	},
	accountLocked: {
		type: Boolean,
		default: false
	},
	accountLockExpiry: Date
}, {
	timestamps: true
});

// Export models
const Users = mongoose.model('Users', userSchema);

module.exports = {
	Users
};