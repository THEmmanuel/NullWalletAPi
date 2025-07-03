const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

// Paystack Secret Key - should be in .env file
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Initialize transaction
router.post('/initialize', async (req, res) => {
  try {
    const { amount, email, metadata } = req.body;

    // Validate required fields
    if (!amount || !email) {
      return res.status(400).json({
        success: false,
        error: 'Amount and email are required'
      });
    }

    // Convert amount to kobo (Paystack expects amount in the smallest currency unit)
    const amountInKobo = Math.round(parseFloat(amount) * 100);

    // Generate unique reference
    const reference = `NULL_WALLET_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

    const payload = {
      email,
      amount: amountInKobo,
      reference,
      currency: 'NGN', // You can make this dynamic based on user preference
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment/callback`,
      metadata: {
        ...metadata,
        source: 'null-wallet',
        timestamp: new Date().toISOString()
      }
    };

    console.log('Initializing Paystack transaction:', { email, amount, reference });

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.status) {
      console.log('Paystack transaction initialized successfully:', reference);
      res.json({
        success: true,
        data: {
          authorization_url: response.data.data.authorization_url,
          access_code: response.data.data.access_code,
          reference: response.data.data.reference
        }
      });
    } else {
      throw new Error(response.data.message || 'Failed to initialize transaction');
    }
  } catch (error) {
    console.error('Error initializing Paystack transaction:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize payment',
      details: error.response?.data?.message || error.message
    });
  }
});

// Simple in-memory cache to prevent excessive API calls
const verificationCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Verify transaction
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: 'Reference is required'
      });
    }

    // Check cache first
    const cached = verificationCache.get(reference);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('📋 Returning cached result for:', reference);
      return res.json(cached.data);
    }

    console.log('🔍 Verifying Paystack transaction:', reference);

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    if (response.data.status) {
      const transaction = response.data.data;
      
      // Extract relevant transaction data
      const transactionData = {
        reference: transaction.reference,
        amount: transaction.amount / 100, // Convert back from kobo
        currency: transaction.currency,
        status: transaction.status,
        paidAt: transaction.paid_at,
        channel: transaction.channel,
        customerEmail: transaction.customer?.email,
        metadata: transaction.metadata,
        gateway_response: transaction.gateway_response,
        message: transaction.message
      };

      // Check transaction status
      const responseData = {
        success: transaction.status === 'success',
        data: transactionData,
        ...(transaction.status !== 'success' && {
          error: `Transaction ${transaction.status}`,
          reference
        })
      };

      // Cache the result
      verificationCache.set(reference, {
        data: responseData,
        timestamp: Date.now()
      });

      if (transaction.status === 'success') {
        console.log(`✅ Transaction successful: ${reference} - Amount: ${transaction.currency} ${transactionData.amount}`);
      } else {
        // Log different statuses with appropriate emojis for better visibility
        const statusEmojis = {
          failed: '❌',
          abandoned: '⏸️',
          cancelled: '🚫',
          pending: '⏳'
        };
        
        const emoji = statusEmojis[transaction.status] || '⚠️';
        console.log(`${emoji} Transaction ${transaction.status}: ${reference} - ${transaction.gateway_response || 'No additional info'}`);
      }
      
      res.json(responseData);
    } else {
      throw new Error(response.data.message || 'Invalid response from Paystack');
    }
  } catch (error) {
    console.error('Error verifying Paystack transaction:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment',
      details: error.response?.data?.message || error.message
    });
  }
});

// Webhook endpoint for Paystack notifications
router.post('/webhook', async (req, res) => {
  try {
    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex');
    
    if (hash !== req.headers['x-paystack-signature']) {
      console.error('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;
    
    console.log('Received Paystack webhook:', event, data.reference);

    // Handle different event types
    switch (event) {
      case 'charge.success':
        // Handle successful payment
        console.log('Payment successful:', data.reference);
        // TODO: Update user wallet balance, create transaction record, etc.
        break;
      
      case 'charge.failed':
        // Handle failed payment
        console.log('Payment failed:', data.reference);
        break;
      
      default:
        console.log('Unhandled Paystack event:', event);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error processing Paystack webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router; 