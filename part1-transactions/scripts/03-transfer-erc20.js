const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Script 3: Demo transfer ERC20 Token
 * 
 * Mục đích:
 * - Hiểu cách gọi hàm transfer() của ERC20
 * - Quan sát gas cost (~50,000-65,000 gas)
 * - So sánh với ETH transfer
 * 
 * Chạy: npx hardhat run scripts/03-transfer-erc20.js --network sepolia
 */

async function main() {
  console.log("🪙 Demo: Transfer ERC20 Token\n");
  console.log("=".repeat(60));
  console.log();

  // Đọc địa chỉ contract đã deploy
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
  const [sender] = await ethers.getSigners();
  const token = await ethers.getContractAt("SimpleERC20", contractAddress);

  // Lấy thông tin token
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  console.log("🪙 Token Info:");
  console.log(`   Name: ${name}`);
  console.log(`   Symbol: ${symbol}`);
  console.log(`   Decimals: ${decimals}`);
  console.log();

  // Địa chỉ nhận
  const recipientAddress = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  console.log("👤 Sender:", sender.address);
  console.log("👤 Recipient:", recipientAddress);
  console.log();

  // Kiểm tra số dư token trước khi chuyển
  console.log("📊 Số dư Token TRƯỚC khi chuyển:");
  const senderBalanceBefore = await token.balanceOf(sender.address);
  const recipientBalanceBefore = await token.balanceOf(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatUnits(senderBalanceBefore, decimals)} ${symbol}`);
  console.log(`   Recipient: ${ethers.formatUnits(recipientBalanceBefore, decimals)} ${symbol}`);
  console.log();

  // Kiểm tra số dư ETH (để trả gas)
  const ethBalance = await ethers.provider.getBalance(sender.address);
  console.log("💰 Số dư ETH (để trả gas):", ethers.formatEther(ethBalance), "ETH");
  console.log();

  // Số lượng token muốn chuyển
  const amountToSend = ethers.parseUnits("100", decimals); // 100 tokens
  console.log("💰 Số lượng chuyển:", ethers.formatUnits(amountToSend, decimals), symbol);
  console.log();

  // Kiểm tra đủ số dư không
  if (senderBalanceBefore < amountToSend) {
    console.log("❌ Không đủ token để chuyển!");
    return;
  }

  // Estimate gas cho transfer
  console.log("⏳ Đang estimate gas...");
  const estimatedGas = await token.transfer.estimateGas(recipientAddress, amountToSend);
  console.log(`📊 Estimated Gas: ${estimatedGas.toString()} gas`);
  
  // Lấy gas price
  const feeData = await ethers.provider.getFeeData();
  const estimatedCost = estimatedGas * (feeData.maxFeePerGas || 0n);
  console.log(`💸 Estimated Cost: ${ethers.formatEther(estimatedCost)} ETH`);
  console.log();

  // Gửi transaction
  console.log("⏳ Đang gửi transaction...");
  const tx = await token.transfer(recipientAddress, amountToSend);

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
  console.log(`   Gas Used: ${receipt.gasUsed.toString()} gas`);
  console.log(`   Effective Gas Price: ${ethers.formatUnits(receipt.gasPrice, "gwei")} gwei`);
  
  // Tính phí thực tế
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

  // Kiểm tra số dư sau khi chuyển
  console.log("📊 Số dư Token SAU khi chuyển:");
  const senderBalanceAfter = await token.balanceOf(sender.address);
  const recipientBalanceAfter = await token.balanceOf(recipientAddress);
  
  console.log(`   Sender: ${ethers.formatUnits(senderBalanceAfter, decimals)} ${symbol}`);
  console.log(`   Recipient: ${ethers.formatUnits(recipientBalanceAfter, decimals)} ${symbol}`);
  console.log();

  // Tính toán thay đổi
  console.log("📈 Thay đổi Token:");
  const senderChange = senderBalanceAfter - senderBalanceBefore;
  const recipientChange = recipientBalanceAfter - recipientBalanceBefore;
  
  console.log(`   Sender: ${ethers.formatUnits(senderChange, decimals)} ${symbol}`);
  console.log(`   Recipient: ${ethers.formatUnits(recipientChange, decimals)} ${symbol}`);
  console.log();

  // So sánh ETH vs ERC20
  console.log("📊 So sánh ETH Transfer vs ERC20 Transfer:");
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

  // Giải thích
  console.log("💡 Tại sao ERC20 tốn gas hơn?");
  console.log("   1. Phải load contract code từ blockchain");
  console.log("   2. Phải execute Solidity code (checks, math, storage updates)");
  console.log("   3. Phải update mapping (storage writes expensive)");
  console.log("   4. Phải emit events");
  console.log();
  console.log("   ETH transfer chỉ cần:");
  console.log("   - Update balance của 2 địa chỉ (built-in)");
  console.log("   - Không có code execution");
  console.log();

  console.log("✨ Demo hoàn tất!");
  console.log("   Tiếp theo: npx hardhat run scripts/04-approve-transferFrom.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

