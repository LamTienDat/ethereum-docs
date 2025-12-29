/**
 * Example 3: Send ERC20 Token from Backend
 * 
 * Learn how to:
 * - Connect to ERC20 contract
 * - Check token balance
 * - Send token to another address
 * - Handle token decimals
 */

require('dotenv').config();
const { ethers } = require('ethers');

// Minimal ABI for ERC20
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

async function sendToken(tokenAddress, toAddress, amount) {
  console.log('=== EXAMPLE 3: SEND ERC20 TOKEN ===\n');

  try {
    // 1. Setup wallet
    console.log('📡 Connecting...');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const network = await provider.getNetwork();
    console.log(`✓ Connected: ${network.name}\n`);

    // 2. Connect to token contract
    console.log('🪙 Connecting to token contract...');
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    // 3. Get token information
    console.log('📋 Token information:');
    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);

    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals}`);
    console.log(`   Contract: ${tokenAddress}\n`);

    // 4. Check token balance
    console.log('💰 Checking token balance...');
    const balance = await tokenContract.balanceOf(wallet.address);
    const balanceFormatted = ethers.formatUnits(balance, decimals);
    const amountInWei = ethers.parseUnits(amount, decimals);

    console.log(`   Current balance: ${balanceFormatted} ${symbol}`);
    console.log(`   Amount to send: ${amount} ${symbol}`);

    if (balance < amountInWei) {
      throw new Error(
        `Insufficient ${symbol} balance! Need ${amount}, have ${balanceFormatted}`
      );
    }
    console.log('   ✓ Balance sufficient for transaction\n');

    // 5. Estimate gas
    console.log('⛽ Estimating gas...');
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
      console.log(`   Estimated gas fee: ~${gasCostInEth} ETH\n`);
    } catch (error) {
      console.log('   ⚠️ Cannot estimate gas accurately');
      console.log(`   Error: ${error.message}\n`);
    }

    // 6. Transaction information
    console.log('📤 Transaction information:');
    console.log(`   From: ${wallet.address}`);
    console.log(`   To: ${toAddress}`);
    console.log(`   Token: ${symbol}`);
    console.log(`   Amount: ${amount} ${symbol}\n`);

    // Uncomment to send for real
    console.log('⚠️  WARNING: DRY RUN mode (not sending)');
    console.log('   Uncomment lines 95-111 to execute real transaction\n');

    /*
    // 7. Send token
    console.log('📤 Sending token...');
    const tx = await tokenContract.transfer(toAddress, amountInWei);

    console.log(`✓ Transaction sent!`);
    console.log(`   TX Hash: ${tx.hash}\n`);

    // 8. Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Transaction confirmed!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? 'SUCCESS ✓' : 'FAILED ✗'}\n`);

    // 9. Check new balance
    const newBalance = await tokenContract.balanceOf(wallet.address);
    const newBalanceFormatted = ethers.formatUnits(newBalance, decimals);
    console.log(`💰 New ${symbol} balance: ${newBalanceFormatted}\n`);

    return receipt;
    */

  } catch (error) {
    console.error('\n❌ Error sending token:', error.message);
    
    // Handle common errors
    if (error.message.includes('insufficient funds')) {
      console.error('   → Not enough ETH to pay gas fee');
    } else if (error.message.includes('execution reverted')) {
      console.error('   → Contract revert - possibly insufficient token balance');
    }
    
    throw error;
  }
}

// Run program
async function main() {
  // Get parameters from command line
  const tokenAddress = process.argv[2] || process.env.USDT_ADDRESS;
  const recipientAddress = process.argv[3] || process.env.RECIPIENT_ADDRESS;
  const amount = process.argv[4] || '10';

  if (!tokenAddress) {
    console.error('❌ Missing token address!');
    console.log('\nUsage:');
    console.log('  node 03-send-token.js <token_address> <recipient_address> <amount>');
    console.log('\nExample:');
    console.log('  node 03-send-token.js 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 10');
    process.exit(1);
  }

  if (!recipientAddress) {
    console.error('❌ Missing recipient address!');
    process.exit(1);
  }

  await sendToken(tokenAddress, recipientAddress, amount);
  console.log('✅ Complete!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Failed!');
    process.exit(1);
  });
