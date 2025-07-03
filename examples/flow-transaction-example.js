/**
 * Flow Testnet Transaction Example
 * 
 * This example demonstrates how to send transactions on Flow testnet
 * using the FlowService with Alchemy's eth_sendRawTransaction.
 * 
 * Prerequisites:
 * 1. Set ALCHEMY_FLOW_API_KEY in your .env file
 * 2. Have testnet FLOW tokens for gas fees
 * 3. Valid sender private key
 */

const FlowService = require('../services/FlowService');
const { ethers } = require('ethers');

// Configuration
const SENDER_PRIVATE_KEY = process.env.FLOW_SENDER_PRIVATE_KEY || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const RECEIVER_ADDRESS = process.env.FLOW_RECEIVER_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

async function flowTransactionExample() {
    console.log('🚀 Flow Testnet Transaction Example\n');

    try {
        // Initialize Flow service
        const flowService = new FlowService();
        console.log('✅ Flow service initialized');

        // Create wallet from private key
        const wallet = new ethers.Wallet(SENDER_PRIVATE_KEY);
        const senderAddress = wallet.address;
        console.log(`📧 Sender address: ${senderAddress}`);
        console.log(`📧 Receiver address: ${RECEIVER_ADDRESS}`);
        console.log('');

        // Example 1: Send Native FLOW Token
        console.log('1️⃣ Sending Native FLOW Token...');
        try {
            const flowResult = await flowService.sendTransaction({
                amount: '0.001',
                receiverWalletAddress: RECEIVER_ADDRESS,
                tokenToSend: 'flow',
                senderWalletAddress: senderAddress,
                senderPrivateKey: SENDER_PRIVATE_KEY,
                chainId: 'flowTestnet'
            });

            console.log('✅ FLOW transaction sent successfully!');
            console.log(`   Transaction hash: ${flowResult.hash}`);
            console.log(`   From: ${flowResult.from}`);
            console.log(`   To: ${flowResult.to}`);
            console.log(`   Amount: ${flowResult.value} FLOW`);
            console.log(`   Chain: ${flowResult.chain}`);
        } catch (error) {
            console.log('❌ FLOW transaction failed:', error.message);
        }
        console.log('');

        // Example 2: Send USDT Token
        console.log('2️⃣ Sending USDT Token...');
        try {
            const usdtResult = await flowService.sendTransaction({
                amount: '1.0',
                receiverWalletAddress: RECEIVER_ADDRESS,
                tokenToSend: 'usdt',
                senderWalletAddress: senderAddress,
                senderPrivateKey: SENDER_PRIVATE_KEY,
                chainId: 'flowTestnet'
            });

            console.log('✅ USDT transaction sent successfully!');
            console.log(`   Transaction hash: ${usdtResult.hash}`);
            console.log(`   From: ${usdtResult.from}`);
            console.log(`   To: ${usdtResult.to}`);
            console.log(`   Amount: ${usdtResult.value} USDT`);
            console.log(`   Chain: ${usdtResult.chain}`);
        } catch (error) {
            console.log('❌ USDT transaction failed:', error.message);
        }
        console.log('');

        // Example 3: Send USDC Token
        console.log('3️⃣ Sending USDC Token...');
        try {
            const usdcResult = await flowService.sendTransaction({
                amount: '1.0',
                receiverWalletAddress: RECEIVER_ADDRESS,
                tokenToSend: 'usdc',
                senderWalletAddress: senderAddress,
                senderPrivateKey: SENDER_PRIVATE_KEY,
                chainId: 'flowTestnet'
            });

            console.log('✅ USDC transaction sent successfully!');
            console.log(`   Transaction hash: ${usdcResult.hash}`);
            console.log(`   From: ${usdcResult.from}`);
            console.log(`   To: ${usdcResult.to}`);
            console.log(`   Amount: ${usdcResult.value} USDC`);
            console.log(`   Chain: ${usdcResult.chain}`);
        } catch (error) {
            console.log('❌ USDC transaction failed:', error.message);
        }
        console.log('');

        // Example 4: Get Transaction Status
        console.log('4️⃣ Getting Transaction Status...');
        try {
            // This would work with a real transaction hash
            const txHash = '0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331';
            const status = await flowService.getTransactionStatus(txHash);
            
            if (status) {
                console.log('✅ Transaction status retrieved');
                console.log(`   Block number: ${status.blockNumber}`);
                console.log(`   Gas used: ${status.gasUsed}`);
                console.log(`   Status: ${status.status === '0x1' ? 'Success' : 'Failed'}`);
            } else {
                console.log('⚠️  Transaction not found or pending');
            }
        } catch (error) {
            console.log('❌ Failed to get transaction status:', error.message);
        }
        console.log('');

        // Example 5: Get Gas Price
        console.log('5️⃣ Getting Current Gas Price...');
        try {
            const gasPrice = await flowService.getGasPrice();
            const gasPriceGwei = ethers.formatUnits(gasPrice, 'gwei');
            console.log(`✅ Current gas price: ${gasPriceGwei} Gwei`);
        } catch (error) {
            console.log('❌ Failed to get gas price:', error.message);
        }
        console.log('');

        console.log('🎉 Flow Transaction Examples Completed!');
        console.log('\n📝 Notes:');
        console.log('- Transactions require valid API key and testnet tokens');
        console.log('- Gas fees are paid in FLOW tokens');
        console.log('- Transaction hashes can be viewed on Flowscan');
        console.log('- Set environment variables for real testing');

    } catch (error) {
        console.error('❌ Example failed:', error.message);
    }
}

// Example of using the API endpoint
async function apiEndpointExample() {
    console.log('\n🌐 API Endpoint Example\n');

    const axios = require('axios');
    const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4444';

    try {
        const wallet = new ethers.Wallet(SENDER_PRIVATE_KEY);
        const senderAddress = wallet.address;

        console.log('📡 Sending transaction via API endpoint...');
        
        const response = await axios.post(`${BASE_URL}/wallet/send-token`, {
            amount: '0.001',
            receiverWalletAddress: RECEIVER_ADDRESS,
            tokenToSend: 'flow',
            senderWalletAddress: senderAddress,
            senderPrivateKey: SENDER_PRIVATE_KEY,
            chainId: 'flowTestnet'
        }, {
            timeout: 10000
        });

        console.log('✅ API transaction successful!');
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);

    } catch (error) {
        if (error.response) {
            console.log('❌ API transaction failed:');
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log('❌ API request failed:', error.message);
        }
    }
}

// Run examples
if (require.main === module) {
    flowTransactionExample()
        .then(() => apiEndpointExample())
        .catch(console.error);
}

module.exports = { flowTransactionExample, apiEndpointExample }; 