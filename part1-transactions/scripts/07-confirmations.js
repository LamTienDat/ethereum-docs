const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Script 7: Confirmations Demo
 * 
 * Purpose:
 * - Understand what confirmations are
 * - Why multiple confirmations are needed
 * - Re-org attack
 * 
 * Run: npx hardhat run scripts/07-confirmations.js --network sepolia
 */

async function main() {
  console.log("✅ Demo: Confirmations\n");
  console.log("=".repeat(60));
  console.log();

  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);
  console.log();

  // ========== PART 1: What are Confirmations? ==========
  console.log("=".repeat(60));
  console.log("PART 1: What are Confirmations?");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Definition:");
  console.log("   Confirmations = Number of blocks created AFTER the block containing your transaction");
  console.log();

  console.log("📊 Example:");
  console.log("   - Your transaction is in block 1000");
  console.log("   - Current block is 1005");
  console.log("   - Confirmations = 1005 - 1000 = 5");
  console.log();

  console.log("🔒 Why are confirmations needed?");
  console.log("   - New blocks can be \"re-orged\" (reorganization)");
  console.log("   - Re-org = Blockchain reverses, blocks are removed");
  console.log("   - More confirmations = Harder to re-org");
  console.log();

  console.log("📈 Best Practices:");
  console.log("   - Ethereum: 12+ confirmations (~2.5 minutes)");
  console.log("   - BSC/Polygon: 64-128 confirmations");
  console.log("   - Small transactions: 1-3 confirmations");
  console.log("   - Large transactions: 12+ confirmations");
  console.log("   - Exchange deposit: 12-64 confirmations");
  console.log();

  // ========== PART 2: Send Transaction ==========
  console.log("=".repeat(60));
  console.log("PART 2: Send Transaction and Monitor Confirmations");
  console.log("=".repeat(60));
  console.log();

  const recipient = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const amount = ethers.parseEther("0.0001");

  console.log("📝 Transaction:");
  console.log(`   To: ${recipient}`);
  console.log(`   Value: ${ethers.formatEther(amount)} ETH`);
  console.log();

  // Get current block number
  const currentBlockBefore = await ethers.provider.getBlockNumber();
  console.log("📊 Current block:", currentBlockBefore);
  console.log();

  // Send transaction
  console.log("⏳ Sending transaction...");
  const tx = await sender.sendTransaction({
    to: recipient,
    value: amount
  });

  console.log("✅ Transaction sent!");
  console.log("📍 TX Hash:", tx.hash);
  console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log();

  // ========== PART 3: Wait for 0 Confirmations (Pending) ==========
  console.log("=".repeat(60));
  console.log("PART 3: Transaction Pending (0 confirmations)");
  console.log("=".repeat(60));
  console.log();

  console.log("⏳ Transaction is in mempool, not mined yet...");
  console.log("⚠️ In this state:");
  console.log("   - Transaction can be dropped");
  console.log("   - Can be replaced (speed up/cancel)");
  console.log("   - Should NOT be considered complete");
  console.log();

  // ========== PART 4: Wait for 1 Confirmation ==========
  console.log("=".repeat(60));
  console.log("PART 4: Wait for 1 Confirmation");
  console.log("=".repeat(60));
  console.log();

  console.log("⏳ Waiting for transaction to be mined...");
  const startTime = Date.now();
  
  const receipt = await tx.wait(1); // Wait for 1 confirmation
  
  const mineTime = Date.now() - startTime;
  console.log(`✅ Transaction mined! (${(mineTime / 1000).toFixed(1)}s)`);
  console.log();

  console.log("📊 Transaction Receipt:");
  console.log(`   Block Number: ${receipt.blockNumber}`);
  console.log(`   Block Hash: ${receipt.blockHash}`);
  console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
  console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  console.log();

  console.log("⚠️ With 1 confirmation:");
  console.log("   - Transaction has been mined");
  console.log("   - But still possible to be re-orged (very low probability)");
  console.log("   - Suitable for: Small transactions, low-risk");
  console.log();

  // ========== PART 5: Wait for Multiple Confirmations ==========
  console.log("=".repeat(60));
  console.log("PART 5: Wait for Multiple Confirmations");
  console.log("=".repeat(60));
  console.log();

  const targetConfirmations = 3; // Wait for 3 confirmations
  console.log(`⏳ Waiting for ${targetConfirmations} confirmations...`);
  console.log();

  let currentConfirmations = 1;
  
  while (currentConfirmations < targetConfirmations) {
    // Wait for new block
    await new Promise(resolve => setTimeout(resolve, 12000)); // ~12s per block
    
    const currentBlock = await ethers.provider.getBlockNumber();
    currentConfirmations = currentBlock - receipt.blockNumber + 1;
    
    console.log(`   Block ${currentBlock}: ${currentConfirmations}/${targetConfirmations} confirmations`);
  }

  console.log();
  console.log(`✅ Reached ${targetConfirmations} confirmations!`);
  console.log();

  console.log("📊 Statistics:");
  const finalBlock = await ethers.provider.getBlockNumber();
  console.log(`   Transaction Block: ${receipt.blockNumber}`);
  console.log(`   Current Block: ${finalBlock}`);
  console.log(`   Total Confirmations: ${finalBlock - receipt.blockNumber + 1}`);
  console.log(`   Time Elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log();

  // ========== PART 6: Re-org Attack ==========
  console.log("=".repeat(60));
  console.log("PART 6: Re-org Attack");
  console.log("=".repeat(60));
  console.log();

  console.log("❓ What is Re-org?");
  console.log();
  console.log("   Blockchain is a chain of blocks:");
  console.log("   Block 1 → Block 2 → Block 3 → Block 4");
  console.log();
  console.log("   If 2 miners mine block 3 simultaneously:");
  console.log("   Block 1 → Block 2 → Block 3A");
  console.log("                     → Block 3B");
  console.log();
  console.log("   Network will choose the longer chain:");
  console.log("   Block 1 → Block 2 → Block 3A → Block 4A (✅ Accepted)");
  console.log("                     → Block 3B (❌ Orphaned)");
  console.log();
  console.log("   If your transaction is in Block 3B → Removed!");
  console.log();

  console.log("🎯 Attack Example:");
  console.log();
  console.log("   1. Hacker sends 100 ETH to Exchange");
  console.log("   2. Transaction mined in block 1000 (1 confirmation)");
  console.log("   3. Exchange sees 1 confirmation → Allows withdrawal");
  console.log("   4. Hacker withdraws 100 ETH");
  console.log("   5. Hacker mines different block 1000 (without deposit transaction)");
  console.log("   6. If hacker's new block is accepted → Re-org!");
  console.log("   7. Deposit transaction cancelled, but hacker already withdrew");
  console.log();

  console.log("🛡️ Prevention:");
  console.log("   - Wait for multiple confirmations (12+ for Ethereum)");
  console.log("   - Large transactions: Wait longer");
  console.log("   - Monitor chain re-orgs");
  console.log("   - Use finality gadgets (Casper FFG)");
  console.log();

  // ========== PART 7: Best Practices ==========
  console.log("=".repeat(60));
  console.log("PART 7: Best Practices");
  console.log("=".repeat(60));
  console.log();

  console.log("📋 Recommended confirmations:");
  console.log();
  console.log("   Ethereum Mainnet:");
  console.log("   - Small transactions (<$100): 1-3 confirmations");
  console.log("   - Medium transactions ($100-$10k): 6-12 confirmations");
  console.log("   - Large transactions (>$10k): 12-64 confirmations");
  console.log("   - Exchange deposit: 12-35 confirmations");
  console.log();

  console.log("   BSC/Polygon:");
  console.log("   - Faster block time (3s) → Need more confirmations");
  console.log("   - Usually: 64-128 confirmations");
  console.log();

  console.log("   Arbitrum/Optimism (Layer 2):");
  console.log("   - Slower finality (7 days challenge period)");
  console.log("   - Need to wait for finality period");
  console.log();

  console.log("💻 Code Example:");
  console.log();
  console.log("```javascript");
  console.log("// Wait for 12 confirmations");
  console.log("const receipt = await tx.wait(12);");
  console.log("");
  console.log("// Or manual check");
  console.log("const receipt = await tx.wait(1);");
  console.log("while (true) {");
  console.log("  const currentBlock = await provider.getBlockNumber();");
  console.log("  const confirmations = currentBlock - receipt.blockNumber + 1;");
  console.log("  if (confirmations >= 12) break;");
  console.log("  await new Promise(r => setTimeout(r, 12000));");
  console.log("}");
  console.log("```");
  console.log();

  // ========== SUMMARY ==========
  console.log("=".repeat(60));
  console.log("📝 Confirmations Summary");
  console.log("=".repeat(60));
  console.log();

  console.log("✅ Key Points:");
  console.log();
  console.log("1. Confirmations = Number of blocks after block containing transaction");
  console.log("2. More confirmations = More secure");
  console.log("3. Re-org can happen with few confirmations");
  console.log("4. Ethereum: 12+ confirmations for large transactions");
  console.log("5. Frontend: Can show UI after 1 confirmation");
  console.log("6. Backend: Should wait 12+ confirmations before updating DB");
  console.log("7. Exchange: Usually requires 12-64 confirmations");
  console.log();

  console.log("🔗 Resources:");
  console.log("   - Ethereum Finality: https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#finality");
  console.log("   - EIP-1559: https://eips.ethereum.org/EIPS/eip-1559");
  console.log("   - Etherscan: https://sepolia.etherscan.io/");
  console.log();

  console.log("✨ Completed all Part 1 demos!");
  console.log();
  console.log("🎉 Congratulations! You've learned:");
  console.log("   ✅ Transfer ETH vs ERC20");
  console.log("   ✅ transfer / approve / transferFrom");
  console.log("   ✅ Nonce and stuck transactions");
  console.log("   ✅ Gas estimation and optimization");
  console.log("   ✅ Confirmations and transaction finality");
  console.log();
  console.log("📚 Next: Learn Part 2 - Wallet, Signing and Authentication");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

