const { ethers } = require("ethers");
const chains = require('../config/chains');
const tokens = require('../config/tokens');

const createEthWallet = () => {
	const wallet = ethers.Wallet.createRandom()
	const walletDetails = {
		walletAddress: wallet.address,
		walletKey: wallet.privateKey,
		walletPhrase: wallet.mnemonic.phrase,
		walletName: "Ethereum Wallet"
	}

	return walletDetails
}

// Initialize all supported chains for a new user
const initializeUserChains = () => {
	const supportedChains = [];
	
	Object.values(chains).forEach(chain => {
		if (chain.isEnabled) {
			supportedChains.push({
				chainId: chain.id,
				chainName: chain.name,
				isEnabled: true,
				dateAdded: new Date()
			});
		}
	});
	
	return supportedChains;
};

// Initialize all supported tokens for a new user
const initializeUserTokens = () => {
	const supportedTokens = [];
	
	Object.values(tokens).forEach(token => {
		const chainData = [];
		
		// Add chain-specific data for each chain this token supports
		Object.keys(token.chains).forEach(chainId => {
			chainData.push({
				chainId: chainId,
				contractAddress: token.chains[chainId].address,
				decimals: token.chains[chainId].decimals,
				isEnabled: true
			});
		});
		
		supportedTokens.push({
			tokenSymbol: token.symbol,
			tokenName: token.name,
			tokenType: token.type,
			decimals: token.decimals,
			chainData: chainData,
			dateAdded: new Date()
		});
	});
	
	return supportedTokens;
};

// Initialize token balances for a new user (all set to 0)
const initializeTokenBalances = () => {
	const tokenBalances = [];
	
	Object.values(tokens).forEach(token => {
		Object.keys(token.chains).forEach(chainId => {
			tokenBalances.push({
				chainId: chainId,
				tokenSymbol: token.symbol,
				balance: "0",
				lastUpdated: new Date()
			});
		});
	});
	
	return tokenBalances;
};

// Helper function to get tokens for a specific chain
const getTokensForChain = (chainId) => {
	const chainTokens = [];
	
	Object.values(tokens).forEach(token => {
		if (token.chains[chainId]) {
			chainTokens.push({
				symbol: token.symbol,
				name: token.name,
				type: token.type,
				decimals: token.decimals,
				contractAddress: token.chains[chainId].address,
				chainDecimals: token.chains[chainId].decimals
			});
		}
	});
	
	return chainTokens;
};

const sendToken = async (
	amount,
	receiverWalletAddress,
	tokenToSend,
	senderWalletAddress,
	senderPrivateKey,
	chainId
) => {
	try {
		console.log("Attempting to send token with parameters:", {
			amount,
			receiverWalletAddress,
			tokenToSend,
			senderWalletAddress,
			chainId
		});

		// Validate chain
		const chain = chains[chainId];
		if (!chain) {
			throw new Error(`Unsupported chain: ${chainId}`);
		}

		// Validate token
		const token = tokens[tokenToSend.toLowerCase()];
		if (!token) {
			throw new Error(`Unsupported token: ${tokenToSend}`);
		}

		// Check if token is supported on this chain
		const tokenOnChain = token.chains[chainId];
		if (!tokenOnChain) {
			throw new Error(`Token ${tokenToSend} is not supported on chain ${chainId}`);
		}

		// Create provider and wallet
		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
		const wallet = new ethers.Wallet(senderPrivateKey, provider);

		let tx;
		const amountWei = ethers.parseUnits(amount.toString(), tokenOnChain.decimals);

		if (token.type === 'native' || !tokenOnChain.address) {
			// Native token transfer
			tx = await wallet.sendTransaction({
				to: receiverWalletAddress,
				value: amountWei
			});
		} else {
			// ERC20 token transfer
			const abi = [
				"function transfer(address to, uint256 amount) returns (bool)"
			];
			const contract = new ethers.Contract(tokenOnChain.address, abi, wallet);
			tx = await contract.transfer(receiverWalletAddress, amountWei);
		}

		console.log("Transaction sent:", tx.hash);
		
		return {
			success: true,
			hash: tx.hash,
			from: tx.from,
			to: receiverWalletAddress,
			value: amount,
			chain: chain.name,
			token: tokenToSend
		};

	} catch (error) {
		console.error("Error sending token:", error);
		throw error;
	}
};

const getTokenBalance = async (walletAddress, contractAddress, chainId = 'ethereum') => {
	try {
		console.log(`Getting token balance for wallet: ${walletAddress}, contract: ${contractAddress}, chain: ${chainId}`);

		const chain = chains[chainId];
		if (!chain) {
			throw new Error(`Unsupported chain: ${chainId}`);
		}

		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

		if (!contractAddress || contractAddress === 'null') {
			// Native token balance
			const balance = await provider.getBalance(walletAddress);
			return ethers.formatEther(balance);
		} else {
			// ERC20 token balance
			try {
				const abi = [
					"function balanceOf(address owner) view returns (uint256)"
				];
				const contract = new ethers.Contract(contractAddress, abi, provider);
				
				// Check if contract exists at the address
				const code = await provider.getCode(contractAddress);
				if (code === '0x') {
					console.warn(`No contract found at address: ${contractAddress}`);
					return '0'; // Return 0 balance if contract doesn't exist
				}
				
				const balance = await contract.balanceOf(walletAddress);
				return ethers.formatUnits(balance, 18); // Assuming 18 decimals, adjust as needed
			} catch (contractError) {
				console.error(`Contract error for address ${contractAddress}:`, contractError);
				
				// Check if it's a contract call error
				if (contractError.code === 'CALL_EXCEPTION' || contractError.reason === 'require(false)') {
					console.warn(`Contract call failed for ${contractAddress}, returning 0 balance`);
					return '0'; // Return 0 balance for failed contract calls
				}
				
				// Re-throw other errors
				throw contractError;
			}
		}

	} catch (error) {
		console.error('Error getting token balance:', error);
		throw error;
	}
};

const getOtherTokenBalances = async (walletAddress, contractAddresses) => {
	try {
		console.log(`Getting other token balances for wallet: ${walletAddress}`);

		const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
		const balances = {};

		for (const [tokenSymbol, contractAddress] of Object.entries(contractAddresses)) {
			try {
				if (!contractAddress || contractAddress === 'null') {
					// Skip native tokens as they're handled separately
					continue;
				}

				// Check if contract exists at the address
				const code = await provider.getCode(contractAddress);
				if (code === '0x') {
					console.warn(`No contract found at address: ${contractAddress} for ${tokenSymbol}`);
					balances[tokenSymbol] = '0';
					continue;
				}

				const abi = [
					"function balanceOf(address owner) view returns (uint256)"
				];
				const contract = new ethers.Contract(contractAddress, abi, provider);
				const balance = await contract.balanceOf(walletAddress);
				balances[tokenSymbol] = ethers.formatUnits(balance, 18);
			} catch (error) {
				console.error(`Error getting balance for ${tokenSymbol}:`, error);
				
				// Check if it's a contract call error
				if (error.code === 'CALL_EXCEPTION' || error.reason === 'require(false)') {
					console.warn(`Contract call failed for ${tokenSymbol} at ${contractAddress}, setting balance to 0`);
					balances[tokenSymbol] = '0';
				} else {
					// For other errors, still set to 0 but log the error
					balances[tokenSymbol] = '0';
				}
			}
		}

		return balances;

	} catch (error) {
		console.error('Error getting other token balances:', error);
		throw error;
	}
};

module.exports = {
	createEthWallet,
	initializeUserChains,
	initializeUserTokens,
	initializeTokenBalances,
	getTokensForChain,
	sendToken,
	getTokenBalance,
	getOtherTokenBalances
};