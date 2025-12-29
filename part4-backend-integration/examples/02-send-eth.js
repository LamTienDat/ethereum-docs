/**
 * Ví dụ 2: Gửi ETH từ Backend
 * 
 * Học cách:
 * - Gửi ETH đến địa chỉ khác
 * - Kiểm tra số dư trước khi gửi
 * - Chờ confirmation
 * - Xử lý lỗi
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function sendETH(toAddress, amountInEther) {
  console.log('=== VÍ DỤ 2: GỬI ETH TỪ BACKEND ===\n');

  try {
    // 1. Setup wallet
    console.log('📡 Đang kết nối...');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const network = await provider.getNetwork();
    console.log(`✓ Kết nối: ${network.name} (Chain ID: ${network.chainId})\n`);

    // 2. Thông tin giao dịch
    console.log('📋 Thông tin giao dịch:');
    console.log(`   Từ: ${wallet.address}`);
    console.log(`   Đến: ${toAddress}`);
    console.log(`   Số lượng: ${amountInEther} ETH\n`);

    // 3. Kiểm tra số dư
    console.log('💰 Kiểm tra số dư...');
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    const amount = ethers.parseEther(amountInEther);

    console.log(`   Số dư hiện tại: ${balanceInEth} ETH`);

    if (balance < amount) {
      throw new Error(`Số dư không đủ! Cần ${amountInEther} ETH, hiện có ${balanceInEth} ETH`);
    }
    console.log('   ✓ Số dư đủ để thực hiện giao dịch\n');

    // 4. Ước tính gas
    console.log('⛽ Ước tính phí gas...');
    const feeData = await provider.getFeeData();
    const gasLimit = 21000; // Gas limit chuẩn cho ETH transfer
    const estimatedGas = gasLimit * feeData.gasPrice;
    const estimatedGasInEth = ethers.formatEther(estimatedGas);
    
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
    console.log(`   Gas Limit: ${gasLimit}`);
    console.log(`   Phí gas ước tính: ~${estimatedGasInEth} ETH\n`);

    // 5. Xác nhận giao dịch
    const totalCost = parseFloat(amountInEther) + parseFloat(estimatedGasInEth);
    console.log(`💡 Tổng chi phí: ~${totalCost.toFixed(6)} ETH (bao gồm gas)\n`);

    // Uncomment dòng dưới để thực sự gửi giao dịch
    // console.log('⚠️  CẢNH BÁO: Đang gửi giao dịch THẬT!');
    // console.log('   Bỏ comment dòng 67-80 trong code để thực hiện\n');
    
    /*
    // 6. Gửi transaction
    console.log('📤 Đang gửi transaction...');
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amount,
    });

    console.log(`✓ Transaction đã gửi!`);
    console.log(`   TX Hash: ${tx.hash}\n`);

    // 7. Chờ confirmation
    console.log('⏳ Đang chờ confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Transaction đã được xác nhận!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}\n`);

    // 8. Kiểm tra số dư mới
    const newBalance = await provider.getBalance(wallet.address);
    const newBalanceInEth = ethers.formatEther(newBalance);
    console.log(`💰 Số dư mới: ${newBalanceInEth} ETH`);
    
    return receipt;
    */

    console.log('ℹ️  Đây là chế độ DRY RUN (không gửi giao dịch thật)');
    console.log('   Để gửi thật, bỏ comment phần code từ dòng 60-87\n');
    
  } catch (error) {
    console.error('\n❌ Lỗi khi gửi ETH:', error.message);
    throw error;
  }
}

// Chạy chương trình
const recipientAddress = process.env.RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const amount = process.argv[2] || '0.001'; // Lấy từ command line hoặc dùng mặc định

sendETH(recipientAddress, amount)
  .then(() => {
    console.log('✅ Hoàn thành!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Thất bại!');
    process.exit(1);
  });

// Sử dụng:
// node 02-send-eth.js 0.01

