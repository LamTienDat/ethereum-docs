/**
 * Script 4: Real-time Event Listener
 * 
 * Demo how to listen to events in real-time
 * 
 * Run: node 04-realtime-listener.js
 * (Ctrl+C to stop)
 */

import { ethers } from 'ethers';

// Configuration - Sepolia Testnet
const RPC_URL = 'wss://eth-sepolia.g.alchemy.com/v2/demo'; // Sepolia WebSocket (use your own API key)
const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06'; // USDT on Sepolia

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function main() {
  console.log('🚀 Starting Real-time Event Listener\n');

  // Connect with WebSocket provider
  const provider = new ethers.WebSocketProvider(RPC_URL);
  const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

  const symbol = await contract.symbol();
  const decimals = await contract.decimals();

  console.log(`📊 Token: ${symbol}`);
  console.log(`📡 Listening for Transfer events...`);
  console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
  console.log('─'.repeat(100));
  console.log('Press Ctrl+C to stop\n');

  let eventCount = 0;
  let totalVolume = 0n;

  // Listen to all Transfer events
  contract.on('Transfer', async (from, to, value, event) => {
    eventCount++;
    totalVolume += value;

    const amount = ethers.formatUnits(value, decimals);
    const block = event.log.blockNumber;
    const txHash = event.log.transactionHash;

    console.log(`🔔 Event #${eventCount} - Block ${block}`);
    console.log(`   From: ${from}`);
    console.log(`   To:   ${to}`);
    console.log(`   Amount: ${amount} ${symbol}`);
    console.log(`   Tx: ${txHash}`);
    console.log('─'.repeat(100));
  });

  // Display statistics every 30 seconds
  setInterval(() => {
    console.log(`\n📊 Statistics (last 30s):`);
    console.log(`   Events detected: ${eventCount}`);
    console.log(`   Total volume: ${ethers.formatUnits(totalVolume, decimals)} ${symbol}`);
    console.log(`   Time: ${new Date().toLocaleString()}\n`);
    console.log('─'.repeat(100));
  }, 30000);

  // Handle stop
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping listener...');
    console.log(`\n📊 Final Statistics:`);
    console.log(`   Total events: ${eventCount}`);
    console.log(`   Total volume: ${ethers.formatUnits(totalVolume, decimals)} ${symbol}`);
    
    contract.removeAllListeners();
    provider.destroy();
    
    console.log('\n✅ Done!');
    process.exit(0);
  });
}

main().catch(console.error);

