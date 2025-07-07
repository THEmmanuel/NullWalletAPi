# GasSponsor Smart Contract

A Solidity smart contract that enables gas fee sponsorship for transactions between two parties. This contract allows sponsors to pay for gas fees, making blockchain transactions more accessible to users who may not have sufficient ETH for gas costs.

## Features

- **Gas Fee Sponsorship**: Sponsors can pay for gas fees of transactions between two parties
- **Sponsor Management**: Add, remove, and manage sponsor wallets with balances
- **Transaction Tracking**: Complete tracking of sponsored transactions with detailed analytics
- **Security Features**: Reentrancy protection, access controls, and parameter validation
- **Refund Mechanism**: Automatic refund of unused gas to sponsors
- **Flexible Parameters**: Configurable gas limits, prices, and minimum balances

## Contract Architecture

### Core Components

1. **Sponsor Management**
   - Sponsor registration with initial balance
   - Balance tracking and fund management
   - Sponsor removal with balance refund

2. **Transaction Sponsorship**
   - Gas fee estimation and reservation
   - Transaction execution with sponsor funds
   - Automatic refund of unused gas

3. **Security & Access Control**
   - Owner-only functions for contract management
   - Sponsor-only functions for gas sponsorship
   - Reentrancy protection for all state-changing operations

### Key Functions

#### Sponsor Management
- `addSponsor(address _sponsor)` - Add new sponsor with initial balance
- `removeSponsor(address _sponsor)` - Remove sponsor and refund balance
- `addFunds()` - Allow sponsors to add more funds
- `withdrawFunds(uint256 _amount)` - Allow sponsors to withdraw funds

#### Transaction Sponsorship
- `sponsorTransaction(address _from, address _to, bytes calldata _data, uint256 _gasPrice, uint256 _gasLimit)` - Sponsor a transaction
- `executeSponsoredTransaction(bytes32 _txHash, bytes calldata _data)` - Execute sponsored transaction

#### Query Functions
- `getSponsorInfo(address _sponsor)` - Get sponsor details
- `getSponsoredTransaction(bytes32 _txHash)` - Get transaction details
- `getUserTransactions(address _user)` - Get user's sponsored transactions
- `getContractStats()` - Get contract statistics

## Usage Examples

### 1. Adding a Sponsor

```javascript
// Contract owner adds a sponsor with 1 ETH initial balance
await gasSponsor.addSponsor(sponsorAddress, { value: ethers.utils.parseEther("1") });
```

### 2. Sponsoring a Transaction

```javascript
// Sponsor creates a sponsored transaction
const txData = "0x..."; // Transaction data
const gasPrice = ethers.utils.parseUnits("20", "gwei");
const gasLimit = 21000;

await gasSponsor.sponsorTransaction(
    userAddress,
    recipientAddress,
    txData,
    gasPrice,
    gasLimit
);
```

### 3. Executing Sponsored Transaction

```javascript
// User executes the sponsored transaction
const txHash = "0x..."; // Transaction hash from sponsorship
const txData = "0x..."; // Actual transaction data

await gasSponsor.executeSponsoredTransaction(txHash, txData);
```

### 4. Adding Funds to Sponsor Balance

```javascript
// Sponsor adds more funds to their balance
await gasSponsor.addFunds({ value: ethers.utils.parseEther("0.5") });
```

## Contract Parameters

| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `minSponsorBalance` | 0.01 ETH | Minimum balance required for sponsors |
| `maxGasPrice` | 100 gwei | Maximum allowed gas price |
| `maxGasLimit` | 500,000 | Maximum allowed gas limit |

## Events

- `SponsorAdded(address indexed sponsor, uint256 amount)` - Emitted when a sponsor is added
- `SponsorRemoved(address indexed sponsor, uint256 refundAmount)` - Emitted when a sponsor is removed
- `TransactionSponsored(address indexed from, address indexed to, address indexed sponsor, uint256 gasUsed, uint256 gasPrice, uint256 totalCost)` - Emitted when a transaction is sponsored
- `EmergencyWithdraw(address indexed owner, uint256 amount)` - Emitted during emergency withdrawal

## Security Considerations

1. **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
2. **Access Control**: Owner-only functions for contract management
3. **Parameter Validation**: Gas price and limit validation to prevent abuse
4. **Balance Checks**: Comprehensive balance validation before operations
5. **Safe Transfers**: Use of OpenZeppelin's `Address` library for safe ETH transfers

## Integration with NullWallet Backend

To integrate this contract with the NullWallet backend:

1. **Deploy the contract** using the provided deployment script
2. **Add contract interaction methods** to the backend services
3. **Create API endpoints** for sponsor management and transaction sponsorship
4. **Implement gas estimation** logic for accurate cost calculation
5. **Add transaction monitoring** for sponsored transaction status

### Example Backend Integration

```javascript
// In your backend service
class GasSponsorService {
    constructor(contractAddress, provider) {
        this.contract = new ethers.Contract(contractAddress, GasSponsorABI, provider);
    }

    async sponsorTransaction(from, to, data, gasPrice, gasLimit, sponsorPrivateKey) {
        const wallet = new ethers.Wallet(sponsorPrivateKey, this.contract.provider);
        const contractWithSigner = this.contract.connect(wallet);
        
        return await contractWithSigner.sponsorTransaction(
            from, to, data, gasPrice, gasLimit
        );
    }

    async getSponsorInfo(sponsorAddress) {
        return await this.contract.getSponsorInfo(sponsorAddress);
    }
}
```

## Testing

The contract includes comprehensive test coverage for:
- Sponsor management functions
- Transaction sponsorship and execution
- Error handling and edge cases
- Gas optimization and refund mechanisms

Run tests using:
```bash
npx hardhat test
```

## Deployment

Deploy the contract using:
```bash
npx hardhat run contracts/deploy/GasSponsor.deploy.js --network <network-name>
```

## License

MIT License - see the contract header for details. 