const getTokenPrice = async (token) => {
	const coinGeckoBaseLink = `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
	console.log(`Fetching price for ${token} from: ${coinGeckoBaseLink}`);

	try {
		const response = await fetch(coinGeckoBaseLink);
		const data = await response.json();
		return data[token]?.usd || null;
	} catch (error) {
		console.error(`Error fetching price for ${token}:`, error);
		return null;
	}
};


const getTokenPrices = async (token) => {
	const coinGeckoBaseLink = `https://api.coingecko.com/api/v3/simple/price?ids=${token}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
	console.log(`Fetching price for ${token} from: ${coinGeckoBaseLink}`);

	try {
		const response = await fetch(coinGeckoBaseLink);
		const data = await response.json();
		return data[token] ?.usd || null;
	} catch (error) {
		console.error(`Error fetching price for ${token}:`, error);
		return null;
	}
};







// add fallbacks here.

// Define the supported tokens
const initializeSupportedTokens = async () => {
	const supportedTokens = [{
			tokenName: 'ethereum',
			tokenSymbol: 'eth',
			id: 'ethereum',
			tokenPrice: await getTokenPrice('ethereum')
		},
		{
			tokenName: 'pulsar',
			tokenSymbol: 'pulsar',
			id: 'pulsar',
			tokenPrice: 100
		}, // Assume fixed price for this example
		{
			tokenName: 'tether',
			tokenSymbol: 'usdt',
			id: 'tether',
			tokenPrice: await getTokenPrice('tether')
		}
	];
	return supportedTokens;
};

// Convert USD amount into two specified tokens
const tokenPriceConverter = async (tokenToBuy, tokenToSell, usdAmount) => {
	const supportedTokens = await initializeSupportedTokens();

	// Find the specified tokens in supportedTokens by symbol
	const token1 = supportedTokens.find(t => t.tokenSymbol.toLowerCase() === tokenToBuy.toLowerCase());
	const token2 = supportedTokens.find(t => t.tokenSymbol.toLowerCase() === tokenToSell.toLowerCase());

	if (!token1 || !token2) {
		console.error(`One or both tokens (${tokenToBuy}, ${tokenToSell}) are not .`);
		return;
	}

	// Ensure both tokens have a valid price
	if (token1.tokenPrice > 0 && token2.tokenPrice > 0) {
		const token1Amount = usdAmount / token1.tokenPrice;
		const token2Amount = usdAmount / token2.tokenPrice;

		// Log results for each token
		console.log(`For $${usdAmount}, user swapping ${tokenToBuy.toUpperCase()} gets ${token1Amount} ${tokenToBuy.toUpperCase()}`);
		console.log(`For $${usdAmount}, user swapping ${tokenToSell.toUpperCase()} gets ${token2Amount} ${tokenToSell.toUpperCase()}`);

		return {
			tokenToBuy: {
				tokenAmount: token1Amount,
				tokenName: tokenToBuy
			},

			tokenToSell: {
				tokenAmount: token2Amount,
				tokenName: tokenToSell
			},
		}
	} else {
		console.error(`Price data unavailable for ${token1.tokenName} or ${token2.tokenName}`);
	}
};

// Example usage
// console.log(tokenPriceConverter('tnl', 'usdt', 10000));

module.exports = {
	tokenPriceConverter,
	getTokenPrice
};