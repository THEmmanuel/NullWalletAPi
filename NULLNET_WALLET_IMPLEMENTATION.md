# NullNet Wallet Implementation Guide

## Overview
This guide explains how NullNet wallets are integrated into the user account system and how to use the wallet API endpoints.

## User Account Structure with NullNet

When a new user account is created, they automatically receive:
1. An Ethereum wallet (works across all EVM chains)
2. A NullNet wallet (specific to the NullNet chain)

### NullNet Wallet Format
- Prefix: `null_`
- Format: `null_[20 random alphanumeric characters]`
- Example: `null_AbCdEfGhIjKlMnOpQrSt`

### User Data Structure
```javascript
{
  userWallets: [
    {
      walletName: "Ethereum Wallet",
      walletAddress: "0x...", // Standard Ethereum address
      walletKey: "0x...",     // Private key
      walletPhrase: "..."     // Mnemonic phrase
    },
    {
      walletName: "NullNet Wallet",
      walletAddress: "null_...", // NullNet address
      walletKey: null,          // NullNet doesn't use private keys
      walletPhrase: null        // NullNet doesn't use mnemonic phrases
    }
  ]
}
```

## API Endpoints

### 1. Get Token Balance
**Endpoint:** `/wallet/get-token-balance/:walletAddress/:contractAddress/:chain`

**Example Usage:**
```javascript
// For Ethereum chain (ETH)
GET /wallet/get-token-balance/0xc1C9EFd0bE953347a3c4C28422b85fa69246D139/ETH/ethereum

// For NullNet chain (GOLD token)
GET /wallet/get-token-balance/null_AbCdEfGhIjKlMnOpQrSt/GOLD/nullnet

// For ERC20 token (USDT on Ethereum)
GET /wallet/get-token-balance/0xc1C9EFd0bE953347a3c4C28422b85fa69246D139/0xdAC17F958D2ee523a2206206994597C13D831ec7/ethereum
```

### 2. Get All Token Balances
**Endpoint:** `/wallet/balances/:chainId/:walletAddress`

**Example Usage:**
```javascript
// Get all balances on Ethereum
GET /wallet/balances/ethereum/0xc1C9EFd0bE953347a3c4C28422b85fa69246D139

// Get all balances on NullNet
GET /wallet/balances/nullnet/null_AbCdEfGhIjKlMnOpQrSt
```

### 3. Send Tokens
**Endpoint:** `POST /wallet/send-token`

**Request Body:**
```json
{
  "amount": "1.5",
  "receiverWalletAddress": "null_ReceiverAddressHere",
  "tokenToSend": "GOLD",
  "senderWalletAddress": "null_SenderAddressHere",
  "senderPrivateKey": null,  // null for NullNet
  "chainId": "nullnet"
}
```

## Frontend Integration

The file `null-wallet-ts/src/services/wallet-api-example.ts` contains ready-to-use functions:

- `getTokenBalance(userData, tokenSymbol, chainId)` - Get balance for a specific token
- `getAllTokenBalances(userData, chainId)` - Get all token balances on a chain
- `sendToken(userData, amount, receiverAddress, tokenSymbol, chainId)` - Send tokens

### Usage Example:
```typescript
// Get GOLD balance on NullNet
const goldBalance = await getTokenBalance(userData, 'GOLD', 'nullnet');

// Get ETH balance on Ethereum
const ethBalance = await getTokenBalance(userData, 'ETH', 'ethereum');

// Send GOLD tokens on NullNet
const result = await sendToken(
  userData,
  '10',
  'null_ReceiverAddressHere',
  'GOLD',
  'nullnet'
);
```

## Custom NullNet Address

If you want to use a specific NullNet address instead of generating a random one, modify the `createNullNetWallet` function in `auth.js`:

```javascript
const createNullNetWallet = async () => {
    const walletAddress = 'null_3he83rds393erfr3'; // Fixed address
    // const walletAddress = await generateWalletAddress(); // Or generate unique
    
    return {
        walletName: "NullNet Wallet",
        walletAddress: walletAddress,
        walletKey: null,
        walletPhrase: null
    };
};
```

## NullNet Tokens

The following tokens are supported on NullNet:
- GOLD - Gold Coin
- SILVER - Silver Coin
- PLATINUM - Platinum Coin
- DIAMOND - Diamond Coin

All NullNet tokens have 18 decimals and don't require contract addresses. 