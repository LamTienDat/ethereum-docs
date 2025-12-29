/**
 * Script 3: Build Transaction History
 * 
 * Demo how to build complete transaction history for an address
 * 
 * Run: node 03-transaction-history.js <ADDRESS>
 */

import { ethers } from 'ethers';

// Configuration - Sepolia Testnet
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo'; // Sepolia Testnet
const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'; // USDT on Sepolia

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function getTransactionHistory(userAddress, fromBlock, toBlock) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

  // Get token info
  const decimals = await contract.decimals();
  const symbol = await contract.symbol();

  console.log(`📊 Token: ${symbol}`);
  console.log(`👤 User: ${userAddress}`);
  console.log(`📦 Blocks: ${fromBlock} to ${toBlock}\n`);

  // Get outgoing events
  console.log('📤 Fetching outgoing transfers...');
  const sentFilter = contract.filters.Transfer(userAddress, null);
  const sentEvents = await contract.queryFilter(sentFilter, fromBlock, toBlock);
  console.log(`   Found ${sentEvents.length} events`);

  // Get incoming events
  console.log('📥 Fetching incoming transfers...');
  const receivedFilter = contract.filters.Transfer(null, userAddress);
  const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock, toBlock);
  console.log(`   Found ${receivedEvents.length} events\n`);

  // Combine and sort by block number
  const allEvents = [...sentEvents, ...receivedEvents].sort(
    (a, b) => a.blockNumber - b.blockNumber
  );

  console.log(`📋 Total transactions: ${allEvents.length}\n`);

  // Format results
  const history = [];

  for (const event of allEvents) {
    const isSent = event.args.from.toLowerCase() === userAddress.toLowerCase();
    const block = await provider.getBlock(event.blockNumber);

    history.push({
      type: isSent ? 'SENT' : 'RECEIVED',
      from: event.args.from,
      to: event.args.to,
      amount: ethers.formatUnits(event.args.value, decimals),
      symbol: symbol,
      blockNumber: event.blockNumber,
      timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
      txHash: event.transactionHash,
    });
  }

  return history;
}

async function main() {
  console.log('🚀 Starting Transaction History Builder\n');

  // Get address from command line or use default (Sepolia address)
  const userAddress = process.argv[2] || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 1000; // 1000 blocks (~3-4 hours)

  try {
    const history = await getTransactionHistory(userAddress, fromBlock, currentBlock);

    // Display history
    console.log('📜 Transaction History:');
    console.log('═'.repeat(120));

    history.forEach((tx, index) => {
      const icon = tx.type === 'SENT' ? '📤' : '📥';
      const color = tx.type === 'SENT' ? '\x1b[31m' : '\x1b[32m'; // Red for sent, green for received
      const reset = '\x1b[0m';

      console.log(`\n${icon} ${color}${tx.type}${reset} - Block ${tx.blockNumber}`);
      console.log(`   ${tx.type === 'SENT' ? 'To:  ' : 'From:'} ${tx.type === 'SENT' ? tx.to : tx.from}`);
      console.log(`   Amount: ${tx.amount} ${tx.symbol}`);
      console.log(`   Time: ${tx.timestamp}`);
      console.log(`   Tx: ${tx.txHash}`);
    });

    console.log('\n' + '═'.repeat(120));

    // Statistics
    const sent = history.filter(tx => tx.type === 'SENT');
    const received = history.filter(tx => tx.type === 'RECEIVED');

    const totalSent = sent.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    const totalReceived = received.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    console.log(`\n📊 Summary:`);
    console.log(`   Total transactions: ${history.length}`);
    console.log(`   Sent: ${sent.length} transactions, ${totalSent.toFixed(2)} USDT`);
    console.log(`   Received: ${received.length} transactions, ${totalReceived.toFixed(2)} USDT`);
    console.log(`   Net: ${(totalReceived - totalSent).toFixed(2)} USDT`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);

