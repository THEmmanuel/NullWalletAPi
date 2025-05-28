const User = require('../models/Users');
const AssetX = require('../models/AssetX');
const Transaction = require('../models/NullWalletTransaction');
const {
	processEncryption
} = require('../utils/KineticKeyHelpers');


async function SendAsset(
	Amount,
	PIN,
	SenderHash,
	ReceiverHash,
	AssetSymbol
) {
	try {
		const asset = await AssetX.findOne({
			assetSymbol: AssetSymbol
		});
		if (!asset) throw new Error('Asset not found');

		const priceFromDB = asset.assetPrice;
		if (priceFromDB <= 0) throw new Error('Invalid asset price');

		const AssetAmount = Amount / priceFromDB;

		const sender = await User.findOne({
			MainHash: SenderHash
		});
		if (!sender) throw new Error('Sender not found');

		const receiver = await User.findOne({
			MainHash: ReceiverHash
		});
		if (!receiver) throw new Error('Receiver not found');

		const senderAssets = sender.UserMetaData.UserAssetsAndBalances || [];
		const senderAssetIndex = senderAssets.findIndex(
			a => a.assetSymbol.toLowerCase() === AssetSymbol.toLowerCase()
		);

		if (
			senderAssetIndex === -1 ||
			senderAssets[senderAssetIndex].assetBalance < Amount ||
			senderAssets[senderAssetIndex].unitsAmount < AssetAmount
		) {
			throw new Error('Sender has insufficient asset balance');
		}

		// Deduct from sender
		senderAssets[senderAssetIndex].unitsAmount -= AssetAmount;
		senderAssets[senderAssetIndex].assetBalance -= Amount;
		sender.UserMetaData.UserAssetsAndBalances = senderAssets;

		// Credit receiver
		const receiverAssets = receiver.UserMetaData.UserAssetsAndBalances || [];
		const receiverAssetIndex = receiverAssets.findIndex(
			a => a.assetSymbol.toLowerCase() === AssetSymbol.toLowerCase()
		);

		if (receiverAssetIndex !== -1) {
			receiverAssets[receiverAssetIndex].unitsAmount += AssetAmount;
			receiverAssets[receiverAssetIndex].assetBalance += Amount;
		} else {
			receiverAssets.push({
				assetSymbol: AssetSymbol,
				unitsAmount: AssetAmount,
				assetBalance: Amount
			});
		}
		receiver.UserMetaData.UserAssetsAndBalances = receiverAssets;

		// Create transaction
		const tx = new Transaction({
			sender: SenderHash,
			receiver: ReceiverHash,
			assetSymbol: AssetSymbol,
			assetAmount: AssetAmount,
			assetPrice: priceFromDB,
			totalValue: Amount,
			createdAt: new Date()
		});

		await tx.save();

		// Encrypt the transaction separately for sender and receiver
		const senderSigningHash = sender.UserMetaData.SigningHash;
		const receiverSigningHash = receiver.UserMetaData.SigningHash;

		if (!senderSigningHash || !receiverSigningHash) {
			throw new Error('Missing SigningHash for sender or receiver');
		}

		const [encryptedForSender] = await processEncryption([tx], senderSigningHash);
		const [encryptedForReceiver] = await processEncryption([tx], receiverSigningHash);

		// Store encrypted transaction
		sender.Transactions.push(encryptedForSender);
		receiver.Transactions.push(encryptedForReceiver);

		await sender.save();
		await receiver.save();

		return {
			success: true,
			transactionId: tx._id
		};
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
}



async function BuyAsset(
	AssetToBuy,
	Amount,
	PIN,
	SenderHash,
	ReceiverHash,
	UserID
) {
	try {
		const asset = await AssetX.findOne({
			assetSymbol: AssetToBuy
		});
		if (!asset) throw new Error('Asset not found');

		const priceFromDB = asset.assetPrice;
		const assetAmount = Amount / priceFromDB;
		const totalValue = Amount;

		const user = await User.findById(UserID);
		if (!user) throw new Error('User not found');

		user.UserMetaData = user.UserMetaData || {};
		let userAssets = user.UserMetaData.UserAssetsAndBalances || [];

		const assetIndex = userAssets.findIndex(
			a => a.assetSymbol.toLowerCase() === AssetToBuy.toLowerCase()
		);

		if (assetIndex === -1) {
			userAssets.push({
				assetSymbol: AssetToBuy,
				assetBalance: totalValue,
				unitsAmount: assetAmount
			});
		} else {
			userAssets[assetIndex].unitsAmount += assetAmount;
			userAssets[assetIndex].assetBalance += totalValue;
		}

		user.UserMetaData.UserAssetsAndBalances = userAssets;

		const tx = new Transaction({
			sender: SenderHash || 'NullWallet',
			receiver: ReceiverHash,
			assetSymbol: AssetToBuy,
			assetAmount,
			assetPrice: priceFromDB,
			totalValue,
			createdAt: new Date()
		});

		await tx.save();
		user.Transactions.push(tx);
		await user.save();

		return {
			success: true,
			message: `Successfully purchased ${assetAmount.toFixed(6)} units of ${AssetToBuy}.`,
			transaction: tx
		};
	} catch (error) {
		return {
			success: false,
			error: error.message
		};
	}
}




module.exports = {
	BuyAsset,
	SendAsset,
};