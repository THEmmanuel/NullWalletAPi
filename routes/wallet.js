const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const { sendToken } = require('../utils/ETHWallet');
const chainUtils = require('../utils/chainUtils');
const tokens = require('../config/tokens');
const { Users } = require('../models/user');
const { NullNetService } = require('../utils/NullNetService');
const FlowService = require('../services/FlowService');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management and cryptocurrency operations
 */

// Import from services/EthWallet.js instead of utils/ETHWallet.js
const {
	getTokenBalance,
	getOtherTokenBalances,
	getTokensForChain
} = require('../services/EthWallet.js')

const {
	getTokenPrice
} = require('../utils/TradeTools')
const axios = require('axios');

const {
	API_KEY,
	PRIVATE_KEY
} = process.env;

// Initialize NullNet service with error handling
let nullNetService;
try {
	nullNetService = new NullNetService();
	console.log('NullNet service initialized successfully');
} catch (error) {
	console.error('Failed to initialize NullNet service:', error);
	nullNetService = null;
}

// Initialize Flow service with error handling
let flowService;
try {
	flowService = new FlowService();
	console.log('Flow service initialized successfully');
} catch (error) {
	console.error('Failed to initialize Flow service:', error);
	flowService = null;
}

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get wallet API status
 *     tags: [Wallet]
 *     description: Check the status of wallet services and API availability
 *     responses:
 *       200:
 *         description: Wallet API status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wallet actions API"
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 nullNetService:
 *                   type: string
 *                   enum: [available, unavailable]
 *                   description: Status of NullNet service
 */
router.get('/', (req, res) => {
	res.json({
		message: 'Wallet actions API',
		status: 'ok',
		timestamp: new Date().toISOString(),
		nullNetService: nullNetService ? 'available' : 'unavailable'
	})
});

/**
 * @swagger
 * /wallet/get-token-balance/{walletAddress}/{contractAddress}/{chain}:
 *   get:
 *     summary: Get token balance for a wallet
 *     tags: [Wallet]
 *     description: Retrieve the balance of a specific token for a wallet address on a given blockchain
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to check balance for
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *       - in: path
 *         name: chain
 *         required: true
 *         schema:
 *           type: string
 *         description: Blockchain network (ethereum, polygon, bsc, nullnet, etc.)
 *     responses:
 *       200:
 *         description: Token balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: string
 *                   description: Token balance as string
 *       500:
 *         description: Failed to fetch token balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
router.get('/get-token-balance/:walletAddress/:contractAddress/:chain', async (req, res) => {
	const {
		walletAddress,
		contractAddress,
		chain
	} = req.params;

	console.log(`Received request to fetch token balance for wallet address: ${walletAddress} and contract address: ${contractAddress} on chain: ${chain}`);

	try {
		let balance;
		
		// Handle NullNet chain
		if (chain === 'nullnet') {
			balance = await nullNetService.getTokenBalance(walletAddress, contractAddress, chain);
		} else {
			// Handle other chains using existing logic
			balance = await getTokenBalance(walletAddress, contractAddress, chain);
		}
		
		console.log(`Balance retrieved successfully: ${balance}`);
		res.json({
			balance: balance
		});
	} catch (error) {
		console.error('Error in route handler:', error);
		res.status(500).json({
			error: 'Failed to fetch token balance',
			details: error.message
		});
	}
});

/**
 * @swagger
 * /wallet/get-token-usd-balance/{walletAddress}/{contractAddress}/{token}/{chain}:
 *   get:
 *     summary: Get token balance in USD
 *     tags: [Wallet]
 *     description: Retrieve the balance of a specific token and convert it to USD value using current market prices
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to check balance for
 *       - in: path
 *         name: contractAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Token contract address
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token symbol (e.g., ETH, USDC, PULSAR)
 *       - in: path
 *         name: chain
 *         required: true
 *         schema:
 *           type: string
 *         description: Blockchain network
 *     responses:
 *       200:
 *         description: Token USD balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenBalance'
 *       404:
 *         description: Token price not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to fetch token USD balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
// token param exists solely so the price can be fetched from coingecko and fallbacks.
router.get('/get-token-usd-balance/:walletAddress/:contractAddress/:token/:chain', async (req, res) => {
	const {
		walletAddress,
		contractAddress,
		token,
		chain
	} = req.params;

	let tokenPriceData = {}

	console.log(`Received request to fetch USD balance for wallet address: ${walletAddress}, contract address: ${contractAddress}, token: ${token}, chain: ${chain}`);

	try {
		// First, get the token balance
		let balance;
		try {
			balance = await getTokenBalance(walletAddress, contractAddress, chain);
			console.log(`Token balance retrieved: ${balance}`);
		} catch (balanceError) {
			console.error('Error getting token balance:', balanceError);
			// If balance retrieval fails, set balance to 0 and continue
			balance = 0;
			console.log('Setting balance to 0 due to error');
		}


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
			// Handle other errors (network errors, etc.)
			res.status(500).json({
				error: 'Failed to fetch token USD balance',
				details: error.message || 'Unknown error occurred'
			});
		}
	}
});




/**
 * @swagger
 * /wallet/get-token-price/{token}:
 *   get:
 *     summary: Get current token price
 *     tags: [Wallet]
 *     description: Fetch the current market price of a token in USD
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token symbol (e.g., bitcoin, ethereum, usd-coin)
 *     responses:
 *       200:
 *         description: Token price retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: number
 *                   description: Current token price in USD
 *       404:
 *         description: Token price not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
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



/**
 * @swagger
 * /wallet/send-token:
 *   post:
 *     summary: Send tokens to another wallet
 *     tags: [Wallet]
 *     description: Transfer tokens from one wallet to another on the specified blockchain
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - receiverWalletAddress
 *               - tokenToSend
 *               - senderWalletAddress
 *               - senderPrivateKey
 *               - chainId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount of tokens to send
 *               receiverWalletAddress:
 *                 type: string
 *                 description: Recipient wallet address
 *               tokenToSend:
 *                 type: string
 *                 description: Token symbol to send
 *               senderWalletAddress:
 *                 type: string
 *                 description: Sender wallet address
 *               senderPrivateKey:
 *                 type: string
 *                 description: Sender's private key (encrypted)
 *               chainId:
 *                 type: string
 *                 description: Blockchain network ID
 *             example:
 *               amount: 0.1
 *               receiverWalletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
 *               tokenToSend: "ETH"
 *               senderWalletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
 *               senderPrivateKey: "encrypted_private_key"
 *               chainId: "ethereum"
 *     responses:
 *       200:
 *         description: Token sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   description: Success message with transaction details
 *                 data:
 *                   type: object
 *                   description: Transaction result data
 *       400:
 *         description: Bad request - missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *       500:
 *         description: Failed to send token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
// Regular token send route
router.post('/send-token', async (req, res) => {
	const {
		amount,
		receiverWalletAddress,
		tokenToSend,
		senderWalletAddress,
		senderPrivateKey,
		chainId,
		useGasSponsorship = false
	} = req.body;

	console.log('--- /wallet/send-token called ---');
	console.log('Request body:', req.body);

	try {
		// Validate required fields
		if (!amount || !receiverWalletAddress || !tokenToSend || !senderWalletAddress || !senderPrivateKey || !chainId) {
			console.log('Missing required fields:', { amount, receiverWalletAddress, tokenToSend, senderWalletAddress, senderPrivateKey: !!senderPrivateKey, chainId });
			return res.status(400).json({
				success: false,
				error: 'Missing required fields',
				details: 'All fields are required: amount, receiverWalletAddress, tokenToSend, senderWalletAddress, senderPrivateKey, chainId'
			});
		}

		// Validate amount
		if (isNaN(amount) || amount <= 0) {
			console.log('Invalid amount:', amount);
			return res.status(400).json({
				success: false,
				error: 'Invalid amount',
				details: 'Amount must be a positive number'
			});
		}

		let result;
		
		if (chainId === 'nullnet') {
			result = await nullNetService.sendToken(
				amount,
				receiverWalletAddress,
				tokenToSend,
				senderWalletAddress,
				senderPrivateKey,
				chainId
			);
		} else if (chainId === 'flowTestnet') {
			console.log('Flow testnet transaction detected.');
			if (!flowService) {
				console.log('Flow service unavailable');
				return res.status(503).json({
					success: false,
					error: 'Flow service unavailable'
				});
			}
			try {
				if (useGasSponsorship) {
					console.log('Using gas sponsorship for Flow transaction...');
					result = await flowService.sendTransactionWithGasSponsorship({
						amount,
						receiverWalletAddress,
						tokenToSend,
						senderWalletAddress,
						senderPrivateKey,
						chainId
					});
				} else {
					console.log('Using regular Flow transaction...');
					result = await flowService.sendTransaction({
						amount,
						receiverWalletAddress,
						tokenToSend,
						senderWalletAddress,
						senderPrivateKey,
						chainId
					});
				}
				console.log('FlowService result:', result);
			} catch (err) {
				console.error('Error from FlowService:', err);
				throw err;
			}
		} else {
			result = await sendToken(
				amount,
				receiverWalletAddress,
				tokenToSend,
				senderWalletAddress,
				senderPrivateKey,
				chainId
			);
		}

		console.log('Send-token result:', result);
		res.status(200).json({
			success: true,
			message: `Token ${tokenToSend} sent to ${receiverWalletAddress} on ${result.chain}${result.gasSponsored ? ' with gas sponsorship' : ''}`,
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

// Gas-sponsored token send route
router.post('/send-token-sponsored', async (req, res) => {
	const {
		amount,
		receiverWalletAddress,
		tokenToSend,
		senderWalletAddress,
		senderPrivateKey,
		chainId
	} = req.body;

	console.log('--- /wallet/send-token-sponsored called ---');
	console.log('Request body:', req.body);

	try {
		// Validate required fields
		if (!amount || !receiverWalletAddress || !tokenToSend || !senderWalletAddress || !senderPrivateKey || !chainId) {
			console.log('Missing required fields:', { amount, receiverWalletAddress, tokenToSend, senderWalletAddress, senderPrivateKey: !!senderPrivateKey, chainId });
			return res.status(400).json({
				success: false,
				error: 'Missing required fields',
				details: 'All fields are required: amount, receiverWalletAddress, tokenToSend, senderWalletAddress, senderPrivateKey, chainId'
			});
		}

		// Validate amount
		if (isNaN(amount) || amount <= 0) {
			console.log('Invalid amount:', amount);
			return res.status(400).json({
				success: false,
				error: 'Invalid amount',
				details: 'Amount must be a positive number'
			});
		}

		// Check if gas sponsorship is supported for this chain
		if (chainId !== 'flowTestnet') {
			return res.status(400).json({
				success: false,
				error: 'Gas sponsorship not supported',
				details: `Gas sponsorship is currently only supported on Flow testnet`
			});
		}

		// Check if the token supports gas sponsorship (currently only ERC20 tokens)
		const token = tokens[tokenToSend.toLowerCase()];
		if (token && (token.type === 'native' || !token.chains[chainId]?.address)) {
			return res.status(400).json({
				success: false,
				error: 'Gas sponsorship not supported for native tokens',
				details: `Gas sponsorship is currently only supported for ERC20 tokens on Flow testnet`
			});
		}

		let result;
		
		if (chainId === 'flowTestnet') {
			console.log('Flow testnet gas-sponsored transaction detected.');
			if (!flowService) {
				console.log('Flow service unavailable');
				return res.status(503).json({
					success: false,
					error: 'Flow service unavailable'
				});
			}
			try {
				result = await flowService.sendTransactionWithGasSponsorship({
					amount,
					receiverWalletAddress,
					tokenToSend,
					senderWalletAddress,
					senderPrivateKey,
					chainId
				});
				console.log('FlowService gas-sponsored result:', result);
			} catch (err) {
				console.error('Error from FlowService gas sponsorship:', err);
				throw err;
			}
		} else {
			return res.status(400).json({
				success: false,
				error: 'Unsupported chain for gas sponsorship',
				details: `Chain ${chainId} does not support gas sponsorship`
			});
		}

		console.log('Gas-sponsored send-token result:', result);
		res.status(200).json({
			success: true,
			message: `Token ${tokenToSend} sent to ${receiverWalletAddress} on ${result.chain} with gas sponsorship`,
			data: result
		});
	} catch (error) {
		console.error('Error sending gas-sponsored token:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to send gas-sponsored token',
			details: error.message
		});
	}
});

/**
 * @swagger
 * /wallet/balance/{chainId}/{walletAddress}:
 *   get:
 *     summary: Get native token balance
 *     tags: [Wallet]
 *     description: Get the balance of the native token (ETH, MATIC, BNB, etc.) for a wallet on a specific blockchain
 *     parameters:
 *       - in: path
 *         name: chainId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blockchain network ID (ethereum, polygon, bsc, nullnet, etc.)
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to check balance for
 *     responses:
 *       200:
 *         description: Native token balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 balance:
 *                   type: string
 *                   description: Balance in wei or smallest unit
 *                 chain:
 *                   type: string
 *                   description: Chain name
 *                 walletAddress:
 *                   type: string
 *                   description: Wallet address
 *                 source:
 *                   type: string
 *                   description: Data source (optional, e.g., "etherscan")
 *       400:
 *         description: Unsupported chain
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to get balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
// Get wallet balance for native token on a specific chain (route that frontend expects)
router.get('/balance/:chainId/:walletAddress', async (req, res) => {
		const { chainId, walletAddress } = req.params;
	const chain = chainUtils.getChain(chainId);
	
	try {
		console.log(`Getting native balance for ${walletAddress} on ${chainId}`);

		// Handle NullNet chain
		if (chainId === 'nullnet') {
			if (!nullNetService) {
				return res.status(503).json({
					success: false,
					error: 'NullNet service unavailable'
				});
			}
			
			const balances = await nullNetService.getWalletBalances(walletAddress, chainId);
			let totalBalance = 0;
			Object.keys(balances).forEach(symbol => {
				totalBalance += parseFloat(balances[symbol]) || 0;
			});
			
			res.json({
				success: true,
				balance: totalBalance.toString(),
				chain: 'NullNet',
				walletAddress
			});
			return;
		}

		// For Ethereum and other chains, get the native token balance
		if (!chain) {
			return res.status(400).json({
				success: false,
				error: `Chain ${chainId} is not supported`
			});
		}

		let retries = 3;
		let lastError = null;
		
		while (retries > 0) {
			try {
		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
				// Set a timeout for the provider
				provider._getConnection().timeout = 10000; // 10 seconds
				
		const balance = await provider.getBalance(walletAddress);
		const formattedBalance = ethers.formatEther(balance);

		res.json({
			success: true,
			balance: formattedBalance,
			chain: chain.name,
			walletAddress
		});
				return;
			} catch (error) {
				lastError = error;
				retries--;
				console.log(`RPC connection failed for ${chainId}, retries left: ${retries}`, error.message);
				
				if (retries > 0) {
					// Wait a bit before retrying
					await new Promise(resolve => setTimeout(resolve, 1000));
				}
			}
		}
		
		// If all retries failed
		throw lastError;
	} catch (error) {
		console.error('Error getting balance:', error);
		
		// Try Etherscan as fallback for Ethereum networks
		if ((chainId === 'ethereum' || chainId === 'sepolia') && process.env.ETHERSCAN_KEY) {
			try {
				console.log(`Falling back to Etherscan API for ${chainId}`);
				const etherscanUrl = chainId === 'sepolia' ? 
					'https://api-sepolia.etherscan.io' : 
					'https://api.etherscan.io';
				
				const response = await axios.get(
					`${etherscanUrl}/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${process.env.ETHERSCAN_KEY}`
				);
				
				if (response.data.status === '1') {
					const balance = ethers.formatEther(response.data.result);
					res.json({
						success: true,
						balance: balance,
						chain: chain.name,
						walletAddress,
						source: 'etherscan'
					});
					return;
				}
			} catch (etherscanError) {
				console.error('Etherscan fallback also failed:', etherscanError);
			}
		}
		
		res.status(500).json({
			success: false,
			error: 'Failed to get balance',
			details: error.message
		});
	}
});

/**
 * @swagger
 * /wallet/token-transactions/{chainId}/{tokenSymbol}/{walletAddress}:
 *   get:
 *     summary: Get token transaction history
 *     tags: [Wallet]
 *     description: Retrieve transaction history for a specific token on a wallet address
 *     parameters:
 *       - in: path
 *         name: chainId
 *         required: true
 *         schema:
 *           type: string
 *         description: Blockchain network ID
 *       - in: path
 *         name: tokenSymbol
 *         required: true
 *         schema:
 *           type: string
 *         description: Token symbol (e.g., USDC, ETH)
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address to get transactions for
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number for pagination
 *       - in: query
 *         name: offset
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Number of transactions per page
 *     responses:
 *       200:
 *         description: Token transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hash:
 *                         type: string
 *                         description: Transaction hash
 *                       from:
 *                         type: string
 *                         description: Sender address
 *                       to:
 *                         type: string
 *                         description: Recipient address
 *                       value:
 *                         type: string
 *                         description: Transaction value
 *                       tokenSymbol:
 *                         type: string
 *                         description: Token symbol
 *                       tokenName:
 *                         type: string
 *                         description: Token name
 *                       tokenDecimal:
 *                         type: string
 *                         description: Token decimals
 *                       gasPrice:
 *                         type: string
 *                         description: Gas price
 *                       gasUsed:
 *                         type: string
 *                         description: Gas used
 *                       timeStamp:
 *                         type: string
 *                         description: Transaction timestamp
 *                       blockNumber:
 *                         type: string
 *                         description: Block number
 *                       contractAddress:
 *                         type: string
 *                         description: Token contract address
 *                       type:
 *                         type: string
 *                         enum: [send, receive]
 *                         description: Transaction type
 *                 totalCount:
 *                   type: number
 *                   description: Total number of transactions
 *                 chain:
 *                   type: string
 *                   description: Chain name
 *                 walletAddress:
 *                   type: string
 *                   description: Wallet address
 *                 tokenSymbol:
 *                   type: string
 *                   description: Token symbol
 *                 page:
 *                   type: number
 *                   description: Current page number
 *       400:
 *         description: Unsupported chain or token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to get transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 */
// Get ERC20 token transactions for a wallet
router.get('/token-transactions/:chainId/:tokenSymbol/:walletAddress', async (req, res) => {
	try {
		const { chainId, tokenSymbol, walletAddress } = req.params;
		const { page = '1', offset = '10' } = req.query;
		console.log(`Getting ${tokenSymbol} transactions for ${walletAddress} on ${chainId}, page ${page}, offset ${offset}`);
		
		const chain = chainUtils.getChain(chainId);
		if (!chain) {
			return res.status(400).json({
				success: false,
				error: `Chain ${chainId} is not supported`
			});
		}

		// Get token info
		const token = tokens[tokenSymbol.toLowerCase()];
		if (!token) {
			return res.status(400).json({
				success: false,
				error: `Token ${tokenSymbol} is not supported`
			});
		}

		const tokenOnChain = token.chains[chainId];
		if (!tokenOnChain || !tokenOnChain.address) {
			return res.status(400).json({
				success: false,
				error: `Token ${tokenSymbol} is not an ERC20 token on ${chainId}`
			});
		}

		let transactions = [];
		let totalCount = 0;

		// Use blockchain explorers for ERC20 transaction history
		if ((chainId === 'ethereum' || chainId === 'sepolia') && process.env.ETHERSCAN_KEY) {
			// Etherscan API for ERC20 tokens
			const etherscanUrl = chainId === 'sepolia' ? 
				'https://api-sepolia.etherscan.io' : 
				'https://api.etherscan.io';
			
			console.log(`Fetching ERC20 transactions from Etherscan...`);
			
			const response = await axios.get(
				`${etherscanUrl}/api?module=account&action=tokentx&contractaddress=${tokenOnChain.address}&address=${walletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`
			);

			console.log(`Etherscan response status: ${response.data.status}, message: ${response.data.message}`);
			
			if (response.data.status === '1' && response.data.result) {
				console.log(`Found ${response.data.result.length} ERC20 transactions`);
				transactions = response.data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					tokenSymbol: tx.tokenSymbol,
					tokenName: tx.tokenName,
					tokenDecimal: tx.tokenDecimal,
					gasPrice: tx.gasPrice,
					gasUsed: tx.gasUsed,
					timeStamp: tx.timeStamp,
					blockNumber: tx.blockNumber,
					contractAddress: tx.contractAddress,
					type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive'
				}));
				
				// Get total count
				const countResponse = await axios.get(
					`${etherscanUrl}/api?module=account&action=tokentx&contractaddress=${tokenOnChain.address}&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10000&apikey=${process.env.ETHERSCAN_KEY}`
				);
				totalCount = countResponse.data.result ? countResponse.data.result.length : 0;
			}
		} else if ((chainId === 'polygon' || chainId === 'mumbai') && process.env.POLYGONSCAN_KEY) {
			// Polygonscan API for ERC20 tokens
			const polygonscanUrl = chainId === 'mumbai' ? 
				'https://api-testnet.polygonscan.com' : 
				'https://api.polygonscan.com';
			
			const response = await axios.get(
				`${polygonscanUrl}/api?module=account&action=tokentx&contractaddress=${tokenOnChain.address}&address=${walletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.POLYGONSCAN_KEY}`
			);

			if (response.data.status === '1' && response.data.result) {
				transactions = response.data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					tokenSymbol: tx.tokenSymbol,
					tokenName: tx.tokenName,
					tokenDecimal: tx.tokenDecimal,
					gasPrice: tx.gasPrice,
					gasUsed: tx.gasUsed,
					timeStamp: tx.timeStamp,
					blockNumber: tx.blockNumber,
					contractAddress: tx.contractAddress,
					type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive'
				}));
				totalCount = transactions.length;
			}
		} else if ((chainId === 'bsc' || chainId === 'bscTestnet') && process.env.BSCSCAN_KEY) {
			// BscScan API for ERC20 tokens
			const bscscanUrl = chainId === 'bscTestnet' ? 
				'https://api-testnet.bscscan.com' : 
				'https://api.bscscan.com';
			
			const response = await axios.get(
				`${bscscanUrl}/api?module=account&action=tokentx&contractaddress=${tokenOnChain.address}&address=${walletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.BSCSCAN_KEY}`
			);

			if (response.data.status === '1' && response.data.result) {
				transactions = response.data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					tokenSymbol: tx.tokenSymbol,
					tokenName: tx.tokenName,
					tokenDecimal: tx.tokenDecimal,
					gasPrice: tx.gasPrice,
					gasUsed: tx.gasUsed,
					timeStamp: tx.timeStamp,
					blockNumber: tx.blockNumber,
					contractAddress: tx.contractAddress,
					type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive'
				}));
				totalCount = transactions.length;
			}
		} else if (chainId === 'flowTestnet') {
			// Flowscan API for Flow EVM testnet token transfers
			console.log('Using Flowscan API for token transfers (no API key required)');
			try {
				const response = await axios.get(
					`https://evm-testnet.flowscan.io/api/v2/addresses/${walletAddress}/transactions`,
					{
						params: {
							filter: 'to | from',
							page: page,
							limit: offset
						},
						headers: {
							'accept': 'application/json'
						}
					}
				);

				console.log(`Flowscan response status: ${response.status}`);
				if (response.data && response.data.items) {
					console.log(`Found ${response.data.items.length} Flow transactions, filtering for token transfers`);
					// Filter for transactions that have token transfers
					const tokenTransactions = response.data.items.filter(tx => 
						tx.token_transfers && tx.token_transfers.length > 0
					);
					
					transactions = tokenTransactions.map(tx => {
						const tokenTransfer = tx.token_transfers && tx.token_transfers[0];
						return {
							hash: tx.hash,
							from: tx.from?.hash || tx.from,
							to: tx.to?.hash || tx.to,
							value: tokenTransfer?.total?.value || tx.value || '0',
							tokenSymbol: tokenTransfer?.token?.symbol || tokenSymbol.toUpperCase(),
							tokenName: tokenTransfer?.token?.name || tokenSymbol.toUpperCase(),
							tokenDecimal: tokenTransfer?.token?.decimals || '18',
							gasPrice: tx.gas_price || '0',
							gasUsed: tx.gas_used || '0',
							timeStamp: tx.timestamp ? new Date(tx.timestamp).getTime() / 1000 : Date.now() / 1000,
							blockNumber: tx.block_number || 0,
							contractAddress: tokenTransfer?.token?.address || '',
							type: (tx.from?.hash || tx.from)?.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive',
							method: tx.method || 'unknown',
							status: tx.status || 'ok'
						};
					});
					totalCount = transactions.length;
				}
			} catch (flowError) {
				console.error('Error fetching Flow token transactions:', flowError);
				// Continue with empty transactions if Flow API fails
			}
		} else {
			console.log('No block explorer API key available for chain:', chainId);
			return res.json({
				success: true,
				transactions: [],
				totalCount: 0,
				chain: chain.name,
				walletAddress,
				tokenSymbol,
				message: 'Block explorer API key required for ERC20 transaction history'
			});
		}

		res.json({
			success: true,
			transactions,
			totalCount,
			chain: chain.name,
			walletAddress,
			tokenSymbol,
			page: parseInt(page),
			offset: parseInt(offset)
		});
	} catch (error) {
		console.error('Error getting ERC20 transactions:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get ERC20 transactions',
			details: error.message
		});
	}
});

// Get transactions for a wallet
router.get('/transactions/:chainId/:walletAddress', async (req, res) => {
	try {
		const { chainId, walletAddress } = req.params;
		const { page = '1', offset = '10' } = req.query;
		console.log(`Getting transactions for ${walletAddress} on ${chainId}, page ${page}, offset ${offset}`);
		
		// Handle NullNet chain
		if (chainId === 'nullnet') {
			// For NullNet, return empty transactions for now
			// TODO: Implement NullNet transaction history
		res.json({
			success: true,
			transactions: [],
			totalCount: 0,
				chain: 'NullNet',
			walletAddress
			});
			return;
		}

		const chain = chainUtils.getChain(chainId);
		if (!chain) {
			return res.status(400).json({
				success: false,
				error: `Chain ${chainId} is not supported`
			});
		}

		let transactions = [];
		let totalCount = 0;

		// Use blockchain explorers for transaction history
		if ((chainId === 'ethereum' || chainId === 'sepolia') && process.env.ETHERSCAN_KEY) {
			// Etherscan API
			console.log(`Using Etherscan API with key: ${process.env.ETHERSCAN_KEY ? 'Present' : 'Missing'}`);
			const etherscanUrl = chainId === 'sepolia' ? 
				'https://api-sepolia.etherscan.io' : 
				'https://api.etherscan.io';
			
			console.log(`Fetching from: ${etherscanUrl}/api?module=account&action=txlist&address=${walletAddress}...`);
			
			const response = await axios.get(
				`${etherscanUrl}/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.ETHERSCAN_KEY}`
			);

			console.log(`Etherscan response status: ${response.data.status}, message: ${response.data.message}`);
			
			if (response.data.status === '1' && response.data.result) {
				console.log(`Found ${response.data.result.length} transactions`);
				transactions = response.data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					gasPrice: tx.gasPrice,
					gasUsed: tx.gasUsed,
					timeStamp: tx.timeStamp,
					blockNumber: tx.blockNumber,
					isError: tx.isError || '0',
					type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive'
				}));
				
				// Get total count (approximate, as Etherscan doesn't provide exact count)
				const countResponse = await axios.get(
					`${etherscanUrl}/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10000&apikey=${process.env.ETHERSCAN_KEY}`
				);
				totalCount = countResponse.data.result ? countResponse.data.result.length : 0;
			}
		} else if ((chainId === 'polygon' || chainId === 'mumbai') && process.env.POLYGONSCAN_KEY) {
			// Polygonscan API
			const polygonscanUrl = chainId === 'mumbai' ? 
				'https://api-testnet.polygonscan.com' : 
				'https://api.polygonscan.com';
			
			const response = await axios.get(
				`${polygonscanUrl}/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.POLYGONSCAN_KEY}`
			);

			if (response.data.status === '1' && response.data.result) {
				transactions = response.data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					gasPrice: tx.gasPrice,
					gasUsed: tx.gasUsed,
					timeStamp: tx.timeStamp,
					blockNumber: tx.blockNumber,
					isError: tx.isError || '0',
					type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive'
				}));
				totalCount = transactions.length;
			}
		} else if ((chainId === 'bsc' || chainId === 'bscTestnet') && process.env.BSCSCAN_KEY) {
			// BscScan API
			const bscscanUrl = chainId === 'bscTestnet' ? 
				'https://api-testnet.bscscan.com' : 
				'https://api.bscscan.com';
			
			const response = await axios.get(
				`${bscscanUrl}/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=${page}&offset=${offset}&sort=desc&apikey=${process.env.BSCSCAN_KEY}`
			);

			if (response.data.status === '1' && response.data.result) {
				transactions = response.data.result.map(tx => ({
					hash: tx.hash,
					from: tx.from,
					to: tx.to,
					value: tx.value,
					gasPrice: tx.gasPrice,
					gasUsed: tx.gasUsed,
					timeStamp: tx.timeStamp,
					blockNumber: tx.blockNumber,
					isError: tx.isError || '0',
					type: tx.from.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive'
				}));
				totalCount = transactions.length;
			}
		} else if (chainId === 'flowTestnet') {
			// Flowscan API for Flow EVM testnet
			console.log('Using Flowscan API (no API key required)');
			try {
				// Flowscan API v2 endpoint for address-specific transactions
				const response = await axios.get(
					`https://evm-testnet.flowscan.io/api/v2/addresses/${walletAddress}/transactions`,
					{
						params: {
							filter: 'to | from',
							page: page,
							limit: offset
						},
						headers: {
							'accept': 'application/json'
						}
					}
				);

				console.log(`Flowscan response status: ${response.status}`);
				if (response.data && response.data.items) {
					console.log(`Found ${response.data.items.length} Flow transactions`);
					transactions = response.data.items.map(tx => ({
						hash: tx.hash,
						from: tx.from?.hash || tx.from,
						to: tx.to?.hash || tx.to,
						value: tx.value || '0',
						gasPrice: tx.gas_price || '0',
						gasUsed: tx.gas_used || '0',
						timeStamp: tx.timestamp ? new Date(tx.timestamp).getTime() / 1000 : Date.now() / 1000,
						blockNumber: tx.block_number || 0,
						isError: tx.status === 'error' ? '1' : '0',
						type: (tx.from?.hash || tx.from)?.toLowerCase() === walletAddress.toLowerCase() ? 'send' : 'receive',
						method: tx.method || 'unknown',
						status: tx.status || 'ok'
					}));
					totalCount = transactions.length;
				}
			} catch (flowError) {
				console.error('Error fetching Flow transactions:', flowError);
				// Continue with empty transactions if Flow API fails
			}
		} else {
			// Fallback: Try to get recent transactions from the blockchain
			// This is limited and won't show full history
			console.log('No block explorer API key available for chain:', chainId);
			console.log('Available keys:', {
				etherscan: !!process.env.ETHERSCAN_KEY,
				polygonscan: !!process.env.POLYGONSCAN_KEY,
				bscscan: !!process.env.BSCSCAN_KEY,
				flowscan: !!process.env.FLOWSCAN_API_KEY
			});
		}

		res.json({
			success: true,
			transactions,
			totalCount,
			chain: chain.name,
			walletAddress,
			page: parseInt(page),
			offset: parseInt(offset)
		});
	} catch (error) {
		console.error('Error getting transactions:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get transactions',
			details: error.message
		});
	}
});

// Get wallet balance for a specific token on a specific chain
router.get('/balance/:chainId/:tokenSymbol/:walletAddress', async (req, res) => {
	try {
		const { chainId, tokenSymbol, walletAddress } = req.params;

		// Handle NullNet chain
		if (chainId === 'nullnet') {
			const balance = await nullNetService.getTokenBalance(walletAddress, tokenSymbol, chainId);
			const asset = await nullNetService.getAsset(tokenSymbol.toUpperCase());
			
			res.json({
				success: true,
				data: {
					chain: 'NullNet',
					token: tokenSymbol.toUpperCase(),
					walletAddress,
					balance: parseFloat(balance),
					decimals: 18,
					type: 'nullnet',
					assetName: asset ? asset.name : tokenSymbol.toUpperCase()
				}
			});
			return;
		}

		// Validate chain and token combination for other chains
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

		// Handle NullNet chain
		if (chainId === 'nullnet') {
			const balances = await nullNetService.getWalletBalances(walletAddress, chainId);
			const assets = await nullNetService.listAssets();
			
			// Format balances to match the expected structure
			const formattedBalances = Object.keys(balances).map(symbol => {
				const asset = assets.find(a => a.ticker === symbol);
				return {
					symbol: symbol,
					name: asset ? asset.name : symbol,
					balance: balances[symbol],
					decimals: 18,
					type: 'nullnet'
				};
			});

			res.json({
				success: true,
				data: {
					chain: 'NullNet',
					walletAddress,
					balances: formattedBalances
				}
			});
			return;
		}

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
					const rawBalance = await contract.balanceOf(walletAddress);
					balance = ethers.formatUnits(rawBalance, token.decimals);
					
					// Debug logging for USDC/USDT
					if (token.symbol === 'USDC' || token.symbol === 'USDT') {
						console.log(`Debug ${token.symbol} on ${chainId}:`, {
							rawBalance: rawBalance.toString(),
							decimals: token.decimals,
							formattedBalance: balance,
							contractAddress: token.address
						});
					}
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

// Get user's supported chains
router.get('/user/:userId/chains', async (req, res) => {
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
				currentChain: user.currentChain,
				supportedChains: user.supportedChains || []
			}
		});
	} catch (error) {
		console.error('Error getting user chains:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get user chains',
			details: error.message
		});
	}
});

// Get tokens for a specific chain
router.get('/chains/:chainId/tokens', (req, res) => {
	try {
		const { chainId } = req.params;
		const chainTokens = getTokensForChain(chainId);

		if (chainTokens.length === 0) {
			return res.status(404).json({
				success: false,
				error: `No tokens found for chain: ${chainId}`
			});
		}

		res.json({
			success: true,
			data: {
				chainId,
				tokens: chainTokens
			}
		});
	} catch (error) {
		console.error('Error getting chain tokens:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get chain tokens',
			details: error.message
		});
	}
});

// Update user's current chain
router.put('/user/:userId/current-chain', async (req, res) => {
	try {
		const { userId } = req.params;
		const { chainId } = req.body;

		if (!chainId) {
			return res.status(400).json({
				success: false,
				error: 'Chain ID is required'
			});
		}

		const user = await Users.findOne({ userID: userId });
		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Check if user has this chain in their supported chains
		const hasChain = user.supportedChains.some(chain => chain.chainId === chainId);
		if (!hasChain) {
			return res.status(400).json({
				success: false,
				error: 'Chain not supported by user'
			});
		}

		user.currentChain = chainId;
		await user.save();

		res.json({
			success: true,
			data: {
				userId,
				currentChain: chainId,
				message: 'Current chain updated successfully'
			}
		});
	} catch (error) {
		console.error('Error updating current chain:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to update current chain',
			details: error.message
		});
	}
});

// Get user's token balances for a specific chain
router.get('/user/:userId/balances/:chainId', async (req, res) => {
	try {
		const { userId, chainId } = req.params;
		const user = await Users.findOne({ userID: userId });

		if (!user) {
			return res.status(404).json({
				success: false,
				error: 'User not found'
			});
		}

		// Get user's token balances for the specified chain
		const chainBalances = user.tokenBalances.filter(balance => balance.chainId === chainId);

		res.json({
			success: true,
			data: {
				userId,
				chainId,
				balances: chainBalances
			}
		});
	} catch (error) {
		console.error('Error getting user balances:', error);
		res.status(500).json({
			success: false,
			error: 'Failed to get user balances',
			details: error.message
		});
	}
});

// Debug endpoint to check raw balances
router.get('/debug/balance/:chainId/:tokenSymbol/:walletAddress', async (req, res) => {
	try {
		const { chainId, tokenSymbol, walletAddress } = req.params;
		const token = tokens[tokenSymbol.toLowerCase()];
		const chain = chainUtils.getChain(chainId);
		
		if (!token || !chain) {
			return res.status(400).json({ error: 'Invalid token or chain' });
		}
		
		const tokenOnChain = token.chains[chainId];
		if (!tokenOnChain) {
			return res.status(400).json({ error: 'Token not supported on chain' });
		}
		
		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
		
		if (tokenOnChain.address) {
			// ERC20 token
			const contract = new ethers.Contract(
				tokenOnChain.address,
				['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
				provider
			);
			
			const [rawBalance, contractDecimals] = await Promise.all([
				contract.balanceOf(walletAddress),
				contract.decimals()
			]);
			
			const formattedBalance = ethers.formatUnits(rawBalance, contractDecimals);
			const configuredDecimals = tokenOnChain.decimals;
			
			res.json({
				token: tokenSymbol,
				chain: chainId,
				walletAddress,
				contractAddress: tokenOnChain.address,
				rawBalance: rawBalance.toString(),
				contractDecimals: contractDecimals,
				configuredDecimals: configuredDecimals,
				formattedWithContractDecimals: formattedBalance,
				formattedWithConfiguredDecimals: ethers.formatUnits(rawBalance, configuredDecimals),
				note: 'If contractDecimals != configuredDecimals, there may be a configuration issue'
			});
		} else {
			// Native token
			const balance = await provider.getBalance(walletAddress);
			res.json({
				token: tokenSymbol,
				chain: chainId,
				walletAddress,
				rawBalance: balance.toString(),
				decimals: tokenOnChain.decimals,
				formattedBalance: ethers.formatUnits(balance, tokenOnChain.decimals)
			});
		}
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;