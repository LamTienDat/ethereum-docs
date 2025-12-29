/**
 * Ví dụ 3: Gửi ERC20 Token từ Backend
 * 
 * Học cách:
 * - Kết nối với ERC20 contract
 * - Kiểm tra số dư token
 * - Gửi token đến địa chỉ khác
 * - Xử lý decimals của token
 */

require('dotenv').config();
const { ethers } = require('ethers');

// ABI tối thiểu cho ERC20
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

async function sendToken(tokenAddress, toAddress, amount) {
  console.log('=== VÍ DỤ 3: GỬI ERC20 TOKEN ===\n');

  try {
    // 1. Setup wallet
    console.log('📡 Đang kết nối...');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const network = await provider.getNetwork();
    console.log(`✓ Kết nối: ${network.name}\n`);

    // 2. Kết nối với token contract
    console.log('🪙 Đang kết nối với token contract...');
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    // 3. Lấy thông tin token
    console.log('📋 Thông tin token:');
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);

    console.log(`   Tên: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Contract: ${tokenAddress}\n`);

    // 4. Kiểm tra số dư token
    console.log('💰 Kiểm tra số dư token...');
    const balance = await tokenContract.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    const amountInWei = ethers.parseUnits(amount, decimals);

    console.log(`   Số dư hiện tại: ${balanceFormatted} ${symbol}`);
    console.log(`   Số lượng gửi: ${amount} ${symbol}`);

    if (balance < amountInWei) {
      throw new Error(
        `Số dư ${symbol} không đủ! Cần ${amount}, hiện có ${balanceFormatted}`
      );
    }
    console.log('   ✓ Số dư đủ để thực hiện giao dịch\n');

    // 5. Ước tính gas
    console.log('⛽ Ước tính gas...');
    try {
      const gasEstimate = await tokenContract.transfer.estimateGas(
        toAddress,
        amountInWei
      );
      const feeData = await provider.getFeeData();
      const gasCost = gasEstimate * feeData.gasPrice;
      const gasCostInEth = ethers.formatEther(gasCost);

      console.log(`   Gas estimate: ${gasEstimate.toString()}`);
      console.log(`   Gas price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
      console.log(`   Phí gas ước tính: ~${gasCostInEth} ETH\n`);
    } catch (error) {
      console.log('   ⚠️ Không thể ước tính gas chính xác');
      console.log(`   Lỗi: ${error.message}\n`);
    }

    // 6. Thông tin giao dịch
    console.log('📤 Thông tin giao dịch:');
    console.log(`   Từ: ${wallet.address}`);
    console.log(`   Đến: ${toAddress}`);
    console.log(`   Token: ${symbol}`);
    console.log(`   Số lượng: ${amount} ${symbol}\n`);

    // Uncomment để gửi thật
    console.log('⚠️  CẢNH BÁO: Chế độ DRY RUN (không gửi thật)');
    console.log('   Bỏ comment dòng 95-111 để thực hiện giao dịch thật\n');

    /*
    // 7. Gửi token
    console.log('📤 Đang gửi token...');
    const tx = await tokenContract.transfer(toAddress, amountInWei);

    console.log(`✓ Transaction đã gửi!`);
    console.log(`   TX Hash: ${tx.hash}\n`);

    // 8. Chờ confirmation
    console.log('⏳ Đang chờ confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Transaction đã được xác nhận!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? 'SUCCESS ✓' : 'FAILED ✗'}\n`);

    // 9. Kiểm tra số dư mới
    const newBalance = await tokenContract.balanceOf(wallet.address);
    const newBalanceFormatted = ethers.formatUnits(newBalance, decimals);
    console.log(`💰 Số dư ${symbol} mới: ${newBalanceFormatted}\n`);

    return receipt;
    */

  } catch (error) {
    console.error('\n❌ Lỗi khi gửi token:', error.message);
    
    // Xử lý một số lỗi phổ biến
    if (error.message.includes('insufficient funds')) {
      console.error('   → Không đủ ETH để trả phí gas');
    } else if (error.message.includes('execution reverted')) {
      console.error('   → Contract revert - có thể do số dư token không đủ');
    }
    
    throw error;
  }
}

// Chạy chương trình
async function main() {
  // Lấy tham số từ command line
  const tokenAddress = process.argv[2] || process.env.USDT_ADDRESS;
  const recipientAddress = process.argv[3] || process.env.RECIPIENT_ADDRESS;
  const amount = process.argv[4] || '10';

  if (!tokenAddress) {
    console.error('❌ Thiếu địa chỉ token!');
    console.log('\nCách dùng:');
    console.log('  node 03-send-token.js <token_address> <recipient_address> <amount>');
    console.log('\nVí dụ:');
    console.log('  node 03-send-token.js 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 10');
    process.exit(1);
  }

  if (!recipientAddress) {
    console.error('❌ Thiếu địa chỉ người nhận!');
    process.exit(1);
  }

  await sendToken(tokenAddress, recipientAddress, amount);
  console.log('✅ Hoàn thành!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Thất bại!');
    process.exit(1);
  });

