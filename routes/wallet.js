const express = require('express');
const router = express.Router();
const Users = require('../models/user');
const {
	getTokenBalance,
	sendToken,
	getOtherTokenBalances
} = require('../utils/ETHWallet.js')

const {
	getTokenPrice
} = require('../utils/TradeTools')
const axios = require('axios');



const {
	API_KEY,
	PRIVATE_KEY
} = process.env;


router.get('/', (req, res) => {
	res.send('Wallet actions')
});


router.get('/get-token-balance/:walletAddress/:contractAddress/:chain', async (req, res) => {
	const {
		walletAddress,
		contractAddress,
		chain
	} = req.params;

	console.log(`Received request to fetch token balance for wallet address: ${walletAddress} and contract address: ${contractAddress}`);

	try {
		const balance = await getTokenBalance(walletAddress, contractAddress, chain);
		console.log(`Balance retrieved successfully: ${balance}`);
		res.json({
			balance: balance
		});
	} catch (error) {
		console.error('Error in route handler:', error);
		res.status(500).json({
			error: 'Failed to fetch token balance'
		});
	}
});



// token param exists solely so the price can be fetched from coingecko and fallbacks.
router.get('/get-token-usd-balance/:walletAddress/:contractAddress/:token/:chain', async (req, res) => {
	const {
		walletAddress,
		contractAddress,
		token
	} = req.params;

	let tokenPriceData = {}

	console.log(`Received request to fetch USD balance for wallet address: ${walletAddress}, contract address: ${contractAddress}, token: ${token}`);

	try {
		// First, get the token balance
		const balance = await getTokenBalance(walletAddress, contractAddress);
		console.log(`Token balance retrieved: ${balance}`);


		// Fixed price for PULSAR token
		let tokenPrice = token.toLowerCase() === 'pulsar' ? 100 : null;

		// If token is not PULSAR, fetch price from CoinGecko
		if (tokenPrice === null) {
			const priceResponse = await axios.get(
				`https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd`, {
					headers: {
						'accept': 'application/json',
						'x-cg-demo-api-key': 'CG-rKwKNVA6FNFmESJpcVXizmMh' // Set your API key here
					}
				}
			);

			console.log(priceResponse.data)
			// Extract the token price data
			tokenPriceData = priceResponse.data[token];

			if (!tokenPriceData) {
				return res.status(404).json({
					error: 'Token price not found'
				});
			}

			tokenPrice = tokenPriceData.usd;
		}

		// Calculate USD balance
		const usdBalance = balance * tokenPrice;

		// Prepare response 
		res.json({
			balance: balance,
			tokenPrice: tokenPrice,
			usdBalance: usdBalance,
			...(token.toLowerCase() !== 'pulsar' && {
				marketCap: tokenPriceData.usd_market_cap,
				volume24h: tokenPriceData.usd_24h_vol,
				priceChange24h: tokenPriceData.usd_24h_change
			})
		});
	} catch (error) {
		console.error('Error in USD balance route handler:', error);

		// Check if it's an axios error with response
		if (error.response) {
			console.error('CoinGecko API error:', error.response.data);
			res.status(error.response.status).json({
				error: 'Failed to fetch token USD balance',
				details: error.response.data
			});
		} else {
			res.status(500).json({
				error: 'Failed to fetch token USD balance'
			});
		}
	}
});




// Define a GET route to fetch token prices
router.get('/get-token-price/:token', async (req, res) => {
	const token = req.params.token.toLowerCase(); // Handle case sensitivity
	const price = await getTokenPrice(token);

	if (price !== null) {
		res.json({
			message: price
		});
	} else {
		res.status(404).json({
			error: `Price for ${token} not found or could not be fetched.`
		});
	}
});



router.post('/send-token', async (req, res) => {
	const {
		amount,
		walletAddress,
		tokenToSend,
		senderUsername,
		walletName
	} = req.body;

	try {
		// Capture the result from sendToken function
		const result = await sendToken(
			amount,
			walletAddress,
			tokenToSend,
			senderUsername,
			walletName
		);

		// Include the result in the success response
		res.status(200).json({
			success: true,
			message: `Token ${tokenToSend} sent to ${walletAddress}`,
			data: result // This will contain the transaction details
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			error: 'Something went wrong',
			details: error.message // Include error details
		});
	}
});



module.exports = router;