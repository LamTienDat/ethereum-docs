/**
 * Script 2: Filter Events by Address
 * 
 * Demo how to filter events by specific address
 * 
 * Run: node 02-filter-by-address.js
 */

import { ethers } from 'ethers';

// Configuration - Sepolia Testnet
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo'; // Sepolia Testnet
const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'; // USDT on Sepolia

// Test address (use your own wallet address or any active Sepolia address)
const TARGET_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'; // Example Sepolia address

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function main() {
  console.log('🚀 Starting Filter by Address Demo\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

  const symbol = await contract.symbol();
  const decimals = await contract.decimals();

  console.log(`📊 Token: ${symbol}`);
  console.log(`🎯 Target Address: ${TARGET_ADDRESS}\n`);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 500; // 500 blocks (~2 hours)

  console.log(`🔍 Scanning blocks ${fromBlock} to ${currentBlock}...\n`);

  try {
    // 1. Get OUTGOING transactions (FROM = target)
    console.log('📤 Querying OUTGOING transfers...');
    const sentFilter = contract.filters.Transfer(TARGET_ADDRESS, null);
    const sentEvents = await contract.queryFilter(sentFilter, fromBlock, currentBlock);
    console.log(`   Found ${sentEvents.length} outgoing transfers\n`);

    // 2. Get INCOMING transactions (TO = target)
    console.log('📥 Querying INCOMING transfers...');
    const receivedFilter = contract.filters.Transfer(null, TARGET_ADDRESS);
    const receivedEvents = await contract.queryFilter(receivedFilter, fromBlock, currentBlock);
    console.log(`   Found ${receivedEvents.length} incoming transfers\n`);

    // Display some outgoing transactions
    if (sentEvents.length > 0) {
      console.log('📤 Sample OUTGOING transfers:');
      console.log('─'.repeat(100));
      
      for (let i = 0; i < Math.min(3, sentEvents.length); i++) {
        const event = sentEvents[i];
        const amount = ethers.formatUnits(event.args.value, decimals);
        
        console.log(`\n${i + 1}. Block ${event.blockNumber}`);
        console.log(`   To: ${event.args.to}`);
        console.log(`   Amount: ${amount} ${symbol}`);
        console.log(`   Tx: ${event.transactionHash}`);
      }
      console.log('\n' + '─'.repeat(100));
    }

    // Display some incoming transactions
    if (receivedEvents.length > 0) {
      console.log('\n📥 Sample INCOMING transfers:');
      console.log('─'.repeat(100));
      
      for (let i = 0; i < Math.min(3, receivedEvents.length); i++) {
        const event = receivedEvents[i];
        const amount = ethers.formatUnits(event.args.value, decimals);
        
        console.log(`\n${i + 1}. Block ${event.blockNumber}`);
        console.log(`   From: ${event.args.from}`);
        console.log(`   Amount: ${amount} ${symbol}`);
        console.log(`   Tx: ${event.transactionHash}`);
      }
      console.log('\n' + '─'.repeat(100));
    }

    // Statistics
    let totalSent = 0n;
    let totalReceived = 0n;

    sentEvents.forEach(event => {
      totalSent += event.args.value;
    });

    receivedEvents.forEach(event => {
      totalReceived += event.args.value;
    });

    console.log(`\n📊 Statistics for ${TARGET_ADDRESS}:`);
    console.log(`   Outgoing: ${sentEvents.length} transfers, ${ethers.formatUnits(totalSent, decimals)} ${symbol}`);
    console.log(`   Incoming: ${receivedEvents.length} transfers, ${ethers.formatUnits(totalReceived, decimals)} ${symbol}`);
    console.log(`   Net flow: ${ethers.formatUnits(totalReceived - totalSent, decimals)} ${symbol}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);

