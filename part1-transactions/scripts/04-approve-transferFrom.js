const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Script 4: Demo approve() và transferFrom()
 * 
 * Mục đích:
 * - Hiểu flow của approve/transferFrom
 * - Use case: DEX, Payment Gateway, Staking
 * - Kiểm tra allowance
 * 
 * Chạy: npx hardhat run scripts/04-approve-transferFrom.js --network sepolia
 */

async function main() {
  console.log("🔐 Demo: approve() và transferFrom()\n");
  console.log("=".repeat(60));
  console.log();

  // Đọc địa chỉ contract
  let contractAddress;
  try {
    const deployedInfo = fs.readFileSync("deployed-address.txt", "utf8");
    const match = deployedInfo.match(/Contract Address: (0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    } else {
      throw new Error("Không tìm thấy contract address");
    }
  } catch (error) {
    console.log("❌ Chưa deploy contract!");
    console.log("   Vui lòng chạy: npx hardhat run scripts/01-deploy.js --network sepolia");
    return;
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log();

  // Kết nối với contract
  const [owner] = await ethers.getSigners();
  const token = await ethers.getContractAt("SimpleERC20", contractAddress);

  // Lấy thông tin token
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  console.log("🪙 Token:", symbol);
  console.log();

  // Scenario: Owner approve cho một địa chỉ khác (giả lập DEX/Gateway)
  const spenderAddress = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  
  console.log("📖 Scenario:");
  console.log("   Owner (bạn) muốn cho phép Spender (DEX/Gateway) được quyền");
  console.log("   rút tối đa 500 token từ ví của bạn.");
  console.log();
  console.log("👤 Owner:", owner.address);
  console.log("👤 Spender:", spenderAddress);
  console.log();

  // Kiểm tra số dư
  const ownerBalance = await token.balanceOf(owner.address);
  console.log("💰 Số dư Owner:", ethers.formatUnits(ownerBalance, decimals), symbol);
  console.log();

  // Kiểm tra allowance hiện tại
  console.log("🔍 Kiểm tra allowance hiện tại:");
  const currentAllowance = await token.allowance(owner.address, spenderAddress);
  console.log(`   Allowance: ${ethers.formatUnits(currentAllowance, decimals)} ${symbol}`);
  console.log();

  // ========== BƯỚC 1: APPROVE ==========
  console.log("=" .repeat(60));
  console.log("BƯỚC 1: Owner approve cho Spender");
  console.log("=".repeat(60));
  console.log();

  const approveAmount = ethers.parseUnits("500", decimals); // 500 tokens
  console.log("💰 Approve amount:", ethers.formatUnits(approveAmount, decimals), symbol);
  console.log();

  // Estimate gas
  const estimatedGasApprove = await token.approve.estimateGas(spenderAddress, approveAmount);
  console.log("📊 Estimated Gas:", estimatedGasApprove.toString());
  console.log();

  // Gửi approve transaction
  console.log("⏳ Đang gửi approve transaction...");
  const approveTx = await token.approve(spenderAddress, approveAmount);
  console.log("✅ Approve transaction đã gửi!");
  console.log("📍 TX Hash:", approveTx.hash);
  console.log();

  // Đợi confirm
  console.log("⏳ Đang đợi confirmation...");
  const approveReceipt = await approveTx.wait();
  console.log("✅ Approve đã được confirm!");
  console.log(`   Gas Used: ${approveReceipt.gasUsed.toString()}`);
  console.log();

  // Parse Approval event
  for (const log of approveReceipt.logs) {
    try {
      const parsedLog = token.interface.parseLog({
        topics: [...log.topics],
        data: log.data
      });
      
      if (parsedLog && parsedLog.name === "Approval") {
        console.log("📡 Event: Approval");
        console.log(`   - Owner: ${parsedLog.args.owner}`);
        console.log(`   - Spender: ${parsedLog.args.spender}`);
        console.log(`   - Value: ${ethers.formatUnits(parsedLog.args.value, decimals)} ${symbol}`);
      }
    } catch (e) {}
  }
  console.log();

  // Kiểm tra allowance sau approve
  const newAllowance = await token.allowance(owner.address, spenderAddress);
  console.log("🔍 Allowance sau approve:");
  console.log(`   ${ethers.formatUnits(newAllowance, decimals)} ${symbol}`);
  console.log();

  // ========== BƯỚC 2: TRANSFER FROM (Giả lập) ==========
  console.log("=".repeat(60));
  console.log("BƯỚC 2: Spender sử dụng transferFrom()");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Lưu ý:");
  console.log("   Trong thực tế, Spender (DEX/Gateway) sẽ gọi transferFrom()");
  console.log("   Ở đây chúng ta giả lập bằng cách Owner tự gọi transferFrom()");
  console.log("   (vì chúng ta chỉ có 1 ví test)");
  console.log();

  // Số lượng muốn transfer
  const transferAmount = ethers.parseUnits("100", decimals); // 100 tokens
  console.log("💰 Transfer amount:", ethers.formatUnits(transferAmount, decimals), symbol);
  console.log();

  // Địa chỉ nhận (có thể là exchange, staking pool, etc.)
  const recipientAddress = spenderAddress; // Trong thực tế có thể là địa chỉ khác

  console.log("📊 Trước transferFrom:");
  const ownerBalanceBefore = await token.balanceOf(owner.address);
  const recipientBalanceBefore = await token.balanceOf(recipientAddress);
  const allowanceBefore = await token.allowance(owner.address, owner.address);
  
  console.log(`   Owner balance: ${ethers.formatUnits(ownerBalanceBefore, decimals)} ${symbol}`);
  console.log(`   Recipient balance: ${ethers.formatUnits(recipientBalanceBefore, decimals)} ${symbol}`);
  console.log(`   Allowance: ${ethers.formatUnits(newAllowance, decimals)} ${symbol}`);
  console.log();

  // Estimate gas
  const estimatedGasTransferFrom = await token.transferFrom.estimateGas(
    owner.address,
    recipientAddress,
    transferAmount
  );
  console.log("📊 Estimated Gas:", estimatedGasTransferFrom.toString());
  console.log();

  // Gửi transferFrom transaction
  console.log("⏳ Đang gửi transferFrom transaction...");
  const transferFromTx = await token.transferFrom(
    owner.address,
    recipientAddress,
    transferAmount
  );
  console.log("✅ TransferFrom transaction đã gửi!");
  console.log("📍 TX Hash:", transferFromTx.hash);
  console.log();

  // Đợi confirm
  console.log("⏳ Đang đợi confirmation...");
  const transferFromReceipt = await transferFromTx.wait();
  console.log("✅ TransferFrom đã được confirm!");
  console.log(`   Gas Used: ${transferFromReceipt.gasUsed.toString()}`);
  console.log();

  // Parse Transfer event
  for (const log of transferFromReceipt.logs) {
    try {
      const parsedLog = token.interface.parseLog({
        topics: [...log.topics],
        data: log.data
      });
      
      if (parsedLog && parsedLog.name === "Transfer") {
        console.log("📡 Event: Transfer");
        console.log(`   - From: ${parsedLog.args.from}`);
        console.log(`   - To: ${parsedLog.args.to}`);
        console.log(`   - Value: ${ethers.formatUnits(parsedLog.args.value, decimals)} ${symbol}`);
      }
    } catch (e) {}
  }
  console.log();

  // Kiểm tra sau transferFrom
  console.log("📊 Sau transferFrom:");
  const ownerBalanceAfter = await token.balanceOf(owner.address);
  const recipientBalanceAfter = await token.balanceOf(recipientAddress);
  const allowanceAfter = await token.allowance(owner.address, owner.address);
  
  console.log(`   Owner balance: ${ethers.formatUnits(ownerBalanceAfter, decimals)} ${symbol}`);
  console.log(`   Recipient balance: ${ethers.formatUnits(recipientBalanceAfter, decimals)} ${symbol}`);
  console.log(`   Allowance còn lại: ${ethers.formatUnits(allowanceAfter, decimals)} ${symbol}`);
  console.log();

  // Tính toán thay đổi
  console.log("📈 Thay đổi:");
  console.log(`   Owner: -${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
  console.log(`   Recipient: +${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
  console.log(`   Allowance: -${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
  console.log();

  // ========== GIẢI THÍCH ==========
  console.log("=".repeat(60));
  console.log("💡 Giải thích Flow");
  console.log("=".repeat(60));
  console.log();

  console.log("1️⃣ approve(spender, amount):");
  console.log("   - Owner cho phép Spender được quyền rút tối đa 'amount' token");
  console.log("   - Lưu vào mapping: allowance[owner][spender] = amount");
  console.log("   - Emit event: Approval(owner, spender, amount)");
  console.log();

  console.log("2️⃣ transferFrom(from, to, amount):");
  console.log("   - Spender gọi hàm này để rút token từ Owner");
  console.log("   - Kiểm tra: allowance[from][msg.sender] >= amount");
  console.log("   - Kiểm tra: balanceOf[from] >= amount");
  console.log("   - Trừ allowance: allowance[from][msg.sender] -= amount");
  console.log("   - Chuyển token: from -> to");
  console.log("   - Emit event: Transfer(from, to, amount)");
  console.log();

  console.log("🎯 Use Cases thực tế:");
  console.log();
  console.log("   📊 DEX (Uniswap, PancakeSwap):");
  console.log("      - User approve cho DEX contract");
  console.log("      - Khi swap, DEX gọi transferFrom() để lấy token");
  console.log();
  console.log("   💳 Payment Gateway:");
  console.log("      - User approve cho gateway");
  console.log("      - Khi thanh toán, gateway tự động trừ tiền");
  console.log();
  console.log("   🏦 Staking:");
  console.log("      - User approve cho staking contract");
  console.log("      - Contract rút token để stake");
  console.log();
  console.log("   🎮 GameFi:");
  console.log("      - User approve cho game contract");
  console.log("      - Game tự động trừ tiền khi mua item");
  console.log();

  console.log("⚠️ Lưu ý bảo mật:");
  console.log("   - Chỉ approve cho contracts đã được audit");
  console.log("   - Không approve unlimited (type(uint256).max) nếu không tin tưởng");
  console.log("   - Có thể revoke bằng cách approve(spender, 0)");
  console.log("   - Check allowance trước khi approve thêm (tránh front-running)");
  console.log();

  console.log("✨ Demo hoàn tất!");
  console.log("   Tiếp theo: npx hardhat run scripts/05-nonce-demo.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

