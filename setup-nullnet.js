const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust port as needed

async function setupNullNet() {
    console.log('🔧 Setting up NullNet with sample data...\n');

    try {
        // Create sample assets
        console.log('📦 Creating sample assets...');
        const sampleAssets = [
            {
                ticker: 'GOLD',
                name: 'Gold Coin',
                type: 'free',
                price: 100.0,
                creatorId: 'system'
            },
            {
                ticker: 'SILVER',
                name: 'Silver Coin',
                type: 'free',
                price: 50.0,
                creatorId: 'system'
            },
            {
                ticker: 'PLATINUM',
                name: 'Platinum Coin',
                type: 'free',
                price: 200.0,
                creatorId: 'system'
            },
            {
                ticker: 'DIAMOND',
                name: 'Diamond Coin',
                type: 'free',
                price: 500.0,
                creatorId: 'system'
            }
        ];

        for (const asset of sampleAssets) {
            try {
                await axios.post(`${BASE_URL}/api/nullnet/assets`, asset);
                console.log(`✅ Created asset: ${asset.ticker} at $${asset.price}`);
            } catch (error) {
                if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                    console.log(`ℹ️  Asset ${asset.ticker} already exists`);
                } else {
                    throw error;
                }
            }
        }
        console.log('');

        // Create sample wallets
        console.log('👛 Creating sample wallets...');
        const sampleWallets = [
            { userId: 'demo-user-1' },
            { userId: 'demo-user-2' },
            { userId: 'demo-user-3' }
        ];

        const createdWallets = [];
        for (const walletData of sampleWallets) {
            try {
                const wallet = await axios.post(`${BASE_URL}/api/nullnet/wallets`, walletData);
                createdWallets.push(wallet.data.data);
                console.log(`✅ Created wallet: ${wallet.data.data.walletAddress}`);
            } catch (error) {
                console.log(`⚠️  Could not create wallet for ${walletData.userId}: ${error.message}`);
            }
        }
        console.log('');

        // Add sample balances to first wallet
        if (createdWallets.length > 0) {
            console.log('💰 Adding sample balances...');
            const firstWallet = createdWallets[0];
            
            const sampleBalances = [
                { ticker: 'GOLD', amount: 100 },
                { ticker: 'SILVER', amount: 200 },
                { ticker: 'PLATINUM', amount: 50 }
            ];

            for (const balance of sampleBalances) {
                try {
                    await axios.post(`${BASE_URL}/api/nullnet/assets/${firstWallet.walletAddress}/buy`, {
                        ticker: balance.ticker,
                        amount: balance.amount
                    });
                    console.log(`✅ Added ${balance.amount} ${balance.ticker} to wallet`);
                } catch (error) {
                    console.log(`⚠️  Could not add ${balance.ticker}: ${error.message}`);
                }
            }
            console.log('');
        }

        // Display setup summary
        console.log('📊 Setup Summary:');
        console.log('================');
        
        // List all assets
        const assets = await axios.get(`${BASE_URL}/api/nullnet/assets/all`);
        console.log(`📦 Assets created: ${assets.data.data.length}`);
        assets.data.data.forEach(asset => {
            console.log(`   - ${asset.ticker}: $${asset.price} (${asset.type})`);
        });
        console.log('');

        // List all wallets
        const wallets = await axios.get(`${BASE_URL}/api/nullnet/wallets/all`);
        console.log(`👛 Wallets created: ${wallets.data.data.length}`);
        wallets.data.data.forEach(wallet => {
            console.log(`   - ${wallet.walletAddress} (${wallet.userId})`);
        });
        console.log('');

        // Show sample wallet balance
        if (createdWallets.length > 0) {
            const firstWallet = createdWallets[0];
            const balance = await axios.get(`${BASE_URL}/api/nullnet/wallets/${firstWallet.walletAddress}/balance`);
            console.log(`💰 Sample wallet balance (${firstWallet.walletAddress}):`);
            console.log(JSON.stringify(balance.data.data, null, 2));
            console.log('');
        }

        console.log('🎉 NullNet setup completed successfully!');
        console.log('\n🚀 Ready for integration testing!');
        console.log('Run: node test-nullnet-integration.js');

    } catch (error) {
        console.error('❌ Setup failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run setup
setupNullNet(); 