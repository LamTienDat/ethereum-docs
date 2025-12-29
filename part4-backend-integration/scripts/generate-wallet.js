/**
 * Script tạo Ethereum wallet mới
 * 
 * Sử dụng: node scripts/generate-wallet.js
 */

const { ethers } = require('ethers');

function generateWallet() {
  console.log('=== GENERATE NEW ETHEREUM WALLET ===\n');
  
  // Tạo wallet ngẫu nhiên
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ Wallet mới đã được tạo!\n');
  console.log('📋 Thông tin wallet:');
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  console.log('Address:');
  console.log(`  ${wallet.address}\n`);
  
  console.log('Private Key:');
  console.log(`  ${wallet.privateKey}\n`);
  
  console.log('Mnemonic Phrase (12 words):');
  console.log(`  ${wallet.mnemonic.phrase}\n`);
  
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  console.log('⚠️  QUAN TRỌNG - BẢO MẬT:');
  console.log('   1. KHÔNG BAO GIỜ chia sẻ Private Key hoặc Mnemonic');
  console.log('   2. Lưu Private Key vào file .env (đã được gitignore)');
  console.log('   3. Backup Mnemonic ở nơi an toàn');
  console.log('   4. Private Key = Toàn quyền kiểm soát wallet');
  console.log('   5. Mất Private Key = Mất tất cả tài sản\n');
  
  console.log('📝 Các bước tiếp theo:');
  console.log('   1. Copy Private Key vào file .env:');
  console.log(`      PRIVATE_KEY=${wallet.privateKey}\n`);
  console.log('   2. Lấy testnet ETH từ faucet:');
  console.log('      - Sepolia: https://sepoliafaucet.com/');
  console.log('      - Goerli: https://goerlifaucet.com/\n');
  console.log('   3. Chạy ví dụ:');
  console.log('      npm run wallet\n');
}

generateWallet();

