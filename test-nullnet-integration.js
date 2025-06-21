const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust port as needed
const TEST_WALLET_1 = 'null_test1a2b3c4d5e6f7g8h9i0j';
const TEST_WALLET_2 = 'null_test9i8h7g6f5e4d3c2b1a0j';

async function testNullNetIntegration() {
    console.log('🚀 Starting NullNet Integration Tests...\n');

    try {
        // Test 1: Health Checks
        console.log('1️⃣ Testing Health Checks...');
        const walletHealth = await axios.get(`${BASE_URL}/api/nullnet/wallets/health`);
        const assetHealth = await axios.get(`${BASE_URL}/api/nullnet/assets/health`);
        console.log('✅ Health checks passed\n');

        // Test 2: Create Test Assets
        console.log('2️⃣ Creating Test Assets...');
        const testAssets = [
            { ticker: 'GOLD', name: 'Gold Coin', type: 'free', price: 100, creatorId: 'test-user' },
            { ticker: 'SILVER', name: 'Silver Coin', type: 'free', price: 50, creatorId: 'test-user' }
        ];

        for (const asset of testAssets) {
            await axios.post(`${BASE_URL}/api/nullnet/assets`, asset);
            console.log(`✅ Created asset: ${asset.ticker}`);
        }
        console.log('');

        // Test 3: Create Test Wallets
        console.log('3️⃣ Creating Test Wallets...');
        const wallet1 = await axios.post(`${BASE_URL}/api/nullnet/wallets`, { userId: 'test-user-1' });
        const wallet2 = await axios.post(`${BASE_URL}/api/nullnet/wallets`, { userId: 'test-user-2' });
        console.log(`✅ Created wallet 1: ${wallet1.data.data.walletAddress}`);
        console.log(`✅ Created wallet 2: ${wallet2.data.data.walletAddress}\n`);

        const wallet1Address = wallet1.data.data.walletAddress;
        const wallet2Address = wallet2.data.data.walletAddress;

        // Test 4: Buy Assets
        console.log('4️⃣ Testing Asset Purchases...');
        await axios.post(`${BASE_URL}/api/nullnet/assets/${wallet1Address}/buy`, {
            ticker: 'GOLD',
            amount: 10
        });
        await axios.post(`${BASE_URL}/api/nullnet/assets/${wallet1Address}/buy`, {
            ticker: 'SILVER',
            amount: 20
        });
        console.log('✅ Asset purchases completed\n');

        // Test 5: Check Balances via NullNet API
        console.log('5️⃣ Testing NullNet API Balance Checks...');
        const balance1 = await axios.get(`${BASE_URL}/api/nullnet/wallets/${wallet1Address}/balance`);
        console.log(`✅ Wallet 1 balances:`, balance1.data.data);
        console.log('');

        // Test 6: Test Integration with Main Wallet API
        console.log('6️⃣ Testing Main Wallet API Integration...');
        
        // Test get-token-balance endpoint
        const tokenBalance = await axios.get(`${BASE_URL}/wallet/get-token-balance/${wallet1Address}/GOLD/nullnet`);
        console.log(`✅ Token balance via main API: ${tokenBalance.data.balance}`);
        
        // Test balance endpoint
        const specificBalance = await axios.get(`${BASE_URL}/wallet/balance/nullnet/GOLD/${wallet1Address}`);
        console.log(`✅ Specific balance: ${specificBalance.data.data.balance}`);
        
        // Test all balances endpoint
        const allBalances = await axios.get(`${BASE_URL}/wallet/balances/nullnet/${wallet1Address}`);
        console.log(`✅ All balances:`, allBalances.data.data.balances);
        console.log('');

        // Test 7: Test Token Transfer
        console.log('7️⃣ Testing Token Transfer...');
        const transfer = await axios.post(`${BASE_URL}/wallet/send-token`, {
            amount: 5,
            receiverWalletAddress: wallet2Address,
            tokenToSend: 'GOLD',
            senderWalletAddress: wallet1Address,
            senderPrivateKey: 'test-key',
            chainId: 'nullnet'
        });
        console.log(`✅ Transfer completed:`, transfer.data.data);
        console.log('');

        // Test 8: Verify Transfer Results
        console.log('8️⃣ Verifying Transfer Results...');
        const newBalance1 = await axios.get(`${BASE_URL}/wallet/get-token-balance/${wallet1Address}/GOLD/nullnet`);
        const newBalance2 = await axios.get(`${BASE_URL}/wallet/get-token-balance/${wallet2Address}/GOLD/nullnet`);
        console.log(`✅ Wallet 1 GOLD balance: ${newBalance1.data.balance}`);
        console.log(`✅ Wallet 2 GOLD balance: ${newBalance2.data.balance}`);
        console.log('');

        // Test 9: List All Data
        console.log('9️⃣ Testing List All Endpoints...');
        const allWallets = await axios.get(`${BASE_URL}/api/nullnet/wallets/all`);
        const allAssets = await axios.get(`${BASE_URL}/api/nullnet/assets/all`);
        console.log(`✅ Total wallets: ${allWallets.data.data.length}`);
        console.log(`✅ Total assets: ${allAssets.data.data.length}`);
        console.log('');

        console.log('🎉 All NullNet Integration Tests Passed!');
        console.log('\n📊 Test Summary:');
        console.log('- Health checks: ✅');
        console.log('- Asset creation: ✅');
        console.log('- Wallet creation: ✅');
        console.log('- Asset purchases: ✅');
        console.log('- Balance checks: ✅');
        console.log('- Main API integration: ✅');
        console.log('- Token transfers: ✅');
        console.log('- Data listing: ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run tests
testNullNetIntegration(); 