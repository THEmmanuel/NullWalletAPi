const tokens = {
    eth: {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        type: 'native',
        chains: {
            ethereum: {
                address: null, // Native token
                decimals: 18
            },
            sepolia: {
                address: null, // Native token
                decimals: 18
            }
        }
    },
    matic: {
        symbol: 'MATIC',
        name: 'Polygon',
        decimals: 18,
        type: 'native',
        chains: {
            polygon: {
                address: null, // Native token
                decimals: 18
            },
            mumbai: {
                address: null, // Native token
                decimals: 18
            }
        }
    },
    bnb: {
        symbol: 'BNB',
        name: 'Binance Coin',
        decimals: 18,
        type: 'native',
        chains: {
            bsc: {
                address: null, // Native token
                decimals: 18
            },
            bscTestnet: {
                address: null, // Native token
                decimals: 18
            }
        }
    },
    flow: {
        symbol: 'FLOW',
        name: 'Flow',
        decimals: 18,
        type: 'native',
        chains: {
            flowTestnet: {
                address: null, // Native token
                decimals: 18
            }
        }
    },
    usdt: {
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        type: 'erc20',
        chains: {
            ethereum: {
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                decimals: 6
            },
            sepolia: {
                address: '0x6f14C02Fc1F78322cFd7d707aB90f18baD3B54f5',
                decimals: 6
            },
            polygon: {
                address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
                decimals: 6
            },
            mumbai: {
                address: '0xA02f6adc7926efeBBd59Fd43A84f4E0c0c91e832',
                decimals: 6
            },
            bsc: {
                address: '0x55d398326f99059fF775485246999027B3197955',
                decimals: 18
            },
            bscTestnet: {
                address: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
                decimals: 18
            },
            flowTestnet: {
                address: null, // USDT not yet deployed on Flow EVM Testnet
                decimals: 6
            }
        }
    },
    busd: {
        symbol: 'BUSD',
        name: 'Binance USD',
        decimals: 18,
        type: 'erc20',
        chains: {
            bsc: {
                address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
                decimals: 18
            },
            bscTestnet: {
                address: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
                decimals: 18
            }
        }
    },
    cake: {
        symbol: 'CAKE',
        name: 'PancakeSwap Token',
        decimals: 18,
        type: 'erc20',
        chains: {
            bsc: {
                address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
                decimals: 18
            }
        }
    },
    usdc: {
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        type: 'erc20',
        chains: {
            ethereum: {
                address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                decimals: 6
            },
            sepolia: {
                address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
                decimals: 6
            },
            polygon: {
                address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
                decimals: 6
            },
            mumbai: {
                address: '0xe6b8a5CF854791412c1f6EFC7CAf629f5Df1c747',
                decimals: 6
            },
            flowTestnet: {
                address: null, // USDC not yet deployed on Flow EVM Testnet
                decimals: 6
            }
        }
    },
    dai: {
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        type: 'erc20',
        chains: {
            ethereum: {
                address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
                decimals: 18
            },
            polygon: {
                address: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
                decimals: 18
            }
        }
    },
    // NullNet Assets
    gold: {
        symbol: 'GOLD',
        name: 'Gold Coin',
        decimals: 18,
        type: 'nullnet',
        chains: {
            nullnet: {
                address: null, // NullNet assets don't have contract addresses
                decimals: 18
            }
        }
    },
    silver: {
        symbol: 'SILVER',
        name: 'Silver Coin',
        decimals: 18,
        type: 'nullnet',
        chains: {
            nullnet: {
                address: null,
                decimals: 18
            }
        }
    },
    platinum: {
        symbol: 'PLATINUM',
        name: 'Platinum Coin',
        decimals: 18,
        type: 'nullnet',
        chains: {
            nullnet: {
                address: null,
                decimals: 18
            }
        }
    },
    diamond: {
        symbol: 'DIAMOND',
        name: 'Diamond Coin',
        decimals: 18,
        type: 'nullnet',
        chains: {
            nullnet: {
                address: null,
                decimals: 18
            }
        }
    }
};

module.exports = tokens;