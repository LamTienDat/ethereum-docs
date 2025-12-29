const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Script 1: Deploy SimpleERC20 Contract
 * 
 * Purpose:
 * - Learn how to deploy smart contract to testnet
 * - Observe gas cost for deployment
 * - Verify contract on Etherscan
 * 
 * Run: npx hardhat run scripts/01-deploy.js --network sepolia
 */

async function main() {
  console.log("🚀 Starting SimpleERC20 contract deployment...\n");

  // Get deployer information
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from address:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.log("❌ No ETH! Please get Sepolia ETH from faucet:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia\n");
    return;
  }

  // Token parameters
  const TOKEN_NAME = "TL Coin";
  const TOKEN_SYMBOL = "TLC";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", TOKEN_DECIMALS); // 1 million tokens

  console.log("📋 Token parameters:");
  console.log("   Name:", TOKEN_NAME);
  console.log("   Symbol:", TOKEN_SYMBOL);
  console.log("   Decimals:", TOKEN_DECIMALS);
  console.log("   Initial Supply:", ethers.formatUnits(INITIAL_SUPPLY, TOKEN_DECIMALS), TOKEN_SYMBOL);
  console.log();

  // Deploy contract
  console.log("⏳ Deploying contract...");
  const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
  const token = await SimpleERC20.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
    INITIAL_SUPPLY
  );

  // Wait for deployment to complete
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ Deployment successful!");
  console.log("📍 Contract address:", tokenAddress);
  console.log();

  // Get deployment transaction information
  const deployTx = token.deploymentTransaction();
  if (deployTx) {
    console.log("📊 Deployment Transaction:");
    console.log("   Transaction Hash:", deployTx.hash);
    console.log("   Block Number:", deployTx.blockNumber);
    console.log("   Gas Used:", deployTx.gasLimit.toString());
    console.log("   Gas Price:", ethers.formatUnits(deployTx.gasPrice || 0n, "gwei"), "gwei");
    
    // Calculate cost
    const cost = (deployTx.gasLimit * (deployTx.gasPrice || 0n));
    console.log("   Deployment Cost:", ethers.formatEther(cost), "ETH");
    console.log();
  }

  // Verify token information
  console.log("🔍 Verify token information:");
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const deployerBalance = await token.balanceOf(deployer.address);

  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("   Deployer Balance:", ethers.formatUnits(deployerBalance, decimals), symbol);
  console.log();

  // Save contract address
  console.log("💾 Saving contract address to deployed-address.txt");
  const fs = require("fs");
  fs.writeFileSync(
    "deployed-address.txt",
    `Contract Address: ${tokenAddress}\n` +
    `Network: Sepolia\n` +
    `Deployer: ${deployer.address}\n` +
    `Deployment Time: ${new Date().toISOString()}\n`
  );

  // Instructions to verify on Etherscan
  console.log("📝 To verify contract on Etherscan, run:");
  console.log(`   npx hardhat verify --network sepolia ${tokenAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${TOKEN_DECIMALS} "${INITIAL_SUPPLY}"`);
  console.log();

  // Links
  console.log("🔗 Links:");
  console.log(`   Etherscan: https://sepolia.etherscan.io/address/${tokenAddress}`);
  console.log(`   Transaction: https://sepolia.etherscan.io/tx/${deployTx?.hash}`);
  console.log();

  console.log("✨ Deployment complete! You can now run other scripts.");
  console.log("   Next: npx hardhat run scripts/02-transfer-eth.js --network sepolia");
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

