/**
 * Script 6: Custom Events Demo
 * 
 * Demo cách làm việc với custom events từ smart contract
 * 
 * Chạy: node 06-custom-events.js
 */

import { ethers } from 'ethers';

// Cấu hình
const RPC_URL = 'https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07';

// Ví dụ: Uniswap V2 Pair contract (có nhiều custom events)
const UNISWAP_PAIR_ADDRESS = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc'; // USDC/WETH pair

// ABI với các custom events
const PAIR_ABI = [
  'event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)',
  'event Sync(uint112 reserve0, uint112 reserve1)',
  'event Mint(address indexed sender, uint amount0, uint amount1)',
  'event Burn(address indexed sender, uint amount0, uint amount1, address indexed to)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
];

async function main() {
  console.log('🚀 Starting Custom Events Demo\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(UNISWAP_PAIR_ADDRESS, PAIR_ABI, provider);

  // Lấy thông tin pair
  const token0 = await contract.token0();
  const token1 = await contract.token1();
  const reserves = await contract.getReserves();

  console.log(`📊 Uniswap V2 Pair: ${UNISWAP_PAIR_ADDRESS}`);
  console.log(`   Token0: ${token0} (USDC)`);
  console.log(`   Token1: ${token1} (WETH)`);
  console.log(`   Reserve0: ${ethers.formatUnits(reserves.reserve0, 6)} USDC`);
  console.log(`   Reserve1: ${ethers.formatUnits(reserves.reserve1, 18)} WETH\n`);

  const currentBlock = await provider.getBlockNumber();
  const fromBlock = currentBlock - 100; // 100 blocks gần nhất

  console.log(`🔍 Querying events from block ${fromBlock} to ${currentBlock}...\n`);

  try {
    // 1. Query Swap events
    console.log('🔄 Swap Events:');
    console.log('─'.repeat(100));
    
    const swapFilter = contract.filters.Swap();
    const swapEvents = await contract.queryFilter(swapFilter, fromBlock, currentBlock);
    
    console.log(`Found ${swapEvents.length} swaps\n`);

    // Hiển thị 3 swaps đầu tiên
    for (let i = 0; i < Math.min(3, swapEvents.length); i++) {
      const event = swapEvents[i];
      const args = event.args;

      console.log(`${i + 1}. Block ${event.blockNumber}`);
      console.log(`   Sender: ${args.sender}`);
      console.log(`   To: ${args.to}`);
      
      if (args.amount0In > 0n) {
        console.log(`   Swap: ${ethers.formatUnits(args.amount0In, 6)} USDC → ${ethers.formatUnits(args.amount1Out, 18)} WETH`);
      } else {
        console.log(`   Swap: ${ethers.formatUnits(args.amount1In, 18)} WETH → ${ethers.formatUnits(args.amount0Out, 6)} USDC`);
      }
      
      console.log(`   Tx: ${event.transactionHash}\n`);
    }

    // 2. Query Sync events
    console.log('\n🔄 Sync Events:');
    console.log('─'.repeat(100));
    
    const syncFilter = contract.filters.Sync();
    const syncEvents = await contract.queryFilter(syncFilter, fromBlock, currentBlock);
    
    console.log(`Found ${syncEvents.length} syncs\n`);

    // Hiển thị sync cuối cùng
    if (syncEvents.length > 0) {
      const lastSync = syncEvents[syncEvents.length - 1];
      console.log(`Latest Sync - Block ${lastSync.blockNumber}`);
      console.log(`   Reserve0: ${ethers.formatUnits(lastSync.args.reserve0, 6)} USDC`);
      console.log(`   Reserve1: ${ethers.formatUnits(lastSync.args.reserve1, 18)} WETH`);
      console.log(`   Tx: ${lastSync.transactionHash}\n`);
    }

    // 3. Query Mint events (add liquidity)
    console.log('\n➕ Mint Events (Add Liquidity):');
    console.log('─'.repeat(100));
    
    const mintFilter = contract.filters.Mint();
    const mintEvents = await contract.queryFilter(mintFilter, fromBlock, currentBlock);
    
    console.log(`Found ${mintEvents.length} liquidity additions\n`);

    if (mintEvents.length > 0) {
      for (let i = 0; i < Math.min(2, mintEvents.length); i++) {
        const event = mintEvents[i];
        console.log(`${i + 1}. Block ${event.blockNumber}`);
        console.log(`   Sender: ${event.args.sender}`);
        console.log(`   Amount0: ${ethers.formatUnits(event.args.amount0, 6)} USDC`);
        console.log(`   Amount1: ${ethers.formatUnits(event.args.amount1, 18)} WETH`);
        console.log(`   Tx: ${event.transactionHash}\n`);
      }
    }

    // 4. Query Burn events (remove liquidity)
    console.log('\n➖ Burn Events (Remove Liquidity):');
    console.log('─'.repeat(100));
    
    const burnFilter = contract.filters.Burn();
    const burnEvents = await contract.queryFilter(burnFilter, fromBlock, currentBlock);
    
    console.log(`Found ${burnEvents.length} liquidity removals\n`);

    if (burnEvents.length > 0) {
      for (let i = 0; i < Math.min(2, burnEvents.length); i++) {
        const event = burnEvents[i];
        console.log(`${i + 1}. Block ${event.blockNumber}`);
        console.log(`   Sender: ${event.args.sender}`);
        console.log(`   To: ${event.args.to}`);
        console.log(`   Amount0: ${ethers.formatUnits(event.args.amount0, 6)} USDC`);
        console.log(`   Amount1: ${ethers.formatUnits(event.args.amount1, 18)} WETH`);
        console.log(`   Tx: ${event.transactionHash}\n`);
      }
    }

    // Thống kê tổng hợp
    console.log('\n📊 Summary:');
    console.log('─'.repeat(100));
    console.log(`   Total Swaps: ${swapEvents.length}`);
    console.log(`   Total Syncs: ${syncEvents.length}`);
    console.log(`   Total Mints: ${mintEvents.length}`);
    console.log(`   Total Burns: ${burnEvents.length}`);
    console.log(`   Blocks scanned: ${currentBlock - fromBlock + 1}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n✅ Done!');
}

main().catch(console.error);

