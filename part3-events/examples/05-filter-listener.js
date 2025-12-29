/**
 * Script 5: Filtered Real-time Listener
 * 
 * Demo cách lắng nghe events với filter (chỉ địa chỉ cụ thể)
 * 
 * Chạy: node 05-filter-listener.js <ADDRESS>
 * (Ctrl+C để dừng)
 */

import { ethers } from 'ethers';

// Cấu hình
const RPC_URL = 'wss://eth.llamarpc.com';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const ERC20_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function main() {
  console.log('🚀 Starting Filtered Real-time Listener\n');

  // Lấy address từ command line hoặc dùng default (Binance)
  const watchAddress = process.argv[2] || '0x28C6c06298d514Db089934071355E5743bf21d60';

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

  // Lắng nghe giao dịch NHẬN VÀO
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

  // Lắng nghe giao dịch GỬI ĐI
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

  // Hiển thị thống kê mỗi 60 giây
  setInterval(() => {
    console.log(`\n📊 Statistics for ${watchAddress}:`);
    console.log(`   Incoming: ${incomingCount} transfers, ${ethers.formatUnits(incomingVolume, decimals)} ${symbol}`);
    console.log(`   Outgoing: ${outgoingCount} transfers, ${ethers.formatUnits(outgoingVolume, decimals)} ${symbol}`);
    console.log(`   Net flow: ${ethers.formatUnits(incomingVolume - outgoingVolume, decimals)} ${symbol}`);
    console.log(`   Time: ${new Date().toLocaleString()}\n`);
    console.log('─'.repeat(100));
  }, 60000);

  // Xử lý khi dừng
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

