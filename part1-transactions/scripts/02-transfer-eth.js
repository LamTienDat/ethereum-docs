const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Script 2: Demo ETH Transfer (Native Token)
 * 
 * Purpose:
 * - Understand native token (ETH) transfer mechanism
 * - Observe gas cost (~21,000 gas)
 * - View transaction receipt and confirmations
 * 
 * Run: npx hardhat run scripts/02-transfer-eth.js --network sepolia
 */

async function main() {
  console.log("💸 Demo: Transfer ETH (Native Token)\n");
  console.log("=".repeat(60));
  console.log();

  // Get signer
  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);

  // Recipient address (can be changed in .env)
  const recipientAddress = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  console.log("👤 Recipient:", recipientAddress);
  console.log();

  // Check balance before transfer
  console.log("📊 Balance BEFORE transfer:");
  const senderBalanceBefore = await ethers.provider.getBalance(sender.address);
  const recipientBalanceBefore = await ethers.provider.getBalance(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatEther(senderBalanceBefore)} ETH`);
  console.log(`   Recipient: ${ethers.formatEther(recipientBalanceBefore)} ETH`);
  console.log();

  // Amount to send
  const amountToSend = ethers.parseEther("0.001"); // 0.001 ETH
  console.log("💰 Amount to transfer:", ethers.formatEther(amountToSend), "ETH");
  console.log();

  // Get current gas information
  console.log("⛽ Gas Information:");
  const feeData = await ethers.provider.getFeeData();
  console.log(`   Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  // Estimate gas for ETH transfer
  const estimatedGas = 21000n; // ETH transfer is always 21,000 gas
  console.log("📊 Gas Estimation:");
  console.log(`   Estimated Gas: ${estimatedGas.toString()} gas`);
  
  // Calculate estimated cost
  const estimatedCost = estimatedGas * (feeData.maxFeePerGas || 0n);
  console.log(`   Estimated Cost: ${ethers.formatEther(estimatedCost)} ETH`);
  console.log();

  // Confirmation
  console.log("⏳ Sending transaction...");
  
  // Send ETH
  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amountToSend,
    // Gas will be estimated automatically if not provided
  });

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
  console.log(`   Block Hash: ${receipt.blockHash}`);
  console.log(`   Gas Used: ${receipt.gasUsed.toString()} gas`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
  
  // Calculate actual cost
  const actualCost = receipt.gasUsed * receipt.gasPrice;
  console.log(`   Transaction Fee: ${ethers.formatEther(actualCost)} ETH`);
  console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  console.log();

  // Check balance after transfer
  console.log("📊 Balance AFTER transfer:");
  const senderBalanceAfter = await ethers.provider.getBalance(sender.address);
  const recipientBalanceAfter = await ethers.provider.getBalance(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatEther(senderBalanceAfter)} ETH`);
  console.log(`   Recipient: ${ethers.formatEther(recipientBalanceAfter)} ETH`);
  console.log();

  // Calculate changes
  console.log("📈 Changes:");
  const senderChange = senderBalanceAfter - senderBalanceBefore;
  const recipientChange = recipientBalanceAfter - recipientBalanceBefore;
  
  console.log(`   Sender: ${ethers.formatEther(senderChange)} ETH`);
  console.log(`   Recipient: ${ethers.formatEther(recipientChange)} ETH`);
  console.log();

  // Explanation
  console.log("💡 Explanation:");
  console.log(`   - Sender lost: ${ethers.formatEther(amountToSend)} ETH (transfer) + ${ethers.formatEther(actualCost)} ETH (gas fee)`);
  console.log(`   - Total lost: ${ethers.formatEther(amountToSend + actualCost)} ETH`);
  console.log(`   - Recipient received: ${ethers.formatEther(recipientChange)} ETH`);
  console.log(`   - Gas for ETH transfer: Always 21,000 gas (fixed)`);
  console.log();

  // Compare with ERC20
  console.log("📊 Compare ETH vs ERC20:");
  console.log("   ETH Transfer:");
  console.log("   - Gas: ~21,000 (fixed)");
  console.log("   - Mechanism: Protocol level");
  console.log("   - Speed: Fastest");
  console.log();
  console.log("   ERC20 Transfer:");
  console.log("   - Gas: ~50,000-65,000 (depends on contract)");
  console.log("   - Mechanism: Smart contract");
  console.log("   - Speed: Slower (must execute code)");
  console.log();

  console.log("✨ Demo complete!");
  console.log("   Next: npx hardhat run scripts/03-transfer-erc20.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

