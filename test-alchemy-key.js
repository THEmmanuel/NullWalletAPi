/**
 * Test to verify ALCHEMY_KEY environment variable
 */

require('dotenv').config();

console.log('Testing ALCHEMY_KEY environment variable...');
console.log('ALCHEMY_KEY:', process.env.ALCHEMY_KEY ? 'SET' : 'NOT SET');

if (process.env.ALCHEMY_KEY) {
    console.log('✅ ALCHEMY_KEY is available');
    console.log('Key length:', process.env.ALCHEMY_KEY.length);
    console.log('Key starts with:', process.env.ALCHEMY_KEY.substring(0, 10) + '...');
} else {
    console.log('❌ ALCHEMY_KEY is not set');
    console.log('Please set ALCHEMY_KEY in your .env file');
}

// Test FlowService initialization
try {
    const FlowService = require('./services/FlowService');
    const flowService = new FlowService();
    
    if (flowService.apiKey) {
        console.log('✅ FlowService can access ALCHEMY_KEY');
    } else {
        console.log('❌ FlowService cannot access ALCHEMY_KEY');
    }
} catch (error) {
    console.error('Error testing FlowService:', error.message);
} 