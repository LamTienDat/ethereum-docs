/**
 * Script 1: Query Past Events
 * 
 * Demo how to retrieve events that occurred in the past
 * 
 * Run: node 01-query-past-events.js
 */

import { ethers } from 'ethers';

// Configuration
const RPC_URL = 'https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07'; // Ethereum Mainnet
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

// ERC20 ABI (only Transfer event needed)
const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function main() {
  console.log('🚀 Starting Past Events Query Demo\n');

  // Connect provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

  // Get token info
  const symbol = await contract.symbol();
  const decimals = await contract.decimals();
  console.log(`📊 Token: ${symbol} (${decimals} decimals)\n`);

  // Get current block
  const currentBlock = await provider.getBlockNumber();
  console.log(`📦 Current block: ${currentBlock}\n`);

  // Query range: last 100 blocks
  const fromBlock = currentBlock - 100;
  const toBlock = currentBlock;

  console.log(`🔍 Querying Transfer events from block ${fromBlock} to ${toBlock}...\n`);

  try {
    // Get all Transfer events
    const filter = contract.filters.Transfer();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);

    console.log(`✅ Found ${events.length} Transfer events\n`);

    // Display first 5 events
    console.log('📋 First 5 events:');
    console.log('─'.repeat(100));

    for (let i = 0; i < Math.min(5, events.length); i++) {
      const event = events[i];
      const amount = ethers.formatUnits(event.args.value, decimals);

      console.log(`\n${i + 1}. Block ${event.blockNumber}`);
      console.log(`   From: ${event.args.from}`);
      console.log(`   To:   ${event.args.to}`);
      console.log(`   Amount: ${amount} ${symbol}`);
      console.log(`   Tx: ${event.transactionHash}`);
    }

    console.log('\n' + '─'.repeat(100));

    // Statistics
    let totalVolume = 0n;
    events.forEach(event => {
      totalVolume += event.args.value;
    });

    console.log(`\n📊 Statistics:`);
    console.log(`   Total transfers: ${events.length}`);
    console.log(`   Total volume: ${ethers.formatUnits(totalVolume, decimals)} ${symbol}`);
    console.log(`   Blocks scanned: ${toBlock - fromBlock + 1}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);

