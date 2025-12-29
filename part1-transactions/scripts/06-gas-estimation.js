const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Script 6: Demo Gas Estimation
 * 
 * Mục đích:
 * - Hiểu cách estimate gas trước khi gửi transaction
 * - EIP-1559: Base Fee + Priority Fee
 * - Xử lý gas tự động vs manual
 * 
 * Chạy: npx hardhat run scripts/06-gas-estimation.js --network sepolia
 */

async function main() {
  console.log("⛽ Demo: Gas Estimation\n");
  console.log("=".repeat(60));
  console.log();

  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);
  console.log();

  // ========== PHẦN 1: Hiểu về Gas ==========
  console.log("=".repeat(60));
  console.log("PHẦN 1: Gas là gì?");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Định nghĩa:");
  console.log("   Gas = Đơn vị đo lường computational work");
  console.log("   Gas Price = Giá bạn sẵn sàng trả cho 1 unit gas");
  console.log("   Transaction Fee = Gas Used × Gas Price");
  console.log();

  console.log("📊 EIP-1559 (London Hard Fork):");
  console.log("   Transaction Fee = Gas Used × (Base Fee + Priority Fee)");
  console.log();
  console.log("   - Base Fee: Phí cơ bản của network (tự động điều chỉnh)");
  console.log("   - Priority Fee: Tip cho validators (để ưu tiên transaction)");
  console.log("   - Max Fee: Giới hạn tối đa bạn sẵn sàng trả");
  console.log();

  // Lấy thông tin gas hiện tại
  console.log("📊 Thông tin Gas hiện tại:");
  const feeData = await ethers.provider.getFeeData();
  
  console.log(`   Gas Price (Legacy): ${ethers.formatUnits(feeData.gasPrice || 0n, "gwei")} gwei`);
  console.log(`   Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  // Lấy base fee từ latest block
  const latestBlock = await ethers.provider.getBlock("latest");
  if (latestBlock && latestBlock.baseFeePerGas) {
    console.log(`   Base Fee (from block): ${ethers.formatUnits(latestBlock.baseFeePerGas, "gwei")} gwei`);
    console.log();
  }

  // ========== PHẦN 2: Estimate Gas cho ETH Transfer ==========
  console.log("=".repeat(60));
  console.log("PHẦN 2: Estimate Gas cho ETH Transfer");
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
  console.log(`   (ETH transfer luôn là 21,000 gas)`);
  console.log();

  // Tính cost
  const estimatedCostETH = estimatedGasETH * (feeData.maxFeePerGas || 0n);
  console.log("💸 Estimated Cost:");
  console.log(`   ${ethers.formatEther(estimatedCostETH)} ETH`);
  console.log(`   (~$${(parseFloat(ethers.formatEther(estimatedCostETH)) * 3000).toFixed(4)} nếu ETH = $3000)`);
  console.log();

  // ========== PHẦN 3: Estimate Gas cho ERC20 Transfer ==========
  console.log("=".repeat(60));
  console.log("PHẦN 3: Estimate Gas cho ERC20 Transfer");
  console.log("=".repeat(60));
  console.log();

  // Đọc contract address
  let contractAddress;
  try {
    const deployedInfo = fs.readFileSync("deployed-address.txt", "utf8");
    const match = deployedInfo.match(/Contract Address: (0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    }
  } catch (error) {
    console.log("⚠️ Chưa deploy contract, skip phần này");
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

    // Tính cost
    const estimatedCostERC20 = estimatedGasERC20 * (feeData.maxFeePerGas || 0n);
    console.log("💸 Estimated Cost:");
    console.log(`   ${ethers.formatEther(estimatedCostERC20)} ETH`);
    console.log();

    // So sánh
    console.log("📊 So sánh ETH vs ERC20:");
    console.log(`   ETH: ${estimatedGasETH.toString()} gas`);
    console.log(`   ERC20: ${estimatedGasERC20.toString()} gas`);
    console.log(`   Chênh lệch: ${((Number(estimatedGasERC20) / Number(estimatedGasETH)) * 100 - 100).toFixed(1)}% cao hơn`);
    console.log();
  }

  // ========== PHẦN 4: Xử lý Gas Tự động ==========
  console.log("=".repeat(60));
  console.log("PHẦN 4: Xử lý Gas Tự động vs Manual");
  console.log("=".repeat(60));
  console.log();

  console.log("1️⃣ Tự động (Recommended):");
  console.log();
  console.log("```javascript");
  console.log("const tx = await signer.sendTransaction({");
  console.log("  to: recipient,");
  console.log("  value: amount");
  console.log("  // Gas sẽ được estimate tự động");
  console.log("});");
  console.log("```");
  console.log();
  console.log("✅ Ưu điểm:");
  console.log("   - Đơn giản, không cần tính toán");
  console.log("   - Ethers.js tự động estimate và thêm buffer");
  console.log("   - Phù hợp cho hầu hết use cases");
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
  console.log("✅ Ưu điểm:");
  console.log("   - Kiểm soát chính xác chi phí");
  console.log("   - Có thể optimize gas cost");
  console.log("   - Phù hợp cho production backend");
  console.log();

  // ========== PHẦN 5: Demo Tự động ==========
  console.log("=".repeat(60));
  console.log("PHẦN 5: Demo Gas Tự động");
  console.log("=".repeat(60));
  console.log();

  console.log("📝 Gửi transaction với gas tự động:");
  console.log();

  const autoTx = await sender.sendTransaction({
    to: recipient,
    value: ethers.parseEther("0.0001")
    // Không cung cấp gas parameters
  });

  console.log("✅ Transaction đã gửi!");
  console.log("📍 TX Hash:", autoTx.hash);
  console.log();

  console.log("📊 Gas Parameters (tự động):");
  console.log(`   Gas Limit: ${autoTx.gasLimit?.toString() || "N/A"}`);
  console.log(`   Max Fee: ${ethers.formatUnits(autoTx.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(autoTx.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  console.log("⏳ Đang đợi confirmation...");
  const autoReceipt = await autoTx.wait();
  console.log("✅ Confirmed!");
  console.log();

  console.log("📊 Actual Gas Used:");
  console.log(`   ${autoReceipt.gasUsed.toString()} gas`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(autoReceipt.gasPrice, "gwei")} gwei`);
  console.log(`   Total Cost: ${ethers.formatEther(autoReceipt.gasUsed * autoReceipt.gasPrice)} ETH`);
  console.log();

  // ========== PHẦN 6: Demo Manual ==========
  console.log("=".repeat(60));
  console.log("PHẦN 6: Demo Gas Manual");
  console.log("=".repeat(60));
  console.log();

  console.log("📝 Gửi transaction với gas manual:");
  console.log();

  // Estimate trước
  const manualEstimatedGas = await ethers.provider.estimateGas({
    to: recipient,
    value: ethers.parseEther("0.0001")
  });

  // Thêm 20% buffer
  const gasLimit = manualEstimatedGas * 120n / 100n;

  // Lấy fee data
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

  console.log("✅ Transaction đã gửi!");
  console.log("📍 TX Hash:", manualTx.hash);
  console.log();

  console.log("⏳ Đang đợi confirmation...");
  const manualReceipt = await manualTx.wait();
  console.log("✅ Confirmed!");
  console.log();

  console.log("📊 Actual Gas Used:");
  console.log(`   ${manualReceipt.gasUsed.toString()} gas (< ${gasLimit.toString()} limit)`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(manualReceipt.gasPrice, "gwei")} gwei`);
  console.log(`   Total Cost: ${ethers.formatEther(manualReceipt.gasUsed * manualReceipt.gasPrice)} ETH`);
  console.log();

  // ========== TÓM TẮT ==========
  console.log("=".repeat(60));
  console.log("📝 Tóm tắt về Gas");
  console.log("=".repeat(60));
  console.log();

  console.log("✅ Điều cần nhớ:");
  console.log();
  console.log("1. Gas = Computational work");
  console.log("2. Transaction Fee = Gas Used × Gas Price");
  console.log("3. EIP-1559: Base Fee + Priority Fee");
  console.log("4. ETH transfer: 21,000 gas (cố định)");
  console.log("5. ERC20 transfer: ~50,000-65,000 gas");
  console.log("6. Luôn estimate gas trước khi gửi");
  console.log("7. Thêm buffer (10-20%) cho gas limit");
  console.log("8. Frontend: Dùng gas tự động");
  console.log("9. Backend: Có thể dùng manual để optimize");
  console.log();

  console.log("🔗 Tools hữu ích:");
  console.log("   - Etherscan Gas Tracker: https://etherscan.io/gastracker");
  console.log("   - Blocknative Gas Estimator: https://www.blocknative.com/gas-estimator");
  console.log("   - ETH Gas Station: https://ethgasstation.info/");
  console.log();

  console.log("✨ Demo hoàn tất!");
  console.log("   Tiếp theo: npx hardhat run scripts/07-confirmations.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

