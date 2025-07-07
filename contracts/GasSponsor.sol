// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GasSponsor is ReentrancyGuard {

    struct SponsoredTransaction {
        address from;
        address to;
        uint256 gasLimit;
        bytes32 txHash;
        bool executed;
        uint256 totalCost;
        uint256 actualGasUsed;
        uint256 gasPrice;
        address sponsor;
    }

    mapping(bytes32 => SponsoredTransaction) public sponsoredTransactions;

    event TransactionExecuted(
        address indexed from,
        address indexed to,
        address indexed sponsor,
        uint256 actualGasUsed,
        uint256 gasPrice,
        uint256 totalCost,
        uint256 refundAmount
    );

    /**
     * @dev Allows the initiator to execute a pre-approved sponsored transaction.
     * @param _txHash Hash of the pre-approved sponsored transaction.
     * @param _data Encoded function call data.
     */
    function executeSponsoredTransaction(
        bytes32 _txHash,
        bytes calldata _data
    ) external nonReentrant {
        require(_txHash != bytes32(0), "Tx hash cannot be empty");

        SponsoredTransaction storage txn = sponsoredTransactions[_txHash];
        require(!txn.executed, "Sponsored transaction already executed.");
        require(txn.from == msg.sender, "Only initiator can execute.");

        uint256 gasStart = gasleft();

        (bool success, ) = txn.to.call{gas: txn.gasLimit}(_data);
        require(success, "Execution of sponsored transaction failed.");

        uint256 gasUsed = gasStart - gasleft();
        uint256 actualCost = gasUsed * txn.gasPrice;

        txn.executed = true;
        txn.actualGasUsed = gasUsed;
        txn.totalCost = actualCost;

        emit TransactionExecuted(
            txn.from,
            txn.to,
            txn.sponsor,
            txn.actualGasUsed,
            txn.gasPrice,
            txn.totalCost,
            0 // refundAmount not implemented yet
        );
    }

    // Optional: helper function to create a dummy sponsored transaction for testing
    function mockSponsorTransaction(
        address _from,
        address _to,
        uint256 _gasLimit,
        uint256 _gasPrice
    ) external returns (bytes32) {
        bytes32 txHash = keccak256(abi.encodePacked(_from, _to, block.timestamp, _gasLimit, _gasPrice));
        sponsoredTransactions[txHash] = SponsoredTransaction({
            from: _from,
            to: _to,
            gasLimit: _gasLimit,
            txHash: txHash,
            executed: false,
            totalCost: 0,
            actualGasUsed: 0,
            gasPrice: _gasPrice,
            sponsor: msg.sender
        });
        return txHash;
    }
}