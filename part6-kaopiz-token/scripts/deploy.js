const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying TLCoin...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const TLCoin = await ethers.getContractFactory("TLCoin");
  const tlCoin = await TLCoin.deploy(deployer.address);

  await tlCoin.waitForDeployment();

  const contractAddress = await tlCoin.getAddress();
  console.log("✅ TLCoin deployed to:", contractAddress);

  // Get token info
  const tokenInfo = await tlCoin.getTokenInfo();
  console.log("\n📊 Token Information:");
  console.log("   Name:", tokenInfo.tokenName);
  console.log("   Symbol:", tokenInfo.tokenSymbol);
  console.log("   Decimals:", tokenInfo.tokenDecimals);
  console.log(
    "   Total Supply:",
    ethers.formatEther(tokenInfo.tokenTotalSupply),
    "KPC"
  );
  console.log(
    "   Max Supply:",
    ethers.formatEther(tokenInfo.tokenMaxSupply),
    "KPC"
  );
  console.log("   Is Paused:", tokenInfo.isPaused);

  // Wait for block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await tlCoin.deploymentTransaction().wait(5);

  // Verify contract on Etherscan
  console.log("\n🔍 Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [deployer.address],
    });
    console.log("✅ Contract verified!");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
  }

  console.log("\n🎉 Deployment completed!");
  console.log("\n📋 Summary:");
  console.log("   Contract Address:", contractAddress);
  console.log("   Network:", hre.network.name);
  console.log("   Owner:", deployer.address);
  console.log("\n🔗 View on Explorer:");
  if (hre.network.name === "sepolia") {
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (hre.network.name === "bscTestnet") {
    console.log(`   https://testnet.bscscan.com/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });