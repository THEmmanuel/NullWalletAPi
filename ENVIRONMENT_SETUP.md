# Environment Setup for Null Wallet Backend

## Required Environment Variables

Create a `.env` file in the `null-wallet-backend` directory with the following variables:

```bash
# MongoDB connection string
MONGO_URI=mongodb://localhost:27017/null-wallet

# Port for the backend server
PORT=4444

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# JWT Secrets (REQUIRED for authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-change-this-in-production

# Etherscan API key (required for Ethereum/Sepolia transactions)
ETHERSCAN_KEY=your_etherscan_api_key

# Polygonscan API key (required for Polygon transactions)
POLYGONSCAN_KEY=your_polygonscan_api_key

# BscScan API key (required for BSC transactions)
BSCSCAN_KEY=your_bscscan_api_key

# Flowscan API key (optional for Flow EVM transactions)
FLOWSCAN_API_KEY=your_flowscan_api_key

# Alchemy API key (required for Flow testnet transactions)
ALCHEMY_KEY=your_alchemy_api_key

# CoinGecko API key (for better rate limits)
COINGECKO_API_KEY=your_coingecko_api_key

# Custom RPC URLs (if you have your own nodes or premium endpoints)
ETH_RPC_URL=https://your-ethereum-rpc-url
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
POLYGON_RPC_URL=https://your-polygon-rpc-url
MUMBAI_RPC_URL=https://your-mumbai-rpc-url
BSC_RPC_URL=https://your-bsc-rpc-url
BSC_TESTNET_RPC_URL=https://your-bsc-testnet-rpc-url
FLOW_TESTNET_RPC_URL=https://testnet.evm.nodes.onflow.org
```

## Optional Environment Variables

These variables can improve performance and reliability:

```bash
# Custom RPC URLs (if you have your own nodes or premium endpoints)
ETH_RPC_URL=https://your-ethereum-rpc-url
SEPOLIA_RPC_URL=https://your-sepolia-rpc-url
POLYGON_RPC_URL=https://your-polygon-rpc-url
MUMBAI_RPC_URL=https://your-mumbai-rpc-url
BSC_RPC_URL=https://your-bsc-rpc-url
BSC_TESTNET_RPC_URL=https://your-bsc-testnet-rpc-url
FLOW_TESTNET_RPC_URL=https://testnet.evm.nodes.onflow.org

# CoinGecko API key (for better rate limits)
COINGECKO_API_KEY=your_coingecko_api_key

# Block Explorer API Keys (for transaction history)
POLYGONSCAN_KEY=your_polygonscan_api_key
BSCSCAN_KEY=your_bscscan_api_key
FLOWSCAN_API_KEY=your_flowscan_api_key
```

## Getting API Keys

### JWT Secrets (REQUIRED for Authentication)
**CRITICAL**: You must set these environment variables for authentication to work:
- `JWT_SECRET`: A secure random string for signing access tokens
- `JWT_REFRESH_SECRET`: A secure random string for signing refresh tokens

**Generate secure secrets:**
```bash
# Generate a secure JWT secret (run this in terminal)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Example:**
```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
JWT_REFRESH_SECRET=b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3
```

1. **Etherscan API Key** (Required for Ethereum transactions): 
   - Sign up at https://etherscan.io/apis
   - Free tier allows 5 calls/second
   - Works for both mainnet and Sepolia testnet

2. **Polygonscan API Key** (For Polygon transactions):
   - Sign up at https://polygonscan.com/apis
   - Free tier available
   - Works for both mainnet and Mumbai testnet

3. **BscScan API Key** (For BSC transactions):
   - Sign up at https://bscscan.com/apis
   - Free tier available
   - Works for both mainnet and testnet

4. **Flowscan API Key** (For Flow EVM transactions):
   - Sign up at https://evm-testnet.flowscan.io/apis
   - Free tier available
   - Works for Flow EVM testnet

5. **Alchemy API Key** (for Flow testnet transactions):
   - Sign up at https://www.alchemy.com/
   - Create a Flow testnet app
   - Required for sending transactions on Flow testnet

6. **CoinGecko API Key**:
   - Sign up at https://www.coingecko.com/en/api
   - Free tier allows 50 calls/minute

7. **RPC URLs**:
   - Alchemy: https://www.alchemy.com/
   - Infura: https://infura.io/
   - QuickNode: https://www.quicknode.com/

## Default Public RPCs

If you don't set custom RPC URLs, the application will use these public endpoints:

- Ethereum: `https://eth-mainnet.public.blastapi.io`
- Sepolia: `https://ethereum-sepolia-rpc.publicnode.com`
- Polygon: `https://polygon-rpc.com`
- Mumbai: `https://polygon-mumbai-bor-rpc.publicnode.com`
- BSC: `https://bsc-dataseed.binance.org/`
- BSC Testnet: `https://data-seed-prebsc-1-s1.binance.org:8545/`
- Flow EVM Testnet: `https://testnet.evm.nodes.onflow.org`

Note: Public RPCs may have rate limits and occasional downtime. For production use, it's recommended to use your own RPC endpoints.

## Transaction History

To display transaction history, you need at least one block explorer API key:
- **Ethereum/Sepolia**: Requires `ETHERSCAN_KEY`
- **Polygon/Mumbai**: Requires `POLYGONSCAN_KEY`
- **BSC/BSC Testnet**: Requires `BSCSCAN_KEY`
- **Flow EVM Testnet**: Requires `FLOWSCAN_API_KEY`

Without these API keys, the wallet will show empty transaction history. 