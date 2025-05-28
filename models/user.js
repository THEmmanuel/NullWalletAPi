const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message Schema
const messageSchema = new Schema({
	sender: {
		type: Schema.Types.ObjectId,
		ref: 'user', // Reference to the User model
		required: true,
	},
	receiver: {
		type: Schema.Types.ObjectId,
		ref: 'user', // Reference to the User model
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	timestamp: {
		type: Date,
		default: Date.now,
	},
	status: {
		type: String,
		enum: ['sent', 'delivered', 'read'],
		default: 'sent',
	},
});

// User Schema
const userSchema = new Schema({
	email: {
		type: String,
		required: true,
	},
	username: {
		type: String,
		required: true,
	},
	userID: {
		type: String,
		required: true,
	},

	transactionPIN: {
		type: String,
	},

	userWallets: [{
		walletName: String,
		walletAddress: String,
		walletKey: String,
		walletPhrase: String,
	}, ],

	userBankAccounts: [{
		bankName: String,
		bankAccountName: String,
		bankAccountNumber: String,
	}, ],

	currentChain: {
		type: String
	},
	// Add a reference to messages sent/received
	messages: [{
		type: Schema.Types.ObjectId,
		ref: 'message', // Reference to the Message model
	}, ],
});

// Export models
const Users = mongoose.model('Users', userSchema);
const Message = mongoose.model('message', messageSchema);

module.exports = {
	Users,
	Message
};