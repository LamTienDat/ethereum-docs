const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Script 7: Demo Confirmations
 * 
 * Mục đích:
 * - Hiểu confirmations là gì
 * - Tại sao cần đợi nhiều confirmations
 * - Re-org attack
 * 
 * Chạy: npx hardhat run scripts/07-confirmations.js --network sepolia
 */

async function main() {
  console.log("✅ Demo: Confirmations\n");
  console.log("=".repeat(60));
  console.log();

  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);
  console.log();

  // ========== PHẦN 1: Confirmations là gì? ==========
  console.log("=".repeat(60));
  console.log("PHẦN 1: Confirmations là gì?");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Định nghĩa:");
  console.log("   Confirmations = Số block được sinh ra SAU block chứa transaction của bạn");
  console.log();

  console.log("📊 Ví dụ:");
  console.log("   - Transaction của bạn ở block 1000");
  console.log("   - Block hiện tại là 1005");
  console.log("   - Confirmations = 1005 - 1000 = 5");
  console.log();

  console.log("🔒 Tại sao cần confirmations?");
  console.log("   - Block mới có thể bị \"re-org\" (reorganization)");
  console.log("   - Re-org = Blockchain bị đảo chiều, block bị loại bỏ");
  console.log("   - Càng nhiều confirmations = Càng khó re-org");
  console.log();

  console.log("📈 Best Practices:");
  console.log("   - Ethereum: 12+ confirmations (~2.5 phút)");
  console.log("   - BSC/Polygon: 64-128 confirmations");
  console.log("   - Giao dịch nhỏ: 1-3 confirmations");
  console.log("   - Giao dịch lớn: 12+ confirmations");
  console.log("   - Exchange deposit: 12-64 confirmations");
  console.log();

  // ========== PHẦN 2: Gửi Transaction ==========
  console.log("=".repeat(60));
  console.log("PHẦN 2: Gửi Transaction và Theo dõi Confirmations");
  console.log("=".repeat(60));
  console.log();

  const recipient = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const amount = ethers.parseEther("0.0001");

  console.log("📝 Transaction:");
  console.log(`   To: ${recipient}`);
  console.log(`   Value: ${ethers.formatEther(amount)} ETH`);
  console.log();

  // Lấy block number hiện tại
  const currentBlockBefore = await ethers.provider.getBlockNumber();
  console.log("📊 Block hiện tại:", currentBlockBefore);
  console.log();

  // Gửi transaction
  console.log("⏳ Đang gửi transaction...");
  const tx = await sender.sendTransaction({
    to: recipient,
    value: amount
  });

  console.log("✅ Transaction đã gửi!");
  console.log("📍 TX Hash:", tx.hash);
  console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
  console.log();

  // ========== PHẦN 3: Đợi 0 Confirmations (Pending) ==========
  console.log("=".repeat(60));
  console.log("PHẦN 3: Transaction Pending (0 confirmations)");
  console.log("=".repeat(60));
  console.log();

  console.log("⏳ Transaction đang ở mempool, chưa được mine...");
  console.log("⚠️ Ở trạng thái này:");
  console.log("   - Transaction có thể bị drop");
  console.log("   - Có thể bị replaced (speed up/cancel)");
  console.log("   - KHÔNG NÊN coi như đã hoàn thành");
  console.log();

  // ========== PHẦN 4: Đợi 1 Confirmation ==========
  console.log("=".repeat(60));
  console.log("PHẦN 4: Đợi 1 Confirmation");
  console.log("=".repeat(60));
  console.log();

  console.log("⏳ Đang đợi transaction được mine...");
  const startTime = Date.now();
  
  const receipt = await tx.wait(1); // Đợi 1 confirmation
  
  const mineTime = Date.now() - startTime;
  console.log(`✅ Transaction đã được mine! (${(mineTime / 1000).toFixed(1)}s)`);
  console.log();

  console.log("📊 Transaction Receipt:");
  console.log(`   Block Number: ${receipt.blockNumber}`);
  console.log(`   Block Hash: ${receipt.blockHash}`);
  console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
  console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  console.log();

  console.log("⚠️ Với 1 confirmation:");
  console.log("   - Transaction đã được mine");
  console.log("   - Nhưng vẫn có khả năng bị re-org (rất thấp)");
  console.log("   - Phù hợp cho: Giao dịch nhỏ, low-risk");
  console.log();

  // ========== PHẦN 5: Đợi Nhiều Confirmations ==========
  console.log("=".repeat(60));
  console.log("PHẦN 5: Đợi Nhiều Confirmations");
  console.log("=".repeat(60));
  console.log();

  const targetConfirmations = 3; // Đợi 3 confirmations
  console.log(`⏳ Đang đợi ${targetConfirmations} confirmations...`);
  console.log();

  let currentConfirmations = 1;
  
  while (currentConfirmations < targetConfirmations) {
    // Đợi block mới
    await new Promise(resolve => setTimeout(resolve, 12000)); // ~12s per block
    
    const currentBlock = await ethers.provider.getBlockNumber();
    currentConfirmations = currentBlock - receipt.blockNumber + 1;
    
    console.log(`   Block ${currentBlock}: ${currentConfirmations}/${targetConfirmations} confirmations`);
  }

  console.log();
  console.log(`✅ Đã đạt ${targetConfirmations} confirmations!`);
  console.log();

  console.log("📊 Thống kê:");
  const finalBlock = await ethers.provider.getBlockNumber();
  console.log(`   Transaction Block: ${receipt.blockNumber}`);
  console.log(`   Current Block: ${finalBlock}`);
  console.log(`   Total Confirmations: ${finalBlock - receipt.blockNumber + 1}`);
  console.log(`   Time Elapsed: ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
  console.log();

  // ========== PHẦN 6: Re-org Attack ==========
  console.log("=".repeat(60));
  console.log("PHẦN 6: Re-org Attack");
  console.log("=".repeat(60));
  console.log();

  console.log("❓ Re-org là gì?");
  console.log();
  console.log("   Blockchain là một chuỗi blocks:");
  console.log("   Block 1 → Block 2 → Block 3 → Block 4");
  console.log();
  console.log("   Nếu có 2 miners cùng lúc mine block 3:");
  console.log("   Block 1 → Block 2 → Block 3A");
  console.log("                     → Block 3B");
  console.log();
  console.log("   Network sẽ chọn chain dài hơn:");
  console.log("   Block 1 → Block 2 → Block 3A → Block 4A (✅ Accepted)");
  console.log("                     → Block 3B (❌ Orphaned)");
  console.log();
  console.log("   Nếu transaction của bạn ở Block 3B → Bị loại bỏ!");
  console.log();

  console.log("🎯 Ví dụ tấn công:");
  console.log();
  console.log("   1. Hacker gửi 100 ETH cho Exchange");
  console.log("   2. Transaction được mine ở block 1000 (1 confirmation)");
  console.log("   3. Exchange thấy 1 confirmation → Cho rút tiền");
  console.log("   4. Hacker rút 100 ETH ra");
  console.log("   5. Hacker mine block 1000 khác (không có transaction gửi tiền)");
  console.log("   6. Nếu block mới của hacker được chấp nhận → Re-org!");
  console.log("   7. Transaction gửi tiền bị hủy, nhưng hacker đã rút được tiền");
  console.log();

  console.log("🛡️ Phòng chống:");
  console.log("   - Đợi nhiều confirmations (12+ cho Ethereum)");
  console.log("   - Giao dịch lớn: Đợi lâu hơn");
  console.log("   - Monitor chain re-orgs");
  console.log("   - Sử dụng finality gadgets (Casper FFG)");
  console.log();

  // ========== PHẦN 7: Best Practices ==========
  console.log("=".repeat(60));
  console.log("PHẦN 7: Best Practices");
  console.log("=".repeat(60));
  console.log();

  console.log("📋 Số confirmations nên đợi:");
  console.log();
  console.log("   Ethereum Mainnet:");
  console.log("   - Giao dịch nhỏ (<$100): 1-3 confirmations");
  console.log("   - Giao dịch trung bình ($100-$10k): 6-12 confirmations");
  console.log("   - Giao dịch lớn (>$10k): 12-64 confirmations");
  console.log("   - Exchange deposit: 12-35 confirmations");
  console.log();

  console.log("   BSC/Polygon:");
  console.log("   - Block time nhanh hơn (3s) → Cần nhiều confirmations hơn");
  console.log("   - Thường: 64-128 confirmations");
  console.log();

  console.log("   Arbitrum/Optimism (Layer 2):");
  console.log("   - Finality chậm hơn (7 days challenge period)");
  console.log("   - Cần đợi finality period");
  console.log();

  console.log("💻 Code Example:");
  console.log();
  console.log("```javascript");
  console.log("// Đợi 12 confirmations");
  console.log("const receipt = await tx.wait(12);");
  console.log("");
  console.log("// Hoặc manual check");
  console.log("const receipt = await tx.wait(1);");
  console.log("while (true) {");
  console.log("  const currentBlock = await provider.getBlockNumber();");
  console.log("  const confirmations = currentBlock - receipt.blockNumber + 1;");
  console.log("  if (confirmations >= 12) break;");
  console.log("  await new Promise(r => setTimeout(r, 12000));");
  console.log("}");
  console.log("```");
  console.log();

  // ========== TÓM TẮT ==========
  console.log("=".repeat(60));
  console.log("📝 Tóm tắt về Confirmations");
  console.log("=".repeat(60));
  console.log();

  console.log("✅ Điều cần nhớ:");
  console.log();
  console.log("1. Confirmations = Số blocks sau block chứa transaction");
  console.log("2. Càng nhiều confirmations = Càng an toàn");
  console.log("3. Re-org có thể xảy ra với ít confirmations");
  console.log("4. Ethereum: 12+ confirmations cho giao dịch lớn");
  console.log("5. Frontend: Có thể show UI sau 1 confirmation");
  console.log("6. Backend: Nên đợi 12+ confirmations trước khi update DB");
  console.log("7. Exchange: Thường yêu cầu 12-64 confirmations");
  console.log();

  console.log("🔗 Resources:");
  console.log("   - Ethereum Finality: https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#finality");
  console.log("   - EIP-1559: https://eips.ethereum.org/EIPS/eip-1559");
  console.log("   - Etherscan: https://sepolia.etherscan.io/");
  console.log();

  console.log("✨ Hoàn thành tất cả demos của Phần 1!");
  console.log();
  console.log("🎉 Chúc mừng! Bạn đã học xong:");
  console.log("   ✅ Chuyển ETH vs ERC20");
  console.log("   ✅ transfer / approve / transferFrom");
  console.log("   ✅ Nonce và stuck transactions");
  console.log("   ✅ Gas estimation và optimization");
  console.log("   ✅ Confirmations và transaction finality");
  console.log();
  console.log("📚 Tiếp theo: Học Phần 2 - Ví, Ký và Xác thực");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

