const { ethers } = require('ethers');
const GasSponsorABI = require('../contracts/test/GasSponsorABI.json');

class GasSponsorService {
    constructor(chainId, provider, sponsorPrivateKey) {
        this.chainId = chainId;
        this.provider = provider;
        this.sponsorWallet = new ethers.Wallet(sponsorPrivateKey, provider);
        
        // GasSponsor contract addresses for different networks
        this.contractAddresses = {
            flowTestnet: process.env.FLOW_GAS_SPONSOR_ADDRESS || '0xD85E0Bfd995278F9369d0e7a1385d4114B95a916', // Replace with actual deployed address
            sepolia: process.env.SEPOLIA_GAS_SPONSOR_ADDRESS || '0x0000000000000000000000000000000000000000',
            mumbai: process.env.MUMBAI_GAS_SPONSOR_ADDRESS || '0x0000000000000000000000000000000000000000'
        };
        
        this.contractAddress = this.contractAddresses[chainId];
        if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
            throw new Error(`GasSponsor contract not deployed on ${chainId}`);
        }
        
        this.contract = new ethers.Contract(this.contractAddress, GasSponsorABI, this.sponsorWallet);
        console.log(`[GasSponsorService] Initialized for ${chainId} at ${this.contractAddress}`);
    }

    /**
     * Sponsor a transaction by creating a sponsored transaction record
     * @param {string} from - Sender address
     * @param {string} to - Recipient address
     * @param {number} gasLimit - Gas limit for the transaction
     * @param {number} gasPrice - Gas price for the transaction
     * @returns {Object} Transaction hash and sponsored transaction details
     */
    async sponsorTransaction(from, to, gasLimit, gasPrice) {
        try {
            console.log(`[GasSponsorService] Sponsoring transaction from ${from} to ${to}`);
            console.log(`[GasSponsorService] Gas limit: ${gasLimit}, Gas price: ${gasPrice}`);
            
            // Create sponsored transaction using the mock function (for testing)
            const tx = await this.contract.mockSponsorTransaction(
                from,
                to,
                gasLimit,
                gasPrice
            );
            
            const receipt = await tx.wait();
            console.log(`[GasSponsorService] Transaction sponsored. Hash: ${receipt.hash}`);
            
            // Get the transaction hash from the event
            const event = receipt.logs[0]; // Assuming the first log is our event
            const txHash = event.topics[1]; // The transaction hash from the event
            
            return {
                success: true,
                sponsoredTxHash: txHash,
                sponsorTxHash: receipt.hash,
                from,
                to,
                gasLimit,
                gasPrice
            };
            
        } catch (error) {
            console.error('[GasSponsorService] Error sponsoring transaction:', error);
            throw new Error(`Failed to sponsor transaction: ${error.message}`);
        }
    }

    /**
     * Execute a sponsored transaction
     * @param {string} txHash - The sponsored transaction hash
     * @param {string} data - Encoded transaction data
     * @returns {Object} Execution result
     */
    async executeSponsoredTransaction(txHash, data) {
        try {
            console.log(`[GasSponsorService] Executing sponsored transaction: ${txHash}`);
            console.log(`[GasSponsorService] Transaction data: ${data}`);
            
            const tx = await this.contract.executeSponsoredTransaction(txHash, data);
            const receipt = await tx.wait();
            
            console.log(`[GasSponsorService] Sponsored transaction executed. Hash: ${receipt.hash}`);
            
            return {
                success: true,
                executionTxHash: receipt.hash,
                sponsoredTxHash: txHash,
                gasUsed: receipt.gasUsed,
                effectiveGasPrice: receipt.effectiveGasPrice
            };
            
        } catch (error) {
            console.error('[GasSponsorService] Error executing sponsored transaction:', error);
            throw new Error(`Failed to execute sponsored transaction: ${error.message}`);
        }
    }

    /**
     * Get sponsored transaction details
     * @param {string} txHash - The sponsored transaction hash
     * @returns {Object} Sponsored transaction details
     */
    async getSponsoredTransaction(txHash) {
        try {
            const transaction = await this.contract.sponsoredTransactions(txHash);
            
            return {
                from: transaction.from,
                to: transaction.to,
                gasLimit: transaction.gasLimit.toString(),
                txHash: transaction.txHash,
                executed: transaction.executed,
                totalCost: transaction.totalCost.toString(),
                actualGasUsed: transaction.actualGasUsed.toString(),
                gasPrice: transaction.gasPrice.toString(),
                sponsor: transaction.sponsor
            };
            
        } catch (error) {
            console.error('[GasSponsorService] Error getting sponsored transaction:', error);
            throw new Error(`Failed to get sponsored transaction: ${error.message}`);
        }
    }

    /**
     * Check if gas sponsorship is available for the given chain
     * @param {string} chainId - Chain identifier
     * @returns {boolean} Whether gas sponsorship is available
     */
    static isAvailable(chainId) {
        const availableChains = ['flowTestnet', 'sepolia', 'mumbai'];
        return availableChains.includes(chainId);
    }

    /**
     * Get estimated gas cost for a transaction
     * @param {number} gasLimit - Gas limit
     * @param {number} gasPrice - Gas price
     * @returns {string} Estimated cost in ETH
     */
    getEstimatedCost(gasLimit, gasPrice) {
        const cost = BigInt(gasLimit) * BigInt(gasPrice);
        return ethers.formatEther(cost);
    }
}

module.exports = GasSponsorService; 