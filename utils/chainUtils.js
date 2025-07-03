const chains = require('../config/chains');
const tokens = require('../config/tokens');

const chainUtils = {
    // Get chain details
    getChain: (chainId) => {
        return chains[chainId];
    },

    // Get all enabled chains
    getEnabledChains: () => {
        return Object.values(chains).filter(chain => chain.isEnabled);
    },

    // Get token details
    getToken: (symbol) => {
        return tokens[symbol.toLowerCase()];
    },

    // Get token details for a specific chain
    getTokenOnChain: (symbol, chainId) => {
        const token = tokens[symbol.toLowerCase()];
        if (!token) return null;
        return token.chains[chainId] || null;
    },

    // Check if token is supported on chain
    isTokenSupportedOnChain: (symbol, chainId) => {
        const chain = chains[chainId];
        if (!chain) return false;
        return chain.tokens.includes(symbol.toLowerCase());
    },

    // Get all supported tokens for a chain
    getChainTokens: (chainId) => {
        const chain = chains[chainId];
        if (!chain) return [];
        
        return chain.tokens.map(symbol => {
            const token = tokens[symbol.toLowerCase()];
            if (!token || !token.chains[chainId]) return null;
            
            // Return a combined object with token info and chain-specific data
            return {
                symbol: token.symbol,
                name: token.name,
                type: token.type,
                decimals: token.chains[chainId].decimals, // Use chain-specific decimals
                address: token.chains[chainId].address,
                // Keep the global decimals as a fallback
                globalDecimals: token.decimals
            };
        }).filter(token => token !== null);
    },

    // Validate chain and token combination
    validateChainAndToken: (chainId, symbol) => {
        const chain = chains[chainId];
        if (!chain) {
            throw new Error(`Chain ${chainId} is not supported`);
        }

        // Special handling for NullNet
        if (chainId === 'nullnet') {
            const token = tokens[symbol.toLowerCase()];
            if (!token) {
                throw new Error(`Token ${symbol} is not supported`);
            }

            if (!token.chains[chainId]) {
                throw new Error(`Token ${symbol} is not supported on NullNet`);
            }

            return {
                chain,
                token: token.chains[chainId]
            };
        }

        const token = tokens[symbol.toLowerCase()];
        if (!token) {
            throw new Error(`Token ${symbol} is not supported`);
        }

        if (!token.chains[chainId]) {
            throw new Error(`Token ${symbol} is not supported on chain ${chainId}`);
        }

        return {
            chain,
            token: token.chains[chainId]
        };
    }
};

module.exports = chainUtils;