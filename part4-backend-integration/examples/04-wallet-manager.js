/**
 * Example 4: Using WalletManager Class
 * 
 * Demo WalletManager features:
 * - Professional wallet management
 * - Check ETH and Token balance
 * - Send ETH and Token
 * - Estimate gas
 */

require('dotenv').config();
const WalletManager = require('../src/WalletManager');

async function main() {
  console.log('=== EXAMPLE 4: WALLET MANAGER CLASS ===\n');

  try {
    // 1. Initialize WalletManager
    console.log('🔧 Initializing WalletManager...');
    const walletManager = new WalletManager(
      process.env.RPC_URL,
      process.env.PRIVATE_KEY
    );
    console.log(`✓ Wallet Address: ${walletManager.getAddress()}\n`);

    // 2. Get network information
    console.log('🌐 Network Information:');
    const network = await walletManager.getNetwork();
    console.log(`   Name: ${network.name}`);
    console.log(`   Chain ID: ${network.chainId}\n`);

    // 3. Check ETH balance
    console.log('💰 ETH Balance:');
    const ethBalance = await walletManager.getBalance();
    console.log(`   ${ethBalance} ETH\n`);

    // 4. Get gas information
    console.log('⛽ Gas Information:');
    const feeData = await walletManager.getFeeData();
    console.log(`   Gas Price: ${feeData.gasPrice}`);
    if (feeData.maxFeePerGas) {
      console.log(`   Max Fee: ${feeData.maxFeePerGas}`);
      console.log(`   Priority Fee: ${feeData.maxPriorityFeePerGas}`);
    }
    console.log();

    // 5. Get block number
    console.log('⛓️  Blockchain Info:');
    const blockNumber = await walletManager.getBlockNumber();
    console.log(`   Current Block: ${blockNumber}`);
    
    const txCount = await walletManager.getTransactionCount();
    console.log(`   Transaction Count: ${txCount}\n`);

    // 6. Check Token balance (if available)
    const tokenAddress = process.env.USDT_ADDRESS;
    if (tokenAddress && WalletManager.isValidAddress(tokenAddress)) {
      console.log('🪙 Token Information:');
      try {
        const tokenInfo = await walletManager.getTokenInfo(tokenAddress);
        console.log(`   Name: ${tokenInfo.name}`);
        console.log(`   Symbol: ${tokenInfo.symbol}`);
        console.log(`   Decimals: ${tokenInfo.decimals}`);

        const tokenBalance = await walletManager.getTokenBalance(tokenAddress);
        console.log(`   Balance: ${tokenBalance.balance} ${tokenBalance.symbol}\n`);
      } catch (error) {
        console.log(`   ⚠️ Cannot get token info: ${error.message}\n`);
      }
    }

    // 7. Estimate gas for ETH transfer
    console.log('📊 Gas Estimation for ETH Transfer:');
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

    // 9. Validate address
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

    console.log('✅ Demo complete!\n');
    console.log('💡 Other WalletManager features:');
    console.log('   - sendETH(to, amount) - Send ETH');
    console.log('   - sendToken(tokenAddr, to, amount) - Send Token');
    console.log('   - getTransaction(txHash) - Get TX info');
    console.log('   - waitForTransaction(txHash, confirmations) - Wait for confirm');
    console.log('   - getBlock(blockNumber) - Get block info');
    console.log('\n   See more in file src/WalletManager.js');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

// Import ethers to use parseEther
const { ethers } = require('ethers');

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed!');
    process.exit(1);
  });
