const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { sendToken } = require('../utils/ETHWallet');
const chainUtils = require('../utils/chainUtils');
const tokens = require('../config/tokens');
const { Users } = require('../models/user');
const {
	getTokenBalance,
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
		receiverWalletAddress,
		tokenToSend,
		senderWalletAddress,
		senderPrivateKey,
		chainId
	} = req.body;

	try {
		// Validate required fields
		if (!amount || !receiverWalletAddress || !tokenToSend || !senderWalletAddress || !senderPrivateKey || !chainId) {
			return res.status(400).json({
				success: false,
				error: 'Missing required fields',
				details: 'All fields are required: amount, receiverWalletAddress, tokenToSend, senderWalletAddress, senderPrivateKey, chainId'
			});
		}

		// Validate amount
		if (isNaN(amount) || amount <= 0) {
			return res.status(400).json({
				success: false,
				error: 'Invalid amount',
				details: 'Amount must be a positive number'
			});
		}

		// Send token
		const result = await sendToken(
			amount,
			receiverWalletAddress,
			tokenToSend,
			senderWalletAddress,
			senderPrivateKey,
			chainId
		);

		res.status(200).json({
			success: true,
			message: `Token ${tokenToSend} sent to ${receiverWalletAddress} on ${result.chain}`,
			data: result
		});
	} catch (error) {
		console.error('Error sending token:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to send token',
			details: error.message
		});
	}
});



// Get wallet balance for a specific token on a specific chain
router.get('/balance/:chainId/:tokenSymbol/:walletAddress', async (req, res) => {
	try {
		const { chainId, tokenSymbol, walletAddress } = req.params;

		// Validate chain and token combination
		const { chain, token } = chainUtils.validateChainAndToken(chainId, tokenSymbol);

		// Create provider for the specific chain
		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

		let balance;
		if (token.type === 'native' || !token.address) {
			// Get native token balance
			balance = await provider.getBalance(walletAddress);
			balance = ethers.formatUnits(balance, token.decimals);
		} else {
			// Get ERC20 token balance
			const contract = new ethers.Contract(
				token.address,
				['function balanceOf(address) view returns (uint256)'],
				provider
			);
			balance = await contract.balanceOf(walletAddress);
			balance = ethers.formatUnits(balance, token.decimals);
		}

		res.json({
			success: true,
			data: {
				chain: chain.name,
				token: tokenSymbol.toUpperCase(),
				walletAddress,
				balance,
				decimals: token.decimals,
				type: token.type
			}
		});
	} catch (error) {
		console.error('Error getting balance:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get balance',
			details: error.message
		});
	}
});

// Get all token balances for a wallet on a specific chain
router.get('/balances/:chainId/:walletAddress', async (req, res) => {
	try {
		const { chainId, walletAddress } = req.params;

		// Get all supported tokens for the chain
		const chainTokens = chainUtils.getChainTokens(chainId);
		const chain = chainUtils.getChain(chainId);

		if (!chain) {
			return res.status(400).json({
				success: false,
				error: `Chain ${chainId} is not supported`
			});
		}

		// Create provider for the specific chain
		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

		// Get balances for all tokens
		const balances = await Promise.all(
			chainTokens.map(async (token) => {
				let balance;
				if (token.type === 'native' || !token.address) {
					balance = await provider.getBalance(walletAddress);
					balance = ethers.formatUnits(balance, token.decimals);
				} else {
					const contract = new ethers.Contract(
						token.address,
						['function balanceOf(address) view returns (uint256)'],
						provider
					);
					balance = await contract.balanceOf(walletAddress);
					balance = ethers.formatUnits(balance, token.decimals);
				}

				return {
					symbol: token.symbol,
					name: token.name,
					balance,
					decimals: token.decimals,
					type: token.type
				};
			})
		);

		res.json({
			success: true,
			data: {
				chain: chain.name,
				walletAddress,
				balances
			}
		});
	} catch (error) {
		console.error('Error getting balances:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get balances',
			details: error.message
		});
	}
});

// Get all wallets for a user
router.get('/user/:userId', async (req, res) => {
	try {
		const { userId } = req.params;
		const user = await Users.findOne({ userID: userId });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		res.json({
			success: true,
			data: {
				userId,
				wallets: user.userWallets
			}
		});
	} catch (error) {
		console.error('Error getting user wallets:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get user wallets',
			details: error.message
		});
	}
});

// Get supported chains and tokens
router.get('/supported', (req, res) => {
	try {
		const enabledChains = chainUtils.getEnabledChains();
		const supportedTokens = Object.values(tokens); // Use tokens directly from config

		res.json({
			success: true,
			data: {
				chains: enabledChains,
				tokens: supportedTokens
			}
		});
	} catch (error) {
		console.error('Error getting supported chains and tokens:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get supported chains and tokens',
			details: error.message
		});
	}
});

module.exports = router;