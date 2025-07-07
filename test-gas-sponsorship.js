const axios = require('axios');
const { ethers } = require('ethers');

// Configuration
const BASE_URL = process.env.BACKEND_URL || 'http://localhost:4444';
const FLOW_TESTNET_RPC = 'https://testnet.evm.nodes.onflow.org';

// Test wallet (you should replace these with your own test wallets)
const TEST_SENDER_PRIVATE_KEY = process.env.FLOW_TEST_PRIVATE_KEY || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const TEST_RECEIVER_ADDRESS = process.env.FLOW_TEST_RECEIVER || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

async function testGasSponsorship() {
    console.log('🧪 Testing Gas Sponsorship Integration\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Backend Health...');
        const healthResponse = await axios.get(`${BASE_URL}/wallet`);
        console.log('✅ Backend health check passed');
        console.log('');

        // Test 2: Create test wallet
        console.log('2️⃣ Creating Test Wallet...');
        const wallet = new ethers.Wallet(TEST_SENDER_PRIVATE_KEY);
        const senderAddress = wallet.address;
        console.log(`✅ Test wallet created: ${senderAddress}`);
        console.log('');

        // Test 3: Test Native FLOW Transaction with Gas Sponsorship
        console.log('3️⃣ Testing Native FLOW Transaction with Gas Sponsorship...');
        try {
            const response = await axios.post(`${BASE_URL}/wallet/send-token-sponsored`, {
                amount: '0.001',
                receiverWalletAddress: TEST_RECEIVER_ADDRESS,
                tokenToSend: 'flow',
                senderWalletAddress: senderAddress,
                senderPrivateKey: TEST_SENDER_PRIVATE_KEY,
                chainId: 'flowTestnet'
            }, {
                timeout: 30000 // 30 second timeout
            });
            
            console.log('✅ Gas-sponsored FLOW transaction successful!');
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            if (error.response) {
                console.log('❌ Gas-sponsored FLOW transaction failed:');
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.log('❌ Gas-sponsored FLOW transaction failed:', error.message);
            }
        }
        console.log('');

        // Test 4: Test Regular FLOW Transaction (for comparison)
        console.log('4️⃣ Testing Regular FLOW Transaction (for comparison)...');
        try {
            const response = await axios.post(`${BASE_URL}/wallet/send-token`, {
                amount: '0.001',
                receiverWalletAddress: TEST_RECEIVER_ADDRESS,
                tokenToSend: 'flow',
                senderWalletAddress: senderAddress,
                senderPrivateKey: TEST_SENDER_PRIVATE_KEY,
                chainId: 'flowTestnet',
                useGasSponsorship: false
            }, {
                timeout: 30000 // 30 second timeout
            });
            
            console.log('✅ Regular FLOW transaction successful!');
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            if (error.response) {
                console.log('❌ Regular FLOW transaction failed:');
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.log('❌ Regular FLOW transaction failed:', error.message);
            }
        }
        console.log('');

        // Test 5: Test Token Balance with Error Handling
        console.log('5️⃣ Testing Token Balance with Error Handling...');
        try {
            // Test with a non-existent contract address
            const response = await axios.get(`${BASE_URL}/wallet/usd-balance/${TEST_RECEIVER_ADDRESS}/0x0000000000000000000000000000000000000000/usdc/flowTestnet`);
            console.log('✅ Token balance error handling test passed!');
            console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            if (error.response) {
                console.log('❌ Token balance error handling test failed:');
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
            } else {
                console.log('❌ Token balance error handling test failed:', error.message);
            }
        }
        console.log('');

        console.log('🎉 Gas Sponsorship Integration Tests Completed!');
        console.log('\n📊 Test Summary:');
        console.log('- Backend health: ✅');
        console.log('- Wallet creation: ✅');
        console.log('- Gas-sponsored FLOW transaction: Tested');
        console.log('- Regular FLOW transaction: Tested');
        console.log('- Error handling: Tested');
        console.log('\n💡 To enable full functionality:');
        console.log('1. Set FLOW_GAS_SPONSOR_ADDRESS in your .env file');
        console.log('2. Set FLOW_GAS_SPONSOR_PRIVATE_KEY in your .env file');
        console.log('3. Use valid testnet private keys');
        console.log('4. Ensure you have testnet FLOW tokens');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the test
testGasSponsorship(); 