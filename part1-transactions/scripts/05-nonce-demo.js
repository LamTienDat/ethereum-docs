const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Script 5: Nonce Demo
 * 
 * Purpose:
 * - Understand what nonce is and why it's important
 * - Handle stuck transactions
 * - Send multiple transactions in parallel
 * 
 * Run: npx hardhat run scripts/05-nonce-demo.js --network sepolia
 */

async function main() {
  console.log("🔢 Demo: Nonce (Number Only Used Once)\n");
  console.log("=".repeat(60));
  console.log();

  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);
  console.log();

  // ========== PART 1: Understanding Nonce ==========
  console.log("=".repeat(60));
  console.log("PART 1: What is Nonce?");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Definition:");
  console.log("   Nonce = Number Only Used Once");
  console.log("   Sequential number of transactions from an address (starting from 0)");
  console.log();

  // Get current nonce
  const currentNonce = await ethers.provider.getTransactionCount(sender.address);
  console.log("📊 Current Nonce:", currentNonce);
  console.log();

  console.log("📖 Explanation:");
  console.log(`   - This is transaction #${currentNonce + 1} from this address`);
  console.log("   - Transaction with nonce 0 must be mined before nonce 1");
  console.log("   - Cannot skip nonce (nonce 0 -> 2 will be rejected)");
  console.log("   - Nonce helps prevent replay attacks");
  console.log();

  // ========== PART 2: Sequential Transactions ==========
  console.log("=".repeat(60));
  console.log("PART 2: Send Transactions Sequentially");
  console.log("=".repeat(60));
  console.log();

  const recipient = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const amount = ethers.parseEther("0.0001"); // 0.0001 ETH

  console.log("📝 Sending 3 transactions sequentially:");
  console.log();

  for (let i = 0; i < 3; i++) {
    const nonce = await ethers.provider.getTransactionCount(sender.address);
    console.log(`Transaction ${i + 1}:`);
    console.log(`   Nonce: ${nonce}`);
    
    const tx = await sender.sendTransaction({
      to: recipient,
      value: amount,
      nonce: nonce // Automatically get nonce
    });
    
    console.log(`   TX Hash: ${tx.hash}`);
    console.log(`   Status: Sent, waiting to be mined...`);
    
    // Wait for transaction to be mined
    await tx.wait();
    console.log(`   Status: ✅ Mined!`);
    console.log();
  }

  console.log("✅ All transactions mined in order!");
  console.log();

  // ========== PART 3: Parallel Transactions ==========
  console.log("=".repeat(60));
  console.log("PART 3: Send Transactions in Parallel");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Technique:");
  console.log("   To send multiple transactions at once, must manually manage nonce");
  console.log("   Otherwise, all will use the same nonce and conflict!");
  console.log();

  const startNonce = await ethers.provider.getTransactionCount(sender.address);
  console.log("📊 Starting nonce:", startNonce);
  console.log();

  console.log("📝 Sending 3 transactions in parallel:");
  console.log();

  const txPromises = [];
  for (let i = 0; i < 3; i++) {
    const nonce = startNonce + i; // Manually increment nonce
    console.log(`Transaction ${i + 1}:`);
    console.log(`   Nonce: ${nonce}`);
    
    const txPromise = sender.sendTransaction({
      to: recipient,
      value: amount,
      nonce: nonce // Specify exact nonce
    });
    
    txPromises.push(txPromise);
    
    txPromise.then(tx => {
      console.log(`   TX Hash: ${tx.hash}`);
    });
  }

  console.log();
  console.log("⏳ Waiting for all transactions to be sent...");
  const txs = await Promise.all(txPromises);
  console.log("✅ All transactions sent!");
  console.log();

  console.log("⏳ Waiting for all transactions to be mined...");
  const receipts = await Promise.all(txs.map(tx => tx.wait()));
  console.log("✅ All transactions mined!");
  console.log();

  receipts.forEach((receipt, i) => {
    console.log(`Transaction ${i + 1}:`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  });
  console.log();

  // ========== PART 4: Stuck Transaction ==========
  console.log("=".repeat(60));
  console.log("PART 4: Handle Stuck Transaction");
  console.log("=".repeat(60));
  console.log();

  console.log("❓ When does a transaction get stuck?");
  console.log("   - Gas price too low");
  console.log("   - Network congestion");
  console.log("   - Nonce conflict");
  console.log();

  console.log("🔧 How to fix:");
  console.log();

  console.log("1️⃣ Speed Up (Increase gas price):");
  console.log("   - Resend transaction with SAME nonce");
  console.log("   - But HIGHER gas price");
  console.log("   - New transaction will replace old one");
  console.log();

  console.log("2️⃣ Cancel (Cancel transaction):");
  console.log("   - Send 0 ETH transaction to yourself");
  console.log("   - With SAME nonce");
  console.log("   - HIGHER gas price");
  console.log();

  console.log("📝 Demo: Speed Up");
  console.log();

  // Send transaction with low gas price (might get stuck)
  const lowGasTx = await sender.sendTransaction({
    to: recipient,
    value: amount,
    maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"), // Very low
    maxFeePerGas: ethers.parseUnits("20", "gwei")
  });

  console.log("📍 Original TX Hash:", lowGasTx.hash);
  console.log("   Nonce:", lowGasTx.nonce);
  console.log("   Gas Price: Low (might get stuck)");
  console.log();

  console.log("⏳ Waiting 5 seconds...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Check if mined
  const receipt = await ethers.provider.getTransactionReceipt(lowGasTx.hash);
  
  if (!receipt) {
    console.log("⚠️ Transaction not mined yet! Stuck...");
    console.log();
    console.log("🔧 Performing Speed Up:");
    
    // Get higher gas price
    const feeData = await ethers.provider.getFeeData();
    const higherMaxPriorityFee = (feeData.maxPriorityFeePerGas || 0n) * 2n; // Double
    const higherMaxFee = (feeData.maxFeePerGas || 0n) * 2n;
    
    // Resend with same nonce but higher gas
    const speedUpTx = await sender.sendTransaction({
      to: recipient,
      value: amount,
      nonce: lowGasTx.nonce, // SAME nonce
      maxPriorityFeePerGas: higherMaxPriorityFee,
      maxFeePerGas: higherMaxFee
    });
    
    console.log("📍 Speed Up TX Hash:", speedUpTx.hash);
    console.log("   Nonce:", speedUpTx.nonce, "(same as original)");
    console.log("   Gas Price: Higher");
    console.log();
    
    console.log("⏳ Waiting for speed up transaction...");
    const speedUpReceipt = await speedUpTx.wait();
    console.log("✅ Speed up transaction mined!");
    console.log("   Block:", speedUpReceipt.blockNumber);
    console.log();
    
    console.log("💡 Result:");
    console.log("   - Old transaction replaced");
    console.log("   - New transaction mined");
    console.log("   - Only 1 of 2 transactions executed");
  } else {
    console.log("✅ Transaction already mined (not stuck)");
    console.log("   Block:", receipt.blockNumber);
  }
  console.log();

  // ========== SUMMARY ==========
  console.log("=".repeat(60));
  console.log("📝 Nonce Summary");
  console.log("=".repeat(60));
  console.log();

  console.log("✅ Key Points:");
  console.log();
  console.log("1. Nonce is the sequential transaction number (starting from 0)");
  console.log("2. Transactions must be mined in nonce order");
  console.log("3. Cannot skip nonce");
  console.log("4. To send parallel transactions, must manually manage nonce");
  console.log("5. Stuck transaction can be fixed by:");
  console.log("   - Speed up: Resend with same nonce, higher gas");
  console.log("   - Cancel: Send 0 ETH to yourself, same nonce, higher gas");
  console.log();

  console.log("🔗 Useful Tools:");
  console.log("   - Etherscan: View pending transactions");
  console.log("   - MetaMask: Speed up / Cancel transactions");
  console.log("   - Blocknative: Gas price estimator");
  console.log();

  console.log("✨ Demo complete!");
  console.log("   Next: npx hardhat run scripts/06-gas-estimation.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

