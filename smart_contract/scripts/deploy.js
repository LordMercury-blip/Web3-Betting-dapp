const hre = require("hardhat");

async function main() {
  console.log("Deploying PriceBettingContract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  // Deploy the contract
  const PriceBettingContract = await hre.ethers.getContractFactory("PriceBettingContract");
  const contract = await PriceBettingContract.deploy(deployer.address); // Fee recipient is deployer

  await contract.deployed();

  console.log("PriceBettingContract deployed to:", contract.address);
  console.log("Fee recipient set to:", deployer.address);

  // Verify contract on Etherscan if not on hardhat network
  if (hre.network.name !== "hardhat") {
    console.log("Waiting for block confirmations...");
    await contract.deployTransaction.wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contract.address,
        constructorArguments: [deployer.address],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Verification failed:", error.message);
    }
  }

  // Set up additional price feeds if needed
  console.log("Setting up price feeds...");
  
  // Example: Add LINK token price feed (Sepolia testnet)
  // const linkFeedAddress = "0xc59E3633BAAC79493d908e63626716e204A45EdF";
  // await contract.setPriceFeed("LINK", linkFeedAddress);
  
  console.log("Deployment completed!");
  console.log("Contract address:", contract.address);
  console.log("Remember to update your frontend configuration with this address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });