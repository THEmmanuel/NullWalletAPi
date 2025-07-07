const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying GasSponsor contract...");

  // Get the contract factory
  const GasSponsor = await ethers.getContractFactory("GasSponsor");
  
  // Deploy the contract
  const gasSponsor = await GasSponsor.deploy();
  
  // Wait for deployment to complete
  await gasSponsor.deployed();

  console.log("GasSponsor deployed to:", gasSponsor.address);
  console.log("Deployment transaction hash:", gasSponsor.deployTransaction.hash);

  // Verify deployment
  console.log("\nVerifying deployment...");
  console.log("Contract owner:", await gasSponsor.owner());
  console.log("Min sponsor balance:", ethers.utils.formatEther(await gasSponsor.minSponsorBalance()), "ETH");
  console.log("Max gas price:", ethers.utils.formatUnits(await gasSponsor.maxGasPrice(), "gwei"), "gwei");
  console.log("Max gas limit:", (await gasSponsor.maxGasLimit()).toString());

  return gasSponsor;
}

// Execute deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main }; 