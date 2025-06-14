const { ethers } = require('ethers');
const chainUtils = require('./chainUtils');
const {
	Network,
	Alchemy,
	Wallet,
	Utils
} = require("alchemy-sdk");
// Importing dotenv to read the API key from the .env file
const dotenv = require("dotenv");
dotenv.config();

const {
	Users
} = require('../models/user');


// Reading the API key and private key from the .env file
const {
	API_KEY,
	PRIVATE_KEY
} = process.env;

// Configuring the Alchemy SDK
const settings = {
	apiKey: API_KEY, // Replace with your API key.
	network: Network.ETH_SEPOLIA, // Replace with your network.
};

// Creating an instance of the Alchemy SDK
const alchemy = new Alchemy(settings);


const wallet = ethers.Wallet.createRandom()

const createEthWallet = () => {
	return {
		walletName: 'ethereum',
		walletAddress: wallet.address,
		walletKey: wallet.privateKey,
		walletPhrase: wallet.mnemonic.phrase,
	}
}

const createUSDTWallet = () => {
	return {
		walletName: 'usdt',
		walletAddress: wallet.address,
		walletKey: wallet.privateKey,
		walletPhrase: wallet.mnemonic.phrase,
	}
}



// define contract addresses
const pulsr = '0x3dC961b0bcEBC01088AF48307b3C4Ea2Bfd21D2F'




const sendETH = async (
	TokenToAddress,
	TokenAmountToSend,
	sendersPrivateKey
) => {
	const wallet = new Wallet(sendersPrivateKey, alchemy);
	const toAddress = TokenToAddress;

	// Limit `TokenAmountToSend` to 18 decimal places and convert to string
	const formattedAmount = parseFloat(TokenAmountToSend).toFixed(18);
	const amountInWei = ethers.parseUnits(formattedAmount, "ether"); // Convert ETH to wei

	// Fetch gas fee data
	const feeData = await alchemy.core.getFeeData();

	// Set up ETH transaction details
	const transaction = {
		to: toAddress,
		value: amountInWei,
		nonce: await alchemy.core.getTransactionCount(wallet.getAddress()),
		maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
		maxFeePerGas: feeData.maxFeePerGas,
		type: 2,
		chainId: 11155111,
		gasLimit: ethers.parseUnits("21000", "wei"),
	};

	// Send the ETH transaction
	const sentTx = await wallet.sendTransaction(transaction);
	console.log("ETH sent transaction:", sentTx);
	return sentTx;
};


const sendERCToken = async (
	tokenAmountToSend,
	recieversWalletAddress,
	tokenToSend,
	sendersPrivateKey
) => {
	const tokenConfig = {
		usdt: {
			contractAddress: "0xYourUSDTContractAddress",
			decimals: 6
		},
		usdc: {
			contractAddress: "0xYourUSDCContractAddress",
			decimals: 6
		},
		pulsar: {
			contractAddress: "0x3dC961b0bcEBC01088AF48307b3C4Ea2Bfd21D2F",
			decimals: 18
		},
		// Add more tokens as needed
	};

	const tokenInfo = tokenConfig[tokenToSend.toLowerCase()];
	if (!tokenInfo) {
		throw new Error(`Unsupported token: ${tokenToSend}`);
	}

	console.log(sendersPrivateKey)

	const {
		contractAddress,
		decimals
	} = tokenInfo;
	const wallet = new Wallet(sendersPrivateKey, alchemy);
	const toAddress = recieversWalletAddress;

	// Convert tokenAmountToSend to the smallest unit using ethers.js
	const amountToSendInDecimals = ethers.parseUnits(tokenAmountToSend.toString(), decimals);

	const abi = ["function transfer(address to, uint256 value)"];
	const iface = new ethers.Interface(abi);
	const data = iface.encodeFunctionData("transfer", [toAddress, amountToSendInDecimals.toString()]);

	const feeData = await alchemy.core.getFeeData();

	const transaction = {
		to: contractAddress,
		nonce: await alchemy.core.getTransactionCount(wallet.getAddress()),
		maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
		maxFeePerGas: feeData.maxFeePerGas,
		type: 2,
		chainId: 11155111,
		data: data,
		gasLimit: ethers.parseUnits("250000", "wei"),
	};

	const sentTx = await wallet.sendTransaction(transaction);

	return sentTx;
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
		// Validate chain and token combination
		const { chain, token } = chainUtils.validateChainAndToken(chainId, tokenToSend);

		// Create provider and wallet
		const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
		const wallet = new ethers.Wallet(senderPrivateKey, provider);

		let transaction;
		if (token.type === 'native' || !token.address) {
			// Send native token (ETH, BNB, MATIC, etc.)
			const amountInWei = ethers.parseUnits(amount.toString(), token.decimals);
			
			transaction = await wallet.sendTransaction({
				to: receiverWalletAddress,
				value: amountInWei
			});
		} else {
			// Send ERC20 token
			const contract = new ethers.Contract(
				token.address,
				[
					'function transfer(address to, uint256 amount) returns (bool)',
					'function decimals() view returns (uint8)'
				],
				wallet
			);

			const amountInWei = ethers.parseUnits(amount.toString(), token.decimals);
			transaction = await contract.transfer(receiverWalletAddress, amountInWei);
		}

		// Wait for transaction to be mined
		const receipt = await transaction.wait();

		return {
			success: true,
			transactionHash: receipt.hash,
			blockNumber: receipt.blockNumber,
			chain: chain.name,
			token: tokenToSend.toUpperCase(),
			amount: amount,
			from: senderWalletAddress,
			to: receiverWalletAddress,
			type: token.type
		};
	} catch (error) {
		console.error('Error sending token:', error);
		throw new Error(`Failed to send token: ${error.message}`);
	}
};


















// // chainID list
// sepoliaID = 11155111

// const bnbTestnet = 'BNB_TESTNET';
// const opBNBTestnet = 'OPBNB-TESTNET';
// const ethHolesky = 'ETH_HOLESKY';
// const ethSepolia = 'ETH_SEPOLIA';

// so get balances from rpcs based on this. do for bnb and sepolia first.

// clean up as u go.



// Define RPC URLs for different chains
const CHAIN_CONFIG = {
	"eth-sepolia": {
		rpcURL: "https://eth-sepolia.g.alchemy.com/v2/Lb-x-7k59fDKNtZUObAxFdloZeIet8HR",
		nativeToken: "ether",
	},
	"bnb-testnet": {
		rpcURL: "https://bsc-testnet-rpc.publicnode.com",
		nativeToken: "bnb",
	},
	// Add more chains as needed
};

const getTokenBalance = async (walletAddress, contractAddress, chain) => {
	console.log(`Fetching balance for address: ${walletAddress}`);
	console.log(`Using contract address: ${contractAddress}`);
	console.log(`Chain: ${chain}`);

	// Get chain configuration
	const chainConfig = CHAIN_CONFIG[chain];
	if (!chainConfig) {
		throw new Error(`Unsupported chain: ${chain}`);
	}

	const {
		rpcURL,
		nativeToken
	} = chainConfig;
	const provider = new ethers.JsonRpcProvider(rpcURL);

	try {
		let balance;

		if (contractAddress.toLowerCase() === nativeToken) {
			console.log(`Fetching native token (${nativeToken}) balance...`);
			balance = await provider.getBalance(walletAddress);
			console.log(`Raw native token balance (in wei): ${balance.toString()}`);
			balance = ethers.formatEther(balance); // Convert to Ether/BNB units
			console.log(`Formatted native token balance: ${balance}`);
		} else {
			console.log(`Fetching ERC20 token balance for contract: ${contractAddress}`);
			// ERC20 ABI snippet to interact with `balanceOf` and `decimals` methods
			const ERC20_ABI = [
				"function balanceOf(address owner) view returns (uint256)",
				"function decimals() view returns (uint8)",
			];
			const tokenContract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

			// Fetch balance and token decimals
			const [rawBalance, decimals] = await Promise.all([
				tokenContract.balanceOf(walletAddress),
				tokenContract.decimals(),
			]);
			console.log(`Raw token balance: ${rawBalance.toString()}`);
			console.log(`Token decimals: ${decimals}`);

			// Format balance based on token decimals
			balance = ethers.formatUnits(rawBalance, decimals);
			console.log(`Formatted token balance: ${balance}`);
		}

		return balance;
	} catch (error) {
		console.error("Error fetching balance:", error);
		throw error; // Re-throw to handle it higher up if necessary
	}
};




module.exports = {
	createEthWallet,
	createUSDTWallet,
	sendToken,
	getTokenBalance,
};


// // Example usage:
// const walletAddress = "0x00000000219ab540356cbb839cbe05303d7705fa";
// const contractAddress = "ether"; // Use "ether" to get Ether balance, or provide a contract address for token balance

// getTokenBalance(walletAddress, contractAddress)
// .then(balance => console.log(`Balance: ${balance}`))
// .catch(console.error);