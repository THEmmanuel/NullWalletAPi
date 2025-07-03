const { ethers } = require('ethers');
const axios = require('axios');
const chains = require('../config/chains');
const tokens = require('../config/tokens');

class FlowService {
    constructor() {
        this.alchemyUrl = 'https://flow-testnet.g.alchemy.com/v2';
        this.apiKey = process.env.ALCHEMY_KEY;
        console.log('[FlowService] Constructor: ALCHEMY_KEY:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NOT SET');
        if (!this.apiKey) {
            console.warn('ALCHEMY_KEY not found in environment variables');
        }
    }

    /**
     * Send a transaction on Flow testnet using Alchemy's eth_sendRawTransaction
     * @param {Object} params - Transaction parameters
     * @returns {Object} Transaction result
     */
    async sendTransaction(params) {
        console.log('[FlowService] sendTransaction called with:', params);
        const {
            amount,
            receiverWalletAddress,
            tokenToSend,
            senderWalletAddress,
            senderPrivateKey,
            chainId
        } = params;

        try {
            // Validate chain
            if (chainId !== 'flowTestnet') {
                throw new Error('Invalid chain for Flow service');
            }

            // Validate token
            const token = tokens[tokenToSend.toLowerCase()];
            if (!token) {
                throw new Error(`Unsupported token: ${tokenToSend}`);
            }

            // Check if token is supported on Flow testnet
            const tokenOnChain = token.chains[chainId];
            if (!tokenOnChain) {
                throw new Error(`Token ${tokenToSend} is not supported on Flow testnet`);
            }

            // Create provider for Flow testnet
            const chain = chains[chainId];
            const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
            
            // Create wallet
            const wallet = new ethers.Wallet(senderPrivateKey, provider);

            let rawTransaction;

            if (token.type === 'native' || !tokenOnChain.address) {
                // Native FLOW token transfer
                rawTransaction = await this.createNativeTransaction(
                    wallet,
                    receiverWalletAddress,
                    amount,
                    tokenOnChain.decimals
                );
            } else {
                // ERC20 token transfer
                rawTransaction = await this.createERC20Transaction(
                    wallet,
                    receiverWalletAddress,
                    amount,
                    tokenOnChain.address,
                    tokenOnChain.decimals
                );
            }

            // Send raw transaction via Alchemy
            console.log('[FlowService] Sending raw transaction...');
            const result = await this.sendRawTransaction(rawTransaction);
            console.log('[FlowService] Transaction sent. Result:', result);

            return {
                success: true,
                hash: result,
                from: senderWalletAddress,
                to: receiverWalletAddress,
                value: amount,
                chain: chain.name,
                token: tokenToSend,
                transactionHash: result
            };

        } catch (error) {
            console.error('[FlowService] Error sending Flow transaction:', error);
            throw new Error(`Failed to send Flow transaction: ${error.message}`);
        }
    }

    /**
     * Create a native FLOW token transaction
     */
    async createNativeTransaction(wallet, toAddress, amount, decimals) {
        const amountWei = ethers.parseUnits(amount.toString(), decimals);
        
        // Get current nonce
        const nonce = await wallet.provider.getTransactionCount(wallet.address);
        
        // Get gas price (Flow testnet)
        const gasPrice = await wallet.provider.getFeeData();
        
        // Create transaction object
        const transaction = {
            to: toAddress,
            value: amountWei,
            nonce: nonce,
            gasPrice: gasPrice.gasPrice,
            gasLimit: 21000, // Standard transfer gas limit
            chainId: 545, // Flow testnet chain ID
            type: 0 // Legacy transaction type
        };

        // Sign the transaction
        const signedTx = await wallet.signTransaction(transaction);
        
        return signedTx;
    }

    /**
     * Create an ERC20 token transaction
     */
    async createERC20Transaction(wallet, toAddress, amount, contractAddress, decimals) {
        const amountWei = ethers.parseUnits(amount.toString(), decimals);
        
        // ERC20 transfer function ABI
        const abi = ["function transfer(address to, uint256 amount) returns (bool)"];
        const iface = new ethers.Interface(abi);
        
        // Encode the transfer function call
        const data = iface.encodeFunctionData("transfer", [toAddress, amountWei]);
        
        // Get current nonce
        const nonce = await wallet.provider.getTransactionCount(wallet.address);
        
        // Get gas price
        const gasPrice = await wallet.provider.getFeeData();
        
        // Create transaction object
        const transaction = {
            to: contractAddress,
            value: 0, // No value for token transfers
            nonce: nonce,
            gasPrice: gasPrice.gasPrice,
            gasLimit: 100000, // Higher gas limit for contract interactions
            chainId: 545, // Flow testnet chain ID
            data: data,
            type: 0 // Legacy transaction type
        };

        // Sign the transaction
        const signedTx = await wallet.signTransaction(transaction);
        
        return signedTx;
    }

    /**
     * Send raw transaction via Alchemy API
     */
    async sendRawTransaction(signedTransaction) {
        console.log('[FlowService] sendRawTransaction called. API Key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'NOT SET');
        if (!this.apiKey) {
            throw new Error('ALCHEMY_KEY is required for Flow transactions');
        }

        const url = `${this.alchemyUrl}/${this.apiKey}`;
        
        const payload = {
            jsonrpc: "2.0",
            method: "eth_sendRawTransaction",
            params: [signedTransaction],
            id: 1
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.error) {
                console.error('[FlowService] Alchemy API error:', response.data.error);
                throw new Error(`Alchemy API error: ${response.data.error.message}`);
            }

            return response.data.result;

        } catch (error) {
            console.error('[FlowService] Alchemy API error:', error.response?.data || error.message);
            throw new Error(`Failed to send raw transaction: ${error.message}`);
        }
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(txHash) {
        if (!this.apiKey) {
            throw new Error('ALCHEMY_KEY is required');
        }

        const url = `${this.alchemyUrl}/${this.apiKey}`;
        
        const payload = {
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [txHash],
            id: 1
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.error) {
                throw new Error(`Alchemy API error: ${response.data.error.message}`);
            }

            return response.data.result;

        } catch (error) {
            console.error('Error getting transaction status:', error);
            throw error;
        }
    }

    /**
     * Get gas price for Flow testnet
     */
    async getGasPrice() {
        if (!this.apiKey) {
            throw new Error('ALCHEMY_KEY is required');
        }

        const url = `${this.alchemyUrl}/${this.apiKey}`;
        
        const payload = {
            jsonrpc: "2.0",
            method: "eth_gasPrice",
            params: [],
            id: 1
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.error) {
                throw new Error(`Alchemy API error: ${response.data.error.message}`);
            }

            return response.data.result;

        } catch (error) {
            console.error('Error getting gas price:', error);
            throw error;
        }
    }
}

module.exports = FlowService; 