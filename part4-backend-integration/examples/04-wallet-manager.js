/**
 * Ví dụ 4: Sử dụng WalletManager Class
 * 
 * Demo các tính năng của WalletManager:
 * - Quản lý wallet chuyên nghiệp
 * - Kiểm tra số dư ETH và Token
 * - Gửi ETH và Token
 * - Ước tính gas
 */

require('dotenv').config();
const WalletManager = require('../src/WalletManager');

async function main() {
  console.log('=== VÍ DỤ 4: WALLET MANAGER CLASS ===\n');

  try {
    // 1. Khởi tạo WalletManager
    console.log('🔧 Đang khởi tạo WalletManager...');
    const walletManager = new WalletManager(
      process.env.RPC_URL,
      process.env.PRIVATE_KEY
    );
    console.log(`✓ Wallet Address: ${walletManager.getAddress()}\n`);

    // 2. Lấy thông tin network
    console.log('🌐 Thông tin Network:');
    const network = await walletManager.getNetwork();
    console.log(`   Name: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}\n`);

    // 3. Kiểm tra số dư ETH
    console.log('💰 Số dư ETH:');
    const ethBalance = await walletManager.getBalance();
    console.log(`   ${ethBalance} ETH\n`);

    // 4. Lấy thông tin gas
    console.log('⛽ Thông tin Gas:');
    const feeData = await walletManager.getFeeData();
    console.log(`   Gas Price: ${feeData.gasPrice}`);
    if (feeData.maxFeePerGas) {
      console.log(`   Max Fee: ${feeData.maxFeePerGas}`);
      console.log(`   Priority Fee: ${feeData.maxPriorityFeePerGas}`);
    }
    console.log();

    // 5. Lấy block number
    console.log('⛓️  Blockchain Info:');
    const blockNumber = await walletManager.getBlockNumber();
    console.log(`   Current Block: ${blockNumber}`);
    
    const txCount = await walletManager.getTransactionCount();
    console.log(`   Transaction Count: ${txCount}\n`);

    // 6. Kiểm tra số dư Token (nếu có)
    const tokenAddress = process.env.USDT_ADDRESS;
    if (tokenAddress && WalletManager.isValidAddress(tokenAddress)) {
      console.log('🪙 Thông tin Token:');
      try {
        const tokenInfo = await walletManager.getTokenInfo(tokenAddress);
        console.log(`   Name: ${tokenInfo.name}`);
        console.log(`   Symbol: ${tokenInfo.symbol}`);
        console.log(`   Decimals: ${tokenInfo.decimals}`);

        const tokenBalance = await walletManager.getTokenBalance(tokenAddress);
        console.log(`   Balance: ${tokenBalance.balance} ${tokenBalance.symbol}\n`);
      } catch (error) {
        console.log(`   ⚠️ Không thể lấy thông tin token: ${error.message}\n`);
      }
    }

    // 7. Ước tính gas cho ETH transfer
    console.log('📊 Ước tính Gas cho ETH Transfer:');
    const recipientAddress = process.env.RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const gasEstimate = await walletManager.estimateGas(
      recipientAddress,
      ethers.parseEther('0.001')
    );
    console.log(`   Gas Limit: ${gasEstimate.gasLimit}`);
    console.log(`   Gas Price: ${gasEstimate.gasPrice}`);
    console.log(`   Estimated Cost: ${gasEstimate.estimatedCost}\n`);

    // 8. Demo Sign Message
    console.log('✍️  Sign Message:');
    const message = 'Hello from WalletManager!';
    const signature = await walletManager.signMessage(message);
    console.log(`   Message: "${message}"`);
    console.log(`   Signature: ${signature.substring(0, 20)}...`);
    
    // Verify signature
    const recoveredAddress = walletManager.verifyMessage(message, signature);
    const isValid = recoveredAddress.toLowerCase() === walletManager.getAddress().toLowerCase();
    console.log(`   Verified: ${isValid ? '✓' : '✗'}\n`);

    // 9. Validate địa chỉ
    console.log('🔍 Validate Address:');
    const testAddresses = [
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      '0xinvalid',
      'not-an-address',
    ];
    
    testAddresses.forEach(addr => {
      const isValid = WalletManager.isValidAddress(addr);
      console.log(`   ${addr}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
    });
    console.log();

    console.log('✅ Demo hoàn thành!\n');
    console.log('💡 Các tính năng khác của WalletManager:');
    console.log('   - sendETH(to, amount) - Gửi ETH');
    console.log('   - sendToken(tokenAddr, to, amount) - Gửi Token');
    console.log('   - getTransaction(txHash) - Lấy thông tin TX');
    console.log('   - waitForTransaction(txHash, confirmations) - Chờ confirm');
    console.log('   - getBlock(blockNumber) - Lấy thông tin block');
    console.log('\n   Xem thêm trong file src/WalletManager.js');

  } catch (error) {
    console.error('\n❌ Lỗi:', error.message);
    throw error;
  }
}

// Import ethers để dùng parseEther
const { ethers } = require('ethers');

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Thất bại!');
    process.exit(1);
  });

