# NullNet API Reference

## 🚀 Quick Start

NullNet is integrated into your existing wallet API. Use `chain: 'nullnet'` to access NullNet functionality.

## 📋 API Endpoints

### Health Checks
```bash
GET /api/nullnet/wallets/health
GET /api/nullnet/assets/health
```

### Wallet Management
```bash
POST /api/nullnet/wallets                    # Create wallet
GET /api/nullnet/wallets/:walletAddress      # Get wallet
GET /api/nullnet/wallets/:walletAddress/balance  # Get balance
GET /api/nullnet/wallets/all                 # List all wallets
```

### Asset Management
```bash
POST /api/nullnet/assets                     # Create asset
GET /api/nullnet/assets                      # List assets
GET /api/nullnet/assets/:ticker              # Get asset
PATCH /api/nullnet/assets/:ticker/price      # Update price
GET /api/nullnet/assets/all                  # List all assets
```

### Trading
```bash
POST /api/nullnet/assets/:walletAddress/buy  # Buy asset
POST /api/nullnet/assets/:walletAddress/sell # Sell asset
```

## 🔗 Integration with Main Wallet API

### Get Token Balance
```bash
GET /wallet/get-token-balance/:walletAddress/:contractAddress/:chain
```
**Example:**
```bash
GET /wallet/get-token-balance/null_1a2b3c4d5e6f7g8h9i0j/GOLD/nullnet
```

### Send Token
```bash
POST /wallet/send-token
```
**Body:**
```json
{
    "amount": 10,
    "receiverWalletAddress": "null_9i8h7g6f5e4d3c2b1a0j",
    "tokenToSend": "GOLD",
    "senderWalletAddress": "null_1a2b3c4d5e6f7g8h9i0j",
    "senderPrivateKey": "any-key",
    "chainId": "nullnet"
}
```

### Get Specific Balance
```bash
GET /wallet/balance/:chainId/:tokenSymbol/:walletAddress
```
**Example:**
```bash
GET /wallet/balance/nullnet/GOLD/null_1a2b3c4d5e6f7g8h9i0j
```

### Get All Balances
```bash
GET /wallet/balances/:chainId/:walletAddress
```
**Example:**
```bash
GET /wallet/balances/nullnet/null_1a2b3c4d5e6f7g8h9i0j
```

## 🏗️ Supported Assets

### Default Assets
- **GOLD** - Gold Coin
- **SILVER** - Silver Coin  
- **PLATINUM** - Platinum Coin
- **DIAMOND** - Diamond Coin

### Asset Types
- **free** - Manually set prices
- **pegged** - External price feeds (future)
- **derivative** - Formula-based pricing (future)

## 🔐 Wallet Address Format

NullNet wallet addresses follow this format:
- **Prefix**: `null_`
- **Body**: 20 alphanumeric characters
- **Example**: `null_1a2b3c4d5e6f7g8h9i0j`

## 📊 Response Formats

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    }
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error description"
}
```

## 🧪 Testing

Run the integration test:
```bash
node test-nullnet-integration.js
```

## 🔧 Configuration

### Environment Variables
- `MONGO_URI` - MongoDB connection string
- `PORT` - Server port (default: 3000)

### Chain Configuration
NullNet is configured in `config/chains.js`:
```javascript
nullnet: {
    id: 'nullnet',
    name: 'NullNet',
    chainId: 999999,
    tokens: ['gold', 'silver', 'platinum', 'diamond'],
    isEnabled: true
}
```

## 🚨 Error Codes

- `400` - Bad Request (invalid parameters)
- `404` - Not Found (wallet/asset doesn't exist)
- `500` - Internal Server Error

## 💡 Best Practices

1. **Always validate wallet addresses** before making requests
2. **Use the health check endpoints** to verify service status
3. **Handle errors gracefully** - check response status and error messages
4. **Test with small amounts** before large transactions
5. **Monitor balances** after transfers to ensure accuracy

## 🔄 Migration Guide

### From Other Chains
1. Create NullNet wallet: `POST /api/nullnet/wallets`
2. Transfer assets using existing API with `chainId: 'nullnet'`
3. Monitor balances using standard endpoints

### To Other Chains
1. Use `POST /wallet/send-token` with appropriate `chainId`
2. NullNet integrates seamlessly with existing multi-chain setup 