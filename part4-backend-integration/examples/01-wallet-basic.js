/**
 * Example 1: Create and Manage Basic Wallet
 * 
 * Learn how to:
 * - Create wallet from private key
 * - Check address and balance
 * - Connect wallet with provider
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function main() {
  console.log('=== EXAMPLE 1: BASIC WALLET ===\n');

  // 1. Connect via RPC Provider
  console.log('📡 Connecting to RPC Provider...');
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  try {
    const network = await provider.getNetwork();
    console.log('✓ Connected successfully!');
    console.log(`   Network: ${network.name} (Chain ID: ${network.chainId})\n`);
  } catch (error) {
    console.error('✗ Connection error:', error.message);
    process.exit(1);
  }

  // 2. Create wallet from private key
  console.log('🔐 Creating wallet from private key...');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log('✓ Wallet created!');
  console.log(`   Address: ${wallet.address}\n`);

  // 3. Check ETH balance
  console.log('💰 Checking balance...');
  try {
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    console.log(`✓ ETH Balance: ${balanceInEth} ETH`);
    console.log(`   (Wei: ${balance.toString()})\n`);
  } catch (error) {
    console.error('✗ Error getting balance:', error.message);
  }

  // 4. Get current block information
  console.log('⛓️  Blockchain information:');
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`   Current block: ${blockNumber}`);
    
    const feeData = await provider.getFeeData();
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
  } catch (error) {
    console.error('✗ Error getting block info:', error.message);
  }

  // 5. Get transaction count (nonce)
  console.log('\n📊 Wallet information:');
  try {
    const txCount = await provider.getTransactionCount(wallet.address);
    console.log(`   Transaction count: ${txCount}`);
    console.log(`   (Number of transactions sent from this wallet)\n`);
  } catch (error) {
    console.error('✗ Error getting transaction count:', error.message);
  }

  console.log('✅ Complete!');
}

// Run program
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
