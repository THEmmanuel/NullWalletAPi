const chains = {
    ethereum: {
        id: 'ethereum',
        name: 'Ethereum',
        network: 'mainnet',
        rpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.public.blastapi.io',
        chainId: 1,
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        blockExplorer: 'https://etherscan.io',
        tokens: ['eth', 'usdt', 'usdc', 'dai'],
        isEnabled: true
    },
    sepolia: {
        id: 'sepolia',
        name: 'Sepolia',
        network: 'testnet',
        rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
        chainId: 11155111,
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'ETH',
            decimals: 18
        },
        blockExplorer: 'https://sepolia.etherscan.io',
        tokens: ['eth', 'usdt', 'usdc'],
        isEnabled: true
    },
    polygon: {
        id: 'polygon',
        name: 'Polygon',
        network: 'mainnet',
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        chainId: 137,
        nativeCurrency: {
            name: 'Matic',
            symbol: 'MATIC',
            decimals: 18
        },
        blockExplorer: 'https://polygonscan.com',
        tokens: ['matic', 'usdt', 'usdc', 'dai'],
        isEnabled: true
    },
    mumbai: {
        id: 'mumbai',
        name: 'Mumbai',
        network: 'testnet',
        rpcUrl: process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai-bor-rpc.publicnode.com',
        chainId: 80001,
        nativeCurrency: {
            name: 'Mumbai Matic',
            symbol: 'MATIC',
            decimals: 18
        },
        blockExplorer: 'https://mumbai.polygonscan.com',
        tokens: ['matic', 'usdt', 'usdc'],
        isEnabled: true
    },
    bsc: {
        id: 'bsc',
        name: 'Binance Smart Chain',
        network: 'mainnet',
        rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
        chainId: 56,
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        blockExplorer: 'https://bscscan.com',
        tokens: ['bnb', 'busd', 'usdt', 'cake'],
        isEnabled: true
    },
    bscTestnet: {
        id: 'bscTestnet',
        name: 'BSC Testnet',
        network: 'testnet',
        rpcUrl: process.env.BSC_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        chainId: 97,
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        blockExplorer: 'https://testnet.bscscan.com',
        tokens: ['bnb', 'busd', 'usdt'],
        isEnabled: true
    },
    nullnet: {
        id: 'nullnet',
        name: 'NullNet',
        network: 'mainnet',
        rpcUrl: null, // NullNet doesn't use external RPC
        chainId: 999999,
        nativeCurrency: {
            name: 'NullNet Token',
            symbol: 'NULL',
            decimals: 18
        },
        blockExplorer: null, // NullNet doesn't have a block explorer yet
        tokens: ['gold', 'silver', 'platinum', 'diamond'], // Example NullNet assets
        isEnabled: true
    },
    flowTestnet: {
        id: 'flowTestnet',
        name: 'Flow EVM Testnet',
        network: 'testnet',
        rpcUrl: process.env.FLOW_TESTNET_RPC_URL || 'https://testnet.evm.nodes.onflow.org',
        chainId: 545,
        nativeCurrency: {
            name: 'Flow',
            symbol: 'FLOW',
            decimals: 18
        },
        blockExplorer: 'https://evm-testnet.flowscan.io',
        tokens: ['flow', 'usdt', 'usdc'],
        isEnabled: true
    }
};

module.exports = chains; 