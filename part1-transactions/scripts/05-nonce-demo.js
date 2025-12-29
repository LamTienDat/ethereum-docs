const { ethers } = require("hardhat");
require("dotenv").config();

/**
 * Script 5: Demo Nonce
 * 
 * Mục đích:
 * - Hiểu Nonce là gì và tại sao quan trọng
 * - Xử lý stuck transaction
 * - Gửi nhiều transactions song song
 * 
 * Chạy: npx hardhat run scripts/05-nonce-demo.js --network sepolia
 */

async function main() {
  console.log("🔢 Demo: Nonce (Number Only Used Once)\n");
  console.log("=".repeat(60));
  console.log();

  const [sender] = await ethers.getSigners();
  console.log("👤 Sender:", sender.address);
  console.log();

  // ========== PHẦN 1: Hiểu Nonce ==========
  console.log("=".repeat(60));
  console.log("PHẦN 1: Nonce là gì?");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Định nghĩa:");
  console.log("   Nonce = Number Only Used Once");
  console.log("   Là số thứ tự của transaction từ một địa chỉ (bắt đầu từ 0)");
  console.log();

  // Lấy nonce hiện tại
  const currentNonce = await ethers.provider.getTransactionCount(sender.address);
  console.log("📊 Nonce hiện tại:", currentNonce);
  console.log();

  console.log("📖 Giải thích:");
  console.log(`   - Đây là transaction thứ ${currentNonce + 1} từ địa chỉ này`);
  console.log("   - Transaction với nonce 0 phải được mine trước nonce 1");
  console.log("   - Không thể skip nonce (nonce 0 -> 2 sẽ bị reject)");
  console.log("   - Nonce giúp chống replay attack");
  console.log();

  // ========== PHẦN 2: Gửi transactions tuần tự ==========
  console.log("=".repeat(60));
  console.log("PHẦN 2: Gửi transactions tuần tự (Sequential)");
  console.log("=".repeat(60));
  console.log();

  const recipient = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  const amount = ethers.parseEther("0.0001"); // 0.0001 ETH

  console.log("📝 Gửi 3 transactions tuần tự:");
  console.log();

  for (let i = 0; i < 3; i++) {
    const nonce = await ethers.provider.getTransactionCount(sender.address);
    console.log(`Transaction ${i + 1}:`);
    console.log(`   Nonce: ${nonce}`);
    
    const tx = await sender.sendTransaction({
      to: recipient,
      value: amount,
      nonce: nonce // Tự động lấy nonce
    });
    
    console.log(`   TX Hash: ${tx.hash}`);
    console.log(`   Status: Đã gửi, đang chờ mine...`);
    
    // Đợi transaction được mine
    await tx.wait();
    console.log(`   Status: ✅ Đã mine!`);
    console.log();
  }

  console.log("✅ Tất cả transactions đã được mine theo thứ tự!");
  console.log();

  // ========== PHẦN 3: Gửi transactions song song ==========
  console.log("=".repeat(60));
  console.log("PHẦN 3: Gửi transactions song song (Parallel)");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Kỹ thuật:");
  console.log("   Để gửi nhiều transactions cùng lúc, phải tự quản lý nonce");
  console.log("   Nếu không, tất cả sẽ dùng cùng nonce và bị conflict!");
  console.log();

  const startNonce = await ethers.provider.getTransactionCount(sender.address);
  console.log("📊 Starting nonce:", startNonce);
  console.log();

  console.log("📝 Gửi 3 transactions song song:");
  console.log();

  const txPromises = [];
  for (let i = 0; i < 3; i++) {
    const nonce = startNonce + i; // Tự tăng nonce
    console.log(`Transaction ${i + 1}:`);
    console.log(`   Nonce: ${nonce}`);
    
    const txPromise = sender.sendTransaction({
      to: recipient,
      value: amount,
      nonce: nonce // Chỉ định nonce cụ thể
    });
    
    txPromises.push(txPromise);
    
    txPromise.then(tx => {
      console.log(`   TX Hash: ${tx.hash}`);
    });
  }

  console.log();
  console.log("⏳ Đang đợi tất cả transactions được gửi...");
  const txs = await Promise.all(txPromises);
  console.log("✅ Đã gửi tất cả transactions!");
  console.log();

  console.log("⏳ Đang đợi tất cả transactions được mine...");
  const receipts = await Promise.all(txs.map(tx => tx.wait()));
  console.log("✅ Tất cả transactions đã được mine!");
  console.log();

  receipts.forEach((receipt, i) => {
    console.log(`Transaction ${i + 1}:`);
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Status: ${receipt.status === 1 ? "✅ Success" : "❌ Failed"}`);
  });
  console.log();

  // ========== PHẦN 4: Stuck Transaction ==========
  console.log("=".repeat(60));
  console.log("PHẦN 4: Xử lý Stuck Transaction");
  console.log("=".repeat(60));
  console.log();

  console.log("❓ Khi nào transaction bị stuck?");
  console.log("   - Gas price quá thấp");
  console.log("   - Network congestion");
  console.log("   - Nonce bị conflict");
  console.log();

  console.log("🔧 Cách fix:");
  console.log();

  console.log("1️⃣ Speed Up (Tăng gas price):");
  console.log("   - Gửi lại transaction với CÙNG nonce");
  console.log("   - Nhưng gas price CAO HƠN");
  console.log("   - Transaction mới sẽ thay thế transaction cũ");
  console.log();

  console.log("2️⃣ Cancel (Hủy transaction):");
  console.log("   - Gửi transaction 0 ETH đến chính mình");
  console.log("   - Với CÙNG nonce");
  console.log("   - Gas price CAO HƠN");
  console.log();

  console.log("📝 Demo: Speed Up");
  console.log();

  // Gửi transaction với gas price thấp (có thể bị stuck)
  const lowGasTx = await sender.sendTransaction({
    to: recipient,
    value: amount,
    maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"), // Rất thấp
    maxFeePerGas: ethers.parseUnits("20", "gwei")
  });

  console.log("📍 Original TX Hash:", lowGasTx.hash);
  console.log("   Nonce:", lowGasTx.nonce);
  console.log("   Gas Price: Thấp (có thể bị stuck)");
  console.log();

  console.log("⏳ Đợi 5 giây...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Kiểm tra xem đã được mine chưa
  const receipt = await ethers.provider.getTransactionReceipt(lowGasTx.hash);
  
  if (!receipt) {
    console.log("⚠️ Transaction chưa được mine! Đang stuck...");
    console.log();
    console.log("🔧 Thực hiện Speed Up:");
    
    // Lấy gas price cao hơn
    const feeData = await ethers.provider.getFeeData();
    const higherMaxPriorityFee = (feeData.maxPriorityFeePerGas || 0n) * 2n; // Gấp đôi
    const higherMaxFee = (feeData.maxFeePerGas || 0n) * 2n;
    
    // Gửi lại với cùng nonce nhưng gas cao hơn
    const speedUpTx = await sender.sendTransaction({
      to: recipient,
      value: amount,
      nonce: lowGasTx.nonce, // CÙNG nonce
      maxPriorityFeePerGas: higherMaxPriorityFee,
      maxFeePerGas: higherMaxFee
    });
    
    console.log("📍 Speed Up TX Hash:", speedUpTx.hash);
    console.log("   Nonce:", speedUpTx.nonce, "(giống original)");
    console.log("   Gas Price: Cao hơn");
    console.log();
    
    console.log("⏳ Đợi speed up transaction...");
    const speedUpReceipt = await speedUpTx.wait();
    console.log("✅ Speed up transaction đã được mine!");
    console.log("   Block:", speedUpReceipt.blockNumber);
    console.log();
    
    console.log("💡 Kết quả:");
    console.log("   - Transaction cũ bị thay thế (replaced)");
    console.log("   - Transaction mới được mine");
    console.log("   - Chỉ 1 trong 2 transactions được thực thi");
  } else {
    console.log("✅ Transaction đã được mine (không bị stuck)");
    console.log("   Block:", receipt.blockNumber);
  }
  console.log();

  // ========== TÓM TẮT ==========
  console.log("=".repeat(60));
  console.log("📝 Tóm tắt về Nonce");
  console.log("=".repeat(60));
  console.log();

  console.log("✅ Điều cần nhớ:");
  console.log();
  console.log("1. Nonce là số thứ tự transaction (bắt đầu từ 0)");
  console.log("2. Transactions phải được mine theo thứ tự nonce");
  console.log("3. Không thể skip nonce");
  console.log("4. Để gửi parallel transactions, phải tự quản lý nonce");
  console.log("5. Stuck transaction có thể fix bằng cách:");
  console.log("   - Speed up: Gửi lại với cùng nonce, gas cao hơn");
  console.log("   - Cancel: Gửi 0 ETH cho chính mình, cùng nonce, gas cao hơn");
  console.log();

  console.log("🔗 Tools hữu ích:");
  console.log("   - Etherscan: Xem pending transactions");
  console.log("   - MetaMask: Speed up / Cancel transactions");
  console.log("   - Blocknative: Gas price estimator");
  console.log();

  console.log("✨ Demo hoàn tất!");
  console.log("   Tiếp theo: npx hardhat run scripts/06-gas-estimation.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

