const kineticKeys = require('@ayxdele/kinetic-keys');
const crypto = require('crypto');

/**
 * Decrypt data using kinetic keys
 * @param {string} encryptedData - The encrypted data to decrypt
 * @param {string} key - The decryption key
 * @returns {string} - The decrypted data
 */
const decryptData = async (encryptedData, key) => {
	try {
		const decrypted = await kineticKeys.decrypt(encryptedData, key);
		return decrypted;
	} catch (error) {
		console.error('Error decrypting data:', error);
		throw new Error('Failed to decrypt data');
	}
};

/**
 * Encrypt data using kinetic keys
 * @param {string} data - The data to encrypt
 * @param {string} key - The encryption key
 * @returns {string} - The encrypted data
 */
const encryptData = async (data, key) => {
	try {
		const encrypted = await kineticKeys.encrypt(data, key);
		return encrypted;
	} catch (error) {
		console.error('Error encrypting data:', error);
		throw new Error('Failed to encrypt data');
	}
};

/**
 * Generate a secure random key
 * @param {number} length - The length of the key (default: 32)
 * @returns {string} - The generated key
 */
const generateKey = (length = 32) => {
	return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash data using SHA-256
 * @param {string} data - The data to hash
 * @returns {string} - The hashed data
 */
const hashData = (data) => {
	return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = {
	decryptData,
	encryptData,
	generateKey,
	hashData
}; 