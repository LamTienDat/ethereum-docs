const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Script 2: Demo chuyển ETH (Native Token)
 * 
 * Mục đích:
 * - Hiểu cơ chế chuyển native token (ETH)
 * - Quan sát gas cost (~21,000 gas)
 * - Xem transaction receipt và confirmations
 * 
 * Chạy: npx hardhat run scripts/02-transfer-eth.js --network sepolia
 */

async function main() {
  console.log("💸 Demo: Chuyển ETH (Native Token)\n");
  console.log("=".repeat(60));
  console.log();

  // Lấy signer
  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);

  // Địa chỉ nhận (có thể thay đổi trong .env)
  const recipientAddress = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  console.log("👤 Recipient:", recipientAddress);
  console.log();

  // Kiểm tra số dư trước khi chuyển
  console.log("📊 Số dư TRƯỚC khi chuyển:");
  const senderBalanceBefore = await ethers.provider.getBalance(sender.address);
  const recipientBalanceBefore = await ethers.provider.getBalance(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatEther(senderBalanceBefore)} ETH`);
  console.log(`   Recipient: ${ethers.formatEther(recipientBalanceBefore)} ETH`);
  console.log();

  // Số tiền muốn chuyển
  const amountToSend = ethers.parseEther("0.001"); // 0.001 ETH
  console.log("💰 Số tiền chuyển:", ethers.formatEther(amountToSend), "ETH");
  console.log();

  // Lấy thông tin gas hiện tại
  console.log("⛽ Thông tin Gas:");
  const feeData = await ethers.provider.getFeeData();
  console.log(`   Max Fee Per Gas: ${ethers.formatUnits(feeData.maxFeePerGas || 0n, "gwei")} gwei`);
  console.log(`   Max Priority Fee: ${ethers.formatUnits(feeData.maxPriorityFeePerGas || 0n, "gwei")} gwei`);
  console.log();

  // Estimate gas cho ETH transfer
  const estimatedGas = 21000n; // ETH transfer luôn là 21,000 gas
  console.log("📊 Gas Estimation:");
  console.log(`   Estimated Gas: ${estimatedGas.toString()} gas`);
  
  // Tính phí dự kiến
  const estimatedCost = estimatedGas * (feeData.maxFeePerGas || 0n);
  console.log(`   Estimated Cost: ${ethers.formatEther(estimatedCost)} ETH`);
  console.log();

  // Xác nhận
  console.log("⏳ Đang gửi transaction...");
  
  // Gửi ETH
  const tx = await sender.sendTransaction({
    to: recipientAddress,
    value: amountToSend,
    // Gas sẽ được estimate tự động nếu không cung cấp
  });

  console.log("✅ Transaction đã gửi!");
  console.log("📍 Transaction Hash:", tx.hash);
  console.log(`🔗 Xem trên Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log();

  // Đợi transaction được mine
  console.log("⏳ Đang đợi transaction được mine...");
  const receipt = await tx.wait();
  
  console.log("✅ Transaction đã được confirm!");
  console.log();

  // Thông tin transaction receipt
  console.log("📊 Transaction Receipt:");
  console.log(`   Block Number: ${receipt.blockNumber}`);
  console.log(`   Block Hash: ${receipt.blockHash}`);
  console.log(`   Gas Used: ${receipt.gasUsed.toString()} gas`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
  
  // Tính phí thực tế
  const actualCost = receipt.gasUsed * receipt.gasPrice;
  console.log(`   Transaction Fee: ${ethers.formatEther(actualCost)} ETH`);
  console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  console.log();

  // Kiểm tra số dư sau khi chuyển
  console.log("📊 Số dư SAU khi chuyển:");
  const senderBalanceAfter = await ethers.provider.getBalance(sender.address);
  const recipientBalanceAfter = await ethers.provider.getBalance(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatEther(senderBalanceAfter)} ETH`);
  console.log(`   Recipient: ${ethers.formatEther(recipientBalanceAfter)} ETH`);
  console.log();

  // Tính toán thay đổi
  console.log("📈 Thay đổi:");
  const senderChange = senderBalanceAfter - senderBalanceBefore;
  const recipientChange = recipientBalanceAfter - recipientBalanceBefore;
  
  console.log(`   Sender: ${ethers.formatEther(senderChange)} ETH`);
  console.log(`   Recipient: ${ethers.formatEther(recipientChange)} ETH`);
  console.log();

  // Giải thích
  console.log("💡 Giải thích:");
  console.log(`   - Sender mất: ${ethers.formatEther(amountToSend)} ETH (chuyển) + ${ethers.formatEther(actualCost)} ETH (gas fee)`);
  console.log(`   - Tổng mất: ${ethers.formatEther(amountToSend + actualCost)} ETH`);
  console.log(`   - Recipient nhận: ${ethers.formatEther(recipientChange)} ETH`);
  console.log(`   - Gas cho ETH transfer: Luôn là 21,000 gas (cố định)`);
  console.log();

  // So sánh với ERC20
  console.log("📊 So sánh ETH vs ERC20:");
  console.log("   ETH Transfer:");
  console.log("   - Gas: ~21,000 (cố định)");
  console.log("   - Cơ chế: Protocol level");
  console.log("   - Tốc độ: Nhanh nhất");
  console.log();
  console.log("   ERC20 Transfer:");
  console.log("   - Gas: ~50,000-65,000 (tùy contract)");
  console.log("   - Cơ chế: Smart contract");
  console.log("   - Tốc độ: Chậm hơn (phải execute code)");
  console.log();

  console.log("✨ Demo hoàn tất!");
  console.log("   Tiếp theo: npx hardhat run scripts/03-transfer-erc20.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

