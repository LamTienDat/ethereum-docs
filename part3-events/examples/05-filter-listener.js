/**
 * Script 5: Filtered Real-time Listener
 * 
 * Demo how to listen to events with filter (specific address only)
 * 
 * Run: node 05-filter-listener.js <ADDRESS>
 * (Ctrl+C to stop)
 */

import { ethers } from 'ethers';

// Configuration - Sepolia Testnet
const RPC_URL = 'wss://eth-sepolia.g.alchemy.com/v2/demo'; // Sepolia WebSocket
const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'; // USDT on Sepolia

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function main() {
  console.log('🚀 Starting Filtered Real-time Listener\n');

  // Get address from command line or use default (Sepolia address)
  const watchAddress = process.argv[2] || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  const provider = new ethers.WebSocketProvider(RPC_URL);
  const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

  const symbol = await contract.symbol();
  const decimals = await contract.decimals();

  console.log(`📊 Token: ${symbol}`);
  console.log(`👀 Watching address: ${watchAddress}`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('─'.repeat(100));
  console.log('Press Ctrl+C to stop\n');

  let incomingCount = 0;
  let outgoingCount = 0;
  let incomingVolume = 0n;
  let outgoingVolume = 0n;

  // Listen to INCOMING transactions
  const incomingFilter = contract.filters.Transfer(null, watchAddress);
  contract.on(incomingFilter, async (from, to, value, event) => {
    incomingCount++;
    incomingVolume += value;

    const amount = ethers.formatUnits(value, decimals);
    const block = event.log.blockNumber;
    const txHash = event.log.transactionHash;

    console.log(`📥 INCOMING - Block ${block}`);
    console.log(`   From: ${from}`);
    console.log(`   Amount: ${amount} ${symbol}`);
    console.log(`   Tx: ${txHash}`);
    console.log('─'.repeat(100));
  });

  // Listen to OUTGOING transactions
  const outgoingFilter = contract.filters.Transfer(watchAddress, null);
  contract.on(outgoingFilter, async (from, to, value, event) => {
    outgoingCount++;
    outgoingVolume += value;

    const amount = ethers.formatUnits(value, decimals);
    const block = event.log.blockNumber;
    const txHash = event.log.transactionHash;

    console.log(`📤 OUTGOING - Block ${block}`);
    console.log(`   To: ${to}`);
    console.log(`   Amount: ${amount} ${symbol}`);
    console.log(`   Tx: ${txHash}`);
    console.log('─'.repeat(100));
  });

  // Display statistics every 60 seconds
  setInterval(() => {
    console.log(`\n📊 Statistics for ${watchAddress}:`);
    console.log(`   Incoming: ${incomingCount} transfers, ${ethers.formatUnits(incomingVolume, decimals)} ${symbol}`);
    console.log(`   Outgoing: ${outgoingCount} transfers, ${ethers.formatUnits(outgoingVolume, decimals)} ${symbol}`);
    console.log(`   Net flow: ${ethers.formatUnits(incomingVolume - outgoingVolume, decimals)} ${symbol}`);
    console.log(`   Time: ${new Date().toLocaleString()}\n`);
    console.log('─'.repeat(100));
  }, 60000);

  // Handle stop
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping listener...');
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Incoming: ${incomingCount} transfers, ${ethers.formatUnits(incomingVolume, decimals)} ${symbol}`);
    console.log(`   Outgoing: ${outgoingCount} transfers, ${ethers.formatUnits(outgoingVolume, decimals)} ${symbol}`);
    console.log(`   Net flow: ${ethers.formatUnits(incomingVolume - outgoingVolume, decimals)} ${symbol}`);
    
    contract.removeAllListeners();
    provider.destroy();
    
    console.log('\n✅ Done!');
    process.exit(0);
  });
}

main().catch(console.error);

