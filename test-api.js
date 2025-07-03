#!/usr/bin/env node

/**
 * Test script to verify Null Wallet Backend API connectivity
 * Run this to check if the backend is working properly
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4444';
const TEST_WALLET_ADDRESS = '0xD22507B380D33a6CD115cAe487ce4FDb19543Ac2';

console.log('🧪 Testing Null Wallet Backend API');
console.log('📡 Backend URL:', BACKEND_URL);
console.log('🔍 Test Wallet:', TEST_WALLET_ADDRESS);
console.log('─'.repeat(50));

async function testEndpoint(description, method, url, data = null) {
    try {
        console.log(`\n🔄 Testing: ${description}`);
        console.log(`   ${method} ${url}`);
        
        const config = {
            method,
            url: `${BACKEND_URL}${url}`,
            timeout: 10000,
            ...(data && { data })
        };
        
        const response = await axios(config);
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        if (error.response) {
            console.log(`   📄 Response:`, JSON.stringify(error.response.data, null, 2));
        }
        if (error.code === 'ECONNREFUSED') {
            console.log(`   💡 Hint: Make sure the backend server is running on ${BACKEND_URL}`);
        }
        return false;
    }
}

async function runTests() {
    const tests = [
        // Basic connectivity
        ['Health Check', 'GET', '/'],
        ['Wallet API Health', 'GET', '/wallet'],
        
        // Supported chains
        ['Supported Chains', 'GET', '/wallet/supported'],
        
        // Balance tests for different chains
        ['Ethereum Balance', 'GET', `/wallet/balance/ethereum/${TEST_WALLET_ADDRESS}`],
        ['NullNet Balance', 'GET', `/wallet/balance/nullnet/${TEST_WALLET_ADDRESS}`],
        ['Polygon Balance', 'GET', `/wallet/balance/polygon/${TEST_WALLET_ADDRESS}`],
        ['BSC Balance', 'GET', `/wallet/balance/bsc/${TEST_WALLET_ADDRESS}`],
        
        // Transaction tests
        ['Ethereum Transactions', 'GET', `/wallet/transactions/ethereum/${TEST_WALLET_ADDRESS}`],
        ['NullNet Transactions', 'GET', `/wallet/transactions/nullnet/${TEST_WALLET_ADDRESS}`],
    ];
    
    let passed = 0;
    let failed = 0;
    
    for (const [description, method, url, data] of tests) {
        const success = await testEndpoint(description, method, url, data);
        if (success) {
            passed++;
        } else {
            failed++;
        }
    }
    
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    if (failed > 0) {
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Ensure backend server is running: npm start');
        console.log('   2. Check MongoDB is running and accessible');
        console.log('   3. Verify environment variables are set');
        console.log('   4. Check firewall/port settings');
        console.log('   5. Review server logs for errors');
    } else {
        console.log('\n🎉 All tests passed! Backend is working correctly.');
    }
}

// Handle script termination
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Test interrupted by user');
    process.exit(0);
});

// Run the tests
runTests().catch(error => {
    console.error('\n💥 Test runner error:', error.message);
    process.exit(1);
}); 