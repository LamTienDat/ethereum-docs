/**
 * Script to generate new Ethereum wallet
 * 
 * Usage: node scripts/generate-wallet.js
 */

const { ethers } = require('ethers');

function generateWallet() {
  console.log('=== GENERATE NEW ETHEREUM WALLET ===\n');
  
  // Create random wallet
  const wallet = ethers.Wallet.createRandom();
  
  console.log('✅ New wallet created!\n');
  console.log('📋 Wallet information:');
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  console.log('Address:');
  console.log(`  ${wallet.address}\n`);
  
  console.log('Private Key:');
  console.log(`  ${wallet.privateKey}\n`);
  
  console.log('Mnemonic Phrase (12 words):');
  console.log(`  ${wallet.mnemonic.phrase}\n`);
  
  console.log('─────────────────────────────────────────────────────────────────\n');
  
  console.log('⚠️  IMPORTANT - SECURITY:');
  console.log('   1. NEVER share Private Key or Mnemonic');
  console.log('   2. Save Private Key in .env file (already in gitignore)');
  console.log('   3. Backup Mnemonic in a safe place');
  console.log('   4. Private Key = Full control of wallet');
  console.log('   5. Lost Private Key = Lost all assets\n');
  
  console.log('📝 Next steps:');
  console.log('   1. Copy Private Key to .env file:');
  console.log(`      PRIVATE_KEY=${wallet.privateKey}\n`);
  console.log('   2. Get testnet ETH from faucet:');
  console.log('      - Sepolia: https://sepoliafaucet.com/');
  console.log('      - Goerli: https://goerlifaucet.com/\n');
  console.log('   3. Run example:');
  console.log('      npm run wallet\n');
}

generateWallet();
