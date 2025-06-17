const crypto = require('crypto');
const { WalletRepository } = require('../repositories/wallet.repository');

const WALLET_PREFIX = 'null_';
const WALLET_BODY_LENGTH = 20;

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
}

async function generateWalletAddress() {
    const walletRepository = new WalletRepository();
    let walletAddress;
    let isUnique = false;

    while (!isUnique) {
        const body = generateRandomString(WALLET_BODY_LENGTH);
        walletAddress = `${WALLET_PREFIX}${body}`;
        
        const existingWallet = await walletRepository.findByAddress(walletAddress);
        if (!existingWallet) {
            isUnique = true;
        }
    }

    return walletAddress;
}

function validateWalletAddress(address) {
    if (!address || typeof address !== 'string') {
        return false;
    }

    if (!address.startsWith(WALLET_PREFIX)) {
        return false;
    }

    if (address.length !== WALLET_PREFIX.length + WALLET_BODY_LENGTH) {
        return false;
    }

    const body = address.slice(WALLET_PREFIX.length);
    const validChars = /^[A-Za-z0-9]+$/;
    
    return validChars.test(body);
}

module.exports = {
    generateWalletAddress,
    validateWalletAddress
}; 