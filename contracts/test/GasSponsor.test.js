const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GasSponsor", function () {
  let GasSponsor;
  let gasSponsor;
  let owner;
  let sponsor1;
  let sponsor2;
  let user1;
  let user2;
  let recipient;

  const INITIAL_SPONSOR_BALANCE = ethers.utils.parseEther("1");
  const MIN_SPONSOR_BALANCE = ethers.utils.parseEther("0.01");
  const MAX_GAS_PRICE = ethers.utils.parseUnits("100", "gwei");
  const MAX_GAS_LIMIT = 500000;

  beforeEach(async function () {
    [owner, sponsor1, sponsor2, user1, user2, recipient] = await ethers.getSigners();

    GasSponsor = await ethers.getContractFactory("GasSponsor");
    gasSponsor = await GasSponsor.deploy();
    await gasSponsor.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await gasSponsor.owner()).to.equal(owner.address);
    });

    it("Should set correct initial parameters", async function () {
      expect(await gasSponsor.minSponsorBalance()).to.equal(MIN_SPONSOR_BALANCE);
      expect(await gasSponsor.maxGasPrice()).to.equal(MAX_GAS_PRICE);
      expect(await gasSponsor.maxGasLimit()).to.equal(MAX_GAS_LIMIT);
    });
  });

  describe("Sponsor Management", function () {
    it("Should add a sponsor with initial balance", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });

      const sponsorInfo = await gasSponsor.getSponsorInfo(sponsor1.address);
      expect(sponsorInfo.balance).to.equal(INITIAL_SPONSOR_BALANCE);
      expect(sponsorInfo.isActive).to.be.true;
      expect(sponsorInfo.totalSponsored).to.equal(0);
    });

    it("Should fail to add sponsor with insufficient balance", async function () {
      const insufficientBalance = ethers.utils.parseEther("0.005");
      
      await expect(
        gasSponsor.addSponsor(sponsor1.address, { value: insufficientBalance })
      ).to.be.revertedWith("GasSponsor: Insufficient initial balance");
    });

    it("Should fail to add duplicate sponsor", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      await expect(
        gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE })
      ).to.be.revertedWith("GasSponsor: Sponsor already exists");
    });

    it("Should allow sponsor to add more funds", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      const additionalFunds = ethers.utils.parseEther("0.5");
      await gasSponsor.connect(sponsor1).addFunds({ value: additionalFunds });

      const sponsorInfo = await gasSponsor.getSponsorInfo(sponsor1.address);
      expect(sponsorInfo.balance).to.equal(INITIAL_SPONSOR_BALANCE.add(additionalFunds));
    });

    it("Should allow sponsor to withdraw funds", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      const withdrawAmount = ethers.utils.parseEther("0.3");
      const initialBalance = await sponsor1.getBalance();
      
      await gasSponsor.connect(sponsor1).withdrawFunds(withdrawAmount);

      const sponsorInfo = await gasSponsor.getSponsorInfo(sponsor1.address);
      expect(sponsorInfo.balance).to.equal(INITIAL_SPONSOR_BALANCE.sub(withdrawAmount));
      
      const finalBalance = await sponsor1.getBalance();
      expect(finalBalance.gt(initialBalance.sub(withdrawAmount))).to.be.true; // Account for gas costs
    });

    it("Should remove sponsor and refund balance", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      const initialBalance = await sponsor1.getBalance();
      await gasSponsor.removeSponsor(sponsor1.address);

      const sponsorInfo = await gasSponsor.getSponsorInfo(sponsor1.address);
      expect(sponsorInfo.isActive).to.be.false;
      expect(sponsorInfo.balance).to.equal(0);
      
      const finalBalance = await sponsor1.getBalance();
      expect(finalBalance.gt(initialBalance)).to.be.true; // Account for gas costs
    });
  });

  describe("Transaction Sponsorship", function () {
    beforeEach(async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
    });

    it("Should sponsor a transaction", async function () {
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      const gasLimit = 21000;
      const estimatedCost = gasPrice.mul(gasLimit);
      const txData = "0x";

      const tx = await gasSponsor.connect(sponsor1).sponsorTransaction(
        user1.address,
        recipient.address,
        txData,
        gasPrice,
        gasLimit
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionSponsored");
      
      expect(event.args.from).to.equal(user1.address);
      expect(event.args.to).to.equal(recipient.address);
      expect(event.args.sponsor).to.equal(sponsor1.address);
      expect(event.args.gasUsed).to.equal(gasLimit);
      expect(event.args.gasPrice).to.equal(gasPrice);
      expect(event.args.totalCost).to.equal(estimatedCost);

      const sponsorInfo = await gasSponsor.getSponsorInfo(sponsor1.address);
      expect(sponsorInfo.balance).to.equal(INITIAL_SPONSOR_BALANCE.sub(estimatedCost));
      expect(sponsorInfo.totalSponsored).to.equal(estimatedCost);
    });

    it("Should fail to sponsor transaction with insufficient balance", async function () {
      const gasPrice = ethers.utils.parseUnits("100", "gwei");
      const gasLimit = 1000000; // Very high gas limit
      const txData = "0x";

      await expect(
        gasSponsor.connect(sponsor1).sponsorTransaction(
          user1.address,
          recipient.address,
          txData,
          gasPrice,
          gasLimit
        )
      ).to.be.revertedWith("GasSponsor: Insufficient sponsor balance");
    });

    it("Should fail to sponsor self-transaction", async function () {
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      const gasLimit = 21000;
      const txData = "0x";

      await expect(
        gasSponsor.connect(sponsor1).sponsorTransaction(
          sponsor1.address,
          sponsor1.address,
          txData,
          gasPrice,
          gasLimit
        )
      ).to.be.revertedWith("GasSponsor: Cannot sponsor self-transaction");
    });

    it("Should fail with invalid gas parameters", async function () {
      const highGasPrice = ethers.utils.parseUnits("200", "gwei"); // Above max
      const highGasLimit = 1000000; // Above max
      const txData = "0x";

      await expect(
        gasSponsor.connect(sponsor1).sponsorTransaction(
          user1.address,
          recipient.address,
          txData,
          highGasPrice,
          21000
        )
      ).to.be.revertedWith("GasSponsor: Gas price too high");

      await expect(
        gasSponsor.connect(sponsor1).sponsorTransaction(
          user1.address,
          recipient.address,
          txData,
          ethers.utils.parseUnits("20", "gwei"),
          highGasLimit
        )
      ).to.be.revertedWith("GasSponsor: Gas limit too high");
    });
  });

  describe("Transaction Execution", function () {
    let txHash;
    let gasPrice;
    let gasLimit;

    beforeEach(async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      gasPrice = ethers.utils.parseUnits("20", "gwei");
      gasLimit = 21000;
      const txData = "0x";

      const tx = await gasSponsor.connect(sponsor1).sponsorTransaction(
        user1.address,
        recipient.address,
        txData,
        gasPrice,
        gasLimit
      );

      const receipt = await tx.wait();
      const event = receipt.events.find(e => e.event === "TransactionSponsored");
      txHash = event.args[0]; // First indexed parameter
    });

    it("Should execute sponsored transaction", async function () {
      const txData = "0x";
      const initialRecipientBalance = await recipient.getBalance();

      await gasSponsor.connect(user1).executeSponsoredTransaction(txHash, txData);

      const transaction = await gasSponsor.getSponsoredTransaction(txHash);
      expect(transaction.executed).to.be.true;
      expect(transaction.gasUsed).to.be.gt(0);
      expect(transaction.totalCost).to.be.gt(0);
    });

    it("Should fail to execute already executed transaction", async function () {
      const txData = "0x";

      await gasSponsor.connect(user1).executeSponsoredTransaction(txHash, txData);

      await expect(
        gasSponsor.connect(user1).executeSponsoredTransaction(txHash, txData)
      ).to.be.revertedWith("GasSponsor: Transaction already executed");
    });

    it("Should fail to execute transaction by non-initiator", async function () {
      const txData = "0x";

      await expect(
        gasSponsor.connect(user2).executeSponsoredTransaction(txHash, txData)
      ).to.be.revertedWith("GasSponsor: Only transaction initiator can execute");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
    });

    it("Should return correct sponsor info", async function () {
      const sponsorInfo = await gasSponsor.getSponsorInfo(sponsor1.address);
      
      expect(sponsorInfo.balance).to.equal(INITIAL_SPONSOR_BALANCE);
      expect(sponsorInfo.isActive).to.be.true;
      expect(sponsorInfo.totalSponsored).to.equal(0);
      expect(sponsorInfo.lastSponsored).to.equal(0);
    });

    it("Should return correct contract stats", async function () {
      const stats = await gasSponsor.getContractStats();
      
      expect(stats.totalSponsored).to.equal(0);
      expect(stats.totalTx).to.equal(0);
      expect(stats.contractBalance).to.equal(INITIAL_SPONSOR_BALANCE);
    });

    it("Should return user transactions", async function () {
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      const gasLimit = 21000;
      const txData = "0x";

      await gasSponsor.connect(sponsor1).sponsorTransaction(
        user1.address,
        recipient.address,
        txData,
        gasPrice,
        gasLimit
      );

      const userTxs = await gasSponsor.getUserTransactions(user1.address);
      expect(userTxs.length).to.equal(1);
    });
  });

  describe("Access Control", function () {
    it("Should fail to add sponsor by non-owner", async function () {
      await expect(
        gasSponsor.connect(user1).addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE })
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail to remove sponsor by non-owner", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      await expect(
        gasSponsor.connect(user1).removeSponsor(sponsor1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should fail to sponsor transaction by non-sponsor", async function () {
      const gasPrice = ethers.utils.parseUnits("20", "gwei");
      const gasLimit = 21000;
      const txData = "0x";

      await expect(
        gasSponsor.connect(user1).sponsorTransaction(
          user2.address,
          recipient.address,
          txData,
          gasPrice,
          gasLimit
        )
      ).to.be.revertedWith("GasSponsor: Not an active sponsor");
    });
  });

  describe("Parameter Updates", function () {
    it("Should allow owner to update parameters", async function () {
      const newMinBalance = ethers.utils.parseEther("0.05");
      const newMaxGasPrice = ethers.utils.parseUnits("50", "gwei");
      const newMaxGasLimit = 300000;

      await gasSponsor.updateParameters(newMinBalance, newMaxGasPrice, newMaxGasLimit);

      expect(await gasSponsor.minSponsorBalance()).to.equal(newMinBalance);
      expect(await gasSponsor.maxGasPrice()).to.equal(newMaxGasPrice);
      expect(await gasSponsor.maxGasLimit()).to.equal(newMaxGasLimit);
    });

    it("Should fail to update parameters by non-owner", async function () {
      const newMinBalance = ethers.utils.parseEther("0.05");
      const newMaxGasPrice = ethers.utils.parseUnits("50", "gwei");
      const newMaxGasLimit = 300000;

      await expect(
        gasSponsor.connect(user1).updateParameters(newMinBalance, newMaxGasPrice, newMaxGasLimit)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw", async function () {
      await gasSponsor.addSponsor(sponsor1.address, { value: INITIAL_SPONSOR_BALANCE });
      
      const withdrawAmount = ethers.utils.parseEther("0.5");
      const initialBalance = await owner.getBalance();
      
      await gasSponsor.emergencyWithdraw(withdrawAmount);

      const finalBalance = await owner.getBalance();
      expect(finalBalance.gt(initialBalance.sub(withdrawAmount))).to.be.true; // Account for gas costs
    });

    it("Should fail emergency withdraw by non-owner", async function () {
      await expect(
        gasSponsor.connect(user1).emergencyWithdraw(ethers.utils.parseEther("0.1"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
}); 