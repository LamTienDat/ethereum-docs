/**
 * Example 2: Send ETH from Backend
 * 
 * Learn how to:
 * - Send ETH to another address
 * - Check balance before sending
 * - Wait for confirmation
 * - Handle errors
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function sendETH(toAddress, amountInEther) {
  console.log('=== EXAMPLE 2: SEND ETH FROM BACKEND ===\n');

  try {
    // 1. Setup wallet
    console.log('📡 Connecting...');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const network = await provider.getNetwork();
    console.log(`✓ Connected: ${network.name} (Chain ID: ${network.chainId})\n`);

    // 2. Transaction information
    console.log('📋 Transaction information:');
    console.log(`   From: ${wallet.address}`);
    console.log(`   To: ${toAddress}`);
    console.log(`   Amount: ${amountInEther} ETH\n`);

    // 3. Check balance
    console.log('💰 Checking balance...');
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);
    const amount = ethers.parseEther(amountInEther);

    console.log(`   Current balance: ${balanceInEth} ETH`);

    if (balance < amount) {
      throw new Error(`Insufficient balance! Need ${amountInEther} ETH, have ${balanceInEth} ETH`);
    }
    console.log('   ✓ Balance sufficient for transaction\n');

    // 4. Estimate gas
    console.log('⛽ Estimating gas fee...');
    const feeData = await provider.getFeeData();
    const gasLimit = 21000; // Standard gas limit for ETH transfer
    const estimatedGas = gasLimit * feeData.gasPrice;
    const estimatedGasInEth = ethers.formatEther(estimatedGas);
    
    console.log(`   Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
    console.log(`   Gas Limit: ${gasLimit}`);
    console.log(`   Estimated gas fee: ~${estimatedGasInEth} ETH\n`);

    // 5. Confirm transaction
    const totalCost = parseFloat(amountInEther) + parseFloat(estimatedGasInEth);
    console.log(`💡 Total cost: ~${totalCost.toFixed(6)} ETH (including gas)\n`);

    // Uncomment the line below to actually send transaction
    // console.log('⚠️  WARNING: Sending REAL transaction!');
    // console.log('   Uncomment lines 67-80 in code to execute\n');
    
    /*
    // 6. Send transaction
    console.log('📤 Sending transaction...');
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amount,
    });

    console.log(`✓ Transaction sent!`);
    console.log(`   TX Hash: ${tx.hash}\n`);

    // 7. Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();

    console.log('✅ Transaction confirmed!');
    console.log(`   Block: ${receipt.blockNumber}`);
    console.log(`   Gas used: ${receipt.gasUsed.toString()}`);
    console.log(`   Status: ${receipt.status === 1 ? 'SUCCESS' : 'FAILED'}\n`);

    // 8. Check new balance
    const newBalance = await provider.getBalance(wallet.address);
    const newBalanceInEth = ethers.formatEther(newBalance);
    console.log(`💰 New balance: ${newBalanceInEth} ETH`);
    
    return receipt;
    */

    console.log('ℹ️  This is DRY RUN mode (not sending real transaction)');
    console.log('   To send for real, uncomment code section from lines 60-87\n');
    
  } catch (error) {
    console.error('\n❌ Error sending ETH:', error.message);
    throw error;
  }
}

// Run program
const recipientAddress = process.env.RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
const amount = process.argv[2] || '0.001'; // Get from command line or use default

sendETH(recipientAddress, amount)
  .then(() => {
    console.log('✅ Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed!');
    process.exit(1);
  });

// Usage:
// node 02-send-eth.js 0.01
