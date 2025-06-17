# NullNet v1 Specification

NullNet v1 is a proprietary wallet and asset management layer built to simulate blockchain functionality within a controlled server environment. It supports custom assets, price setting, buying/selling, and integration with external partners via API.

---

## ✨ Overview

**Purpose:**\
To provide a blockchain-like asset layer where users can create, trade, and manage digital assets freely or based on external price sources — all while being powered by an internal wallet system.

**Key Features:**

- User wallet system
- Asset creation (free, pegged, derivative)
- Asset trading (buy/sell)
- API exposure for partners
- Off-chain but cryptographically inspired

---

## 🔐 Wallet System

Each user has:

- A unique wallet address (e.g., `null_1a2b3c4d5e6f7g8h9i0j`)
- A unique ID (e.g. UUID or hash)
- Balances for fiat and all owned assets
- Encrypted metadata for signature validation (optional)

### Wallet Address Format

Wallet addresses follow this format:
- Prefix: `null_` (indicating NullNet)
- Body: 20 characters (alphanumeric, case-sensitive)
- Total length: 24 characters

Example: `null_1a2b3c4d5e6f7g8h9i0j`

### Wallet Schema

```json
{
  "walletAddress": "null_1a2b3c4d5e6f7g8h9i0j",
  "userId": "UUID",
  "balances": {
    "GOLD": 150,
    "USDx": 200.0
  },
  "fiat": {
    "NGN": 100000
  },
  "createdAt": "ISODate",
  "lastActive": "ISODate"
}
```

### Wallet Address Generation

1. Generate a random 20-character string using:
   - Uppercase letters (A-Z)
   - Lowercase letters (a-z)
   - Numbers (0-9)
2. Prepend the `null_` prefix
3. Verify uniqueness in the database
4. If collision occurs, regenerate until unique

### Wallet Address Validation

A valid wallet address must:
- Start with `null_`
- Be exactly 24 characters long
- Contain only alphanumeric characters after the prefix
- Be case-sensitive
- Exist in the database

---

## 📦 Assets

### Types of Assets

| Type         | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| `free`       | Price is set manually by the creator or admin               |
| `pegged`     | Price is pulled from an external price feed/API             |
| `derivative` | Price is derived from a weighted formula using other assets |

### Asset Schema

```json
{
  "assetId": "ObjectId",
  "name": "Gold Coin",
  "ticker": "GOLD",
  "type": "free | pegged | derivative",
  "price": 100.0,
  "priceSource": {
    "apiUrl": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    "jsonPath": "bitcoin.usd",
    "multiplier": 1
  },
  "derivedFormula": {
    "baseAssets": [
      { "ticker": "BTC", "weight": 0.7 },
      { "ticker": "ETH", "weight": 0.3 }
    ]
  },
  "verified": true,
  "creatorId": "UserId",
  "createdAt": "ISODate"
}
```

---

## 🔁 Transactions

### Supported Actions

- `buy` – Purchase an asset using fiat
- `sell` – Sell an asset for fiat
- `transfer` – (optional v1.1) Send assets between users

### Transaction Schema

```json
{
  "transactionId": "ObjectId",
  "userId": "UUID",
  "type": "buy | sell | transfer",
  "asset": "GOLD",
  "amount": 5,
  "priceAtTime": 100.0,
  "timestamp": "ISODate"
}
```

---

## 🔹 API Endpoints

### Assets

- `POST /api/assets` — Create a new asset
- `GET /api/assets` — List all assets
- `GET /api/assets/:ticker` — Get asset by ticker
- `PATCH /api/assets/:id/price` — Update price (free assets only)

### Trading

- `POST /api/assets/:ticker/buy` — Buy asset
- `POST /api/assets/:ticker/sell` — Sell asset

### Wallets

- `GET /api/wallet/:userId` — Get wallet balance
- `GET /api/transactions/:userId` — Get transaction history

---

## 📊 Price Update Logic

### Free Assets

- Manually updated via API by owner or admin

### Pegged Assets

- Scheduled cron job or webhook fetches from `priceSource.apiUrl`
- Extract value using `priceSource.jsonPath`
- Apply `multiplier` if needed

### Derivative Assets

- Compute using formula:

```js
price = (BTC_price * 0.7) + (ETH_price * 0.3)
```

- Requires real-time access to base asset prices

---

## 🚧 Anti-Abuse & Verification

- Assets can be marked as `verified` by admins
- Rate limit on price updates for free assets
- Optional: Require stake or fee for asset creation

---

## 🌐 Partner API Access

Expose selected endpoints with API key verification for trusted apps:

- `GET /api/assets`
- `GET /api/assets/:ticker/price`
- `POST /api/transactions`

---

## 🎯 Future Considerations

- WebSockets or Redis pub/sub for real-time price feeds
- NFT-like asset types (non-fungible)
- Role-based admin controls (asset moderators, creators)
- Kinetic Key integration for signatures

---

**Version:** 1.0.0\
**Status:** Draft