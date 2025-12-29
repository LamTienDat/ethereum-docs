const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Script 3: Demo ERC20 Token Transfer
 * 
 * Purpose:
 * - Understand how to call ERC20 transfer() function
 * - Observe gas cost (~50,000-65,000 gas)
 * - Compare with ETH transfer
 * 
 * Run: npx hardhat run scripts/03-transfer-erc20.js --network sepolia
 */

async function main() {
  console.log("🪙 Demo: Transfer ERC20 Token\n");
  console.log("=".repeat(60));
  console.log();

  // Read deployed contract address
  let contractAddress;
  try {
    const deployedInfo = fs.readFileSync("deployed-address.txt", "utf8");
    const match = deployedInfo.match(/Contract Address: (0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    } else {
      throw new Error("Contract address not found");
    }
  } catch (error) {
    console.log("❌ Contract not deployed yet!");
    console.log("   Please run: npx hardhat run scripts/01-deploy.js --network sepolia");
    return;
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log();

  // Connect to contract
  const [sender] = await ethers.getSigners();
  const token = await ethers.getContractAt("SimpleERC20", contractAddress);

  // Get token information
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  console.log("🪙 Token Info:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log();

  // Recipient address
  const recipientAddress = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  console.log("👤 Sender:", sender.address);
  console.log("👤 Recipient:", recipientAddress);
  console.log();

  // Check token balance before transfer
  console.log("📊 Token Balance BEFORE transfer:");
  const senderBalanceBefore = await token.balanceOf(sender.address);
  const recipientBalanceBefore = await token.balanceOf(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatUnits(senderBalanceBefore, decimals)} ${symbol}`);
  console.log(`   Recipient: ${ethers.formatUnits(recipientBalanceBefore, decimals)} ${symbol}`);
  console.log();

  // Check ETH balance (to pay gas)
  const ethBalance = await ethers.provider.getBalance(sender.address);
  console.log("💰 ETH Balance (to pay gas):", ethers.formatEther(ethBalance), "ETH");
  console.log();

  // Amount of tokens to transfer
  const amountToSend = ethers.parseUnits("100", decimals); // 100 tokens
  console.log("💰 Amount to transfer:", ethers.formatUnits(amountToSend, decimals), symbol);
  console.log();

  // Check sufficient balance
  if (senderBalanceBefore < amountToSend) {
    console.log("❌ Insufficient tokens to transfer!");
    return;
  }

  // Estimate gas for transfer
  console.log("⏳ Estimating gas...");
  const estimatedGas = await token.transfer.estimateGas(recipientAddress, amountToSend);
  console.log(`📊 Estimated Gas: ${estimatedGas.toString()} gas`);
  
  // Get gas price
  const feeData = await ethers.provider.getFeeData();
  const estimatedCost = estimatedGas * (feeData.maxFeePerGas || 0n);
  console.log(`💸 Estimated Cost: ${ethers.formatEther(estimatedCost)} ETH`);
  console.log();

  // Send transaction
  console.log("⏳ Sending transaction...");
  const tx = await token.transfer(recipientAddress, amountToSend);

  console.log("✅ Transaction sent!");
  console.log("📍 Transaction Hash:", tx.hash);
  console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log();

  // Wait for transaction to be mined
  console.log("⏳ Waiting for transaction to be mined...");
  const receipt = await tx.wait();
  
  console.log("✅ Transaction confirmed!");
  console.log();

  // Transaction receipt information
  console.log("📊 Transaction Receipt:");
  console.log(`   Block Number: ${receipt.blockNumber}`);
  console.log(`   Gas Used: ${receipt.gasUsed.toString()} gas`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
  
  // Calculate actual cost
  const actualCost = receipt.gasUsed * receipt.gasPrice;
  console.log(`   Transaction Fee: ${ethers.formatEther(actualCost)} ETH`);
  console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  console.log();

  // Parse events
  console.log("📡 Events:");
  for (const log of receipt.logs) {
    try {
      const parsedLog = token.interface.parseLog({
        topics: [...log.topics],
        data: log.data
      });
      
      if (parsedLog && parsedLog.name === "Transfer") {
        console.log(`   Event: Transfer`);
        console.log(`   - From: ${parsedLog.args.from}`);
        console.log(`   - To: ${parsedLog.args.to}`);
        console.log(`   - Value: ${ethers.formatUnits(parsedLog.args.value, decimals)} ${symbol}`);
      }
    } catch (e) {
      // Ignore logs that aren't from our contract
    }
  }
  console.log();

  // Check balance after transfer
  console.log("📊 Token Balance AFTER transfer:");
  const senderBalanceAfter = await token.balanceOf(sender.address);
  const recipientBalanceAfter = await token.balanceOf(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatUnits(senderBalanceAfter, decimals)} ${symbol}`);
  console.log(`   Recipient: ${ethers.formatUnits(recipientBalanceAfter, decimals)} ${symbol}`);
  console.log();

  // Calculate changes
  console.log("📈 Token Changes:");
  const senderChange = senderBalanceAfter - senderBalanceBefore;
  const recipientChange = recipientBalanceAfter - recipientBalanceBefore;
  
  console.log(`   Sender: ${ethers.formatUnits(senderChange, decimals)} ${symbol}`);
  console.log(`   Recipient: ${ethers.formatUnits(recipientChange, decimals)} ${symbol}`);
  console.log();

  // Compare ETH vs ERC20
  console.log("📊 Compare ETH Transfer vs ERC20 Transfer:");
  console.log();
  console.log("   ETH Transfer:");
  console.log("   - Gas Used: ~21,000 gas");
  console.log("   - Mechanism: Protocol level");
  console.log("   - Speed: Fastest");
  console.log("   - Cost: Lowest");
  console.log();
  console.log("   ERC20 Transfer:");
  console.log(`   - Gas Used: ${receipt.gasUsed.toString()} gas (~3x ETH transfer)`);
  console.log("   - Mechanism: Smart contract execution");
  console.log("   - Speed: Slower (execute code)");
  console.log("   - Cost: Higher");
  console.log();

  // Explanation
  console.log("💡 Why does ERC20 cost more gas?");
  console.log("   1. Must load contract code from blockchain");
  console.log("   2. Must execute Solidity code (checks, math, storage updates)");
  console.log("   3. Must update mapping (storage writes are expensive)");
  console.log("   4. Must emit events");
  console.log();
  console.log("   ETH transfer only needs:");
  console.log("   - Update balance of 2 addresses (built-in)");
  console.log("   - No code execution");
  console.log();

  console.log("✨ Demo complete!");
  console.log("   Next: npx hardhat run scripts/04-approve-transferFrom.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

