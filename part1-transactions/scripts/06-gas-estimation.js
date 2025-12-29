const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Script 6: Gas Estimation Demo
 * 
 * Purpose:
 * - Understand how to estimate gas before sending transaction
 * - EIP-1559: Base Fee + Priority Fee
 * - Automatic vs manual gas handling
 * 
 * Run: npx hardhat run scripts/06-gas-estimation.js --network sepolia
 */

async function main() {
  console.log("⛽ Demo: Gas Estimation\n");
  console.log("=".repeat(60));
  console.log();

  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);
  console.log();

  // ========== PART 1: Understanding Gas ==========
  console.log("=".repeat(60));
  console.log("PART 1: What is Gas?");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Definition:");
  console.log("   Gas = Unit of measurement for computational work");
  console.log("   Gas Price = Price you're willing to pay per gas unit");
  console.log("   Transaction Fee = Gas Used × Gas Price");
  console.log();

  console.log("📊 EIP-1559 (London Hard Fork):");
  console.log("   Transaction Fee = Gas Used × (Base Fee + Priority Fee)");
  console.log();
  console.log("   - Base Fee: Network's base fee (automatically adjusted)");
  console.log("   - Priority Fee: Tip for validators (to prioritize transaction)");
  console.log("   - Max Fee: Maximum you're willing to pay");
  console.log();

  // Get current gas information
  console.log("📊 Current Gas Information:");
  const feeData = await ethers.provider.getFeeData();
  
  console.log(`   Gas Price (Legacy): ${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`);
  console.log(`   Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  // Get base fee from latest block
  const latestBlock = await ethers.provider.getBlock("latest");
  if (latestBlock && latestBlock.baseFeePerGas) {
    console.log(`   Base Fee (from block): ${ethers.formatUnits(latestBlock.baseFeePerGas, "gwei")} gwei`);
    console.log();
  }

  // ========== PART 2: Estimate Gas for ETH Transfer ==========
  console.log("=".repeat(60));
  console.log("PART 2: Estimate Gas for ETH Transfer");
  console.log("=".repeat(60));
  console.log();

  const recipient = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const amount = ethers.parseEther("0.001");

  console.log("📝 Transaction:");
  console.log(`   To: ${recipient}`);
  console.log(`   Value: ${ethers.formatEther(amount)} ETH`);
  console.log();

  // Estimate gas
  const estimatedGasETH = await ethers.provider.estimateGas({
    to: recipient,
    value: amount
  });

  console.log("📊 Gas Estimation:");
  console.log(`   Estimated Gas: ${estimatedGasETH.toString()} gas`);
  console.log(`   (ETH transfer is always 21,000 gas)`);
  console.log();

  // Calculate cost
  const estimatedCostETH = estimatedGasETH * (feeData.maxFeePerGas || 0n);
  console.log("💸 Estimated Cost:");
  console.log(`   ${ethers.formatEther(estimatedCostETH)} ETH`);
  console.log(`   (~$${(parseFloat(ethers.formatEther(estimatedCostETH)) * 3000).toFixed(4)} if ETH = $3000)`);
  console.log();

  // ========== PART 3: Estimate Gas for ERC20 Transfer ==========
  console.log("=".repeat(60));
  console.log("PART 3: Estimate Gas for ERC20 Transfer");
  console.log("=".repeat(60));
  console.log();

  // Read contract address
  let contractAddress;
  try {
    const deployedInfo = fs.readFileSync("deployed-address.txt", "utf8");
    const match = deployedInfo.match(/Contract Address: (0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    }
  } catch (error) {
    console.log("⚠️ Contract not deployed yet, skipping this part");
    contractAddress = null;
  }

  if (contractAddress) {
    const token = await ethers.getContractAt("SimpleERC20", contractAddress);
    const symbol = await token.symbol();
    const decimals = await token.decimals();
    const transferAmount = ethers.parseUnits("100", decimals);

    console.log("🪙 Token:", symbol);
    console.log(`💰 Amount: ${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
    console.log();

    // Estimate gas
    const estimatedGasERC20 = await token.transfer.estimateGas(recipient, transferAmount);

    console.log("📊 Gas Estimation:");
    console.log(`   Estimated Gas: ${estimatedGasERC20.toString()} gas`);
    console.log(`   (ERC20 transfer: ~50,000-65,000 gas)`);
    console.log();

    // Calculate cost
    const estimatedCostERC20 = estimatedGasERC20 * (feeData.maxFeePerGas || 0n);
    console.log("💸 Estimated Cost:");
    console.log(`   ${ethers.formatEther(estimatedCostERC20)} ETH`);
    console.log();

    // Compare
    console.log("📊 Compare ETH vs ERC20:");
    console.log(`   ETH: ${estimatedGasETH.toString()} gas`);
    console.log(`   ERC20: ${estimatedGasERC20.toString()} gas`);
    console.log(`   Difference: ${((Number(estimatedGasERC20) / Number(estimatedGasETH)) * 100 - 100).toFixed(1)}% higher`);
    console.log();
  }

  // ========== PART 4: Automatic vs Manual Gas Handling ==========
  console.log("=".repeat(60));
  console.log("PART 4: Automatic vs Manual Gas Handling");
  console.log("=".repeat(60));
  console.log();

  console.log("1️⃣ Automatic (Recommended):");
  console.log();
  console.log("```javascript");
  console.log("const tx = await signer.sendTransaction({");
  console.log("  to: recipient,");
  console.log("  value: amount");
  console.log("  // Gas will be estimated automatically");
  console.log("});");
  console.log("```");
  console.log();
  console.log("✅ Advantages:");
  console.log("   - Simple, no calculations needed");
  console.log("   - Ethers.js automatically estimates and adds buffer");
  console.log("   - Suitable for most use cases");
  console.log();

  console.log("2️⃣ Manual (Advanced):");
  console.log();
  console.log("```javascript");
  console.log("const estimatedGas = await provider.estimateGas(tx);");
  console.log("const gasLimit = estimatedGas * 120n / 100n; // +20% buffer");
  console.log("");
  console.log("const tx = await signer.sendTransaction({");
  console.log("  to: recipient,");
  console.log("  value: amount,");
  console.log("  gasLimit: gasLimit,");
  console.log("  maxFeePerGas: ethers.parseUnits('50', 'gwei'),");
  console.log("  maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')");
  console.log("});");
  console.log("```");
  console.log();
  console.log("✅ Advantages:");
  console.log("   - Precise cost control");
  console.log("   - Can optimize gas cost");
  console.log("   - Suitable for production backend");
  console.log();

  // ========== PART 5: Demo Automatic ==========
  console.log("=".repeat(60));
  console.log("PART 5: Demo Automatic Gas");
  console.log("=".repeat(60));
  console.log();

  console.log("📝 Sending transaction with automatic gas:");
  console.log();

  const autoTx = await sender.sendTransaction({
    to: recipient,
    value: ethers.parseEther("0.0001")
    // No gas parameters provided
  });

  console.log("✅ Transaction sent!");
  console.log("📍 TX Hash:", autoTx.hash);
  console.log();

  console.log("📊 Gas Parameters (automatic):");
  console.log(`   Gas Limit: ${autoTx.gasLimit?.toString() || "N/A"}`);
  console.log(`   Max Fee: ${ethers.formatUnits(autoTx.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(autoTx.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  console.log("⏳ Waiting for confirmation...");
  const autoReceipt = await autoTx.wait();
  console.log("✅ Confirmed!");
  console.log();

  console.log("📊 Actual Gas Used:");
  console.log(`   ${autoReceipt.gasUsed.toString()} gas`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(autoReceipt.gasPrice, "gwei")} gwei`);
  console.log(`   Total Cost: ${ethers.formatEther(autoReceipt.gasUsed * autoReceipt.gasPrice)} ETH`);
  console.log();

  // ========== PART 6: Demo Manual ==========
  console.log("=".repeat(60));
  console.log("PART 6: Demo Manual Gas");
  console.log("=".repeat(60));
  console.log();

  console.log("📝 Sending transaction with manual gas:");
  console.log();

  // Estimate first
  const manualEstimatedGas = await ethers.provider.estimateGas({
    to: recipient,
    value: ethers.parseEther("0.0001")
  });

  // Add 20% buffer
  const gasLimit = manualEstimatedGas * 120n / 100n;

  // Get fee data
  const manualFeeData = await ethers.provider.getFeeData();

  console.log("📊 Manual Gas Parameters:");
  console.log(`   Estimated: ${manualEstimatedGas.toString()} gas`);
  console.log(`   Gas Limit (+ 20%): ${gasLimit.toString()} gas`);
  console.log(`   Max Fee: ${ethers.formatUnits(manualFeeData.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(manualFeeData.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  const manualTx = await sender.sendTransaction({
    to: recipient,
    value: ethers.parseEther("0.0001"),
    gasLimit: gasLimit,
    maxFeePerGas: manualFeeData.maxFeePerGas,
    maxPriorityFeePerGas: manualFeeData.maxPriorityFeePerGas
  });

  console.log("✅ Transaction sent!");
  console.log("📍 TX Hash:", manualTx.hash);
  console.log();

  console.log("⏳ Waiting for confirmation...");
  const manualReceipt = await manualTx.wait();
  console.log("✅ Confirmed!");
  console.log();

  console.log("📊 Actual Gas Used:");
  console.log(`   ${manualReceipt.gasUsed.toString()} gas (< ${gasLimit.toString()} limit)`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(manualReceipt.gasPrice, "gwei")} gwei`);
  console.log(`   Total Cost: ${ethers.formatEther(manualReceipt.gasUsed * manualReceipt.gasPrice)} ETH`);
  console.log();

  // ========== SUMMARY ==========
  console.log("=".repeat(60));
  console.log("📝 Gas Summary");
  console.log("=".repeat(60));
  console.log();

  console.log("✅ Key Points:");
  console.log();
  console.log("1. Gas = Computational work");
  console.log("2. Transaction Fee = Gas Used × Gas Price");
  console.log("3. EIP-1559: Base Fee + Priority Fee");
  console.log("4. ETH transfer: 21,000 gas (fixed)");
  console.log("5. ERC20 transfer: ~50,000-65,000 gas");
  console.log("6. Always estimate gas before sending");
  console.log("7. Add buffer (10-20%) for gas limit");
  console.log("8. Frontend: Use automatic gas");
  console.log("9. Backend: Can use manual to optimize");
  console.log();

  console.log("🔗 Useful Tools:");
  console.log("   - Etherscan Gas Tracker: https://etherscan.io/gastracker");
  console.log("   - Blocknative Gas Estimator: https://www.blocknative.com/gas-estimator");
  console.log("   - ETH Gas Station: https://ethgasstation.info/");
  console.log();

  console.log("✨ Demo complete!");
  console.log("   Next: npx hardhat run scripts/07-confirmations.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

