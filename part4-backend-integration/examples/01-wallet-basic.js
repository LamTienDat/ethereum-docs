/**
 * Ví dụ 1: Tạo và quản lý Wallet cơ bản
 * 
 * Học cách:
 * - Tạo wallet từ private key
 * - Kiểm tra địa chỉ và số dư
 * - Kết nối wallet với provider
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('=== VÍ DỤ 1: WALLET CỞ BẢN ===\n');

  // 1. Kết nối qua RPC Provider
  console.log('📡 Đang kết nối tới RPC Provider...');
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log('✓ Kết nối thành công!');
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})\n`);
  } catch (error) {
    console.error('✗ Lỗi kết nối:', error.message);
    process.exit(1);
  }

  // 2. Tạo wallet từ private key
  console.log('🔐 Đang tạo wallet từ private key...');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('✓ Wallet đã được tạo!');
  console.log(`   Address: ${wallet.address}\n`);

  // 3. Kiểm tra số dư ETH
  console.log('💰 Đang kiểm tra số dư...');
  try {
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`✓ Số dư ETH: ${balanceInEth} ETH`);
    console.log(`   (Wei: ${balance.toString()})\n`);
  } catch (error) {
    console.error('✗ Lỗi khi lấy số dư:', error.message);
  }

  // 4. Lấy thông tin block hiện tại
  console.log('⛓️  Thông tin blockchain:');
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`   Block hiện tại: ${blockNumber}`);
    
    const feeData = await provider.getFeeData();
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
  } catch (error) {
    console.error('✗ Lỗi khi lấy thông tin block:', error.message);
  }

  // 5. Lấy transaction count (nonce)
  console.log('\n📊 Thông tin wallet:');
  try {
    const txCount = await provider.getTransactionCount(wallet.address);
    console.log(`   Transaction count: ${txCount}`);
    console.log(`   (Số giao dịch đã gửi từ wallet này)\n`);
  } catch (error) {
    console.error('✗ Lỗi khi lấy transaction count:', error.message);
  }

  console.log('✅ Hoàn thành!');
}

// Chạy chương trình
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  });

