/**
 * Ví dụ 5: RPC Provider và Fallback
 * 
 * Học cách:
 * - Sử dụng nhiều loại RPC provider
 * - Setup FallbackProvider
 * - Tăng độ tin cậy cho ứng dụng
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function demoProviders() {
  console.log('=== VÍ DỤ 5: RPC PROVIDER ===\n');

  // 1. JsonRpcProvider - Cơ bản nhất
  console.log('📡 1. JsonRpcProvider (RPC URL trực tiếp):');
  try {
    const provider1 = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const blockNumber1 = await provider1.getBlockNumber();
    console.log(`   ✓ Block number: ${blockNumber1}\n`);
  } catch (error) {
    console.error(`   ✗ Lỗi: ${error.message}\n`);
  }

  // 2. AlchemyProvider - Khuyến nghị cho Production
  if (process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'your_alchemy_api_key_here') {
    console.log('📡 2. AlchemyProvider:');
    try {
      const provider2 = new ethers.AlchemyProvider(
        'sepolia', // hoặc 'mainnet', 'polygon', 'arbitrum'
        process.env.ALCHEMY_API_KEY
      );
      const blockNumber2 = await provider2.getBlockNumber();
      console.log(`   ✓ Block number: ${blockNumber2}\n`);
    } catch (error) {
      console.error(`   ✗ Lỗi: ${error.message}\n`);
    }
  } else {
    console.log('📡 2. AlchemyProvider:');
    console.log('   ⚠️ Cần setup ALCHEMY_API_KEY trong .env\n');
  }

  // 3. InfuraProvider
  if (process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'your_infura_api_key_here') {
    console.log('📡 3. InfuraProvider:');
    try {
      const provider3 = new ethers.InfuraProvider(
        'sepolia',
        process.env.INFURA_API_KEY
      );
      const blockNumber3 = await provider3.getBlockNumber();
      console.log(`   ✓ Block number: ${blockNumber3}\n`);
    } catch (error) {
      console.error(`   ✗ Lỗi: ${error.message}\n`);
    }
  } else {
    console.log('📡 3. InfuraProvider:');
    console.log('   ⚠️ Cần setup INFURA_API_KEY trong .env\n');
  }

  // 4. WebSocketProvider - Cho realtime events
  console.log('📡 4. WebSocketProvider (cho realtime):');
  console.log('   ℹ️ WebSocket tốt cho listen events realtime');
  console.log('   Ví dụ: wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY\n');

  // 5. Demo FallbackProvider
  console.log('📡 5. FallbackProvider (Độ tin cậy cao):');
  console.log('   Tự động chuyển provider khi một provider gặp lỗi\n');
  
  await demoFallbackProvider();

  // 6. So sánh performance
  console.log('\n📊 So sánh Performance:');
  await compareProviderPerformance();
}

/**
 * Demo FallbackProvider
 */
async function demoFallbackProvider() {
  try {
    const providers = [];

    // Thêm các provider có sẵn
    if (process.env.RPC_URL) {
      providers.push({
        provider: new ethers.JsonRpcProvider(process.env.RPC_URL),
        priority: 1,
        weight: 1,
      });
    }

    if (process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'your_alchemy_api_key_here') {
      providers.push({
        provider: new ethers.AlchemyProvider('sepolia', process.env.ALCHEMY_API_KEY),
        priority: 1,
        weight: 2, // Weight cao hơn = ưu tiên hơn
      });
    }

    if (process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'your_infura_api_key_here') {
      providers.push({
        provider: new ethers.InfuraProvider('sepolia', process.env.INFURA_API_KEY),
        priority: 2, // Priority thấp hơn = backup
        weight: 1,
      });
    }

    if (providers.length < 2) {
      console.log('   ⚠️ Cần ít nhất 2 providers để demo FallbackProvider');
      console.log('   Thêm ALCHEMY_API_KEY hoặc INFURA_API_KEY vào .env\n');
      return;
    }

    console.log(`   Đang setup FallbackProvider với ${providers.length} providers...`);
    const fallbackProvider = new ethers.FallbackProvider(providers);

    // Test
    const startTime = Date.now();
    const blockNumber = await fallbackProvider.getBlockNumber();
    const duration = Date.now() - startTime;

    console.log(`   ✓ Block number: ${blockNumber}`);
    console.log(`   ✓ Thời gian: ${duration}ms`);
    console.log(`   ✓ Nếu provider chính fail, tự động chuyển sang backup\n`);

  } catch (error) {
    console.error(`   ✗ Lỗi: ${error.message}\n`);
  }
}

/**
 * So sánh performance của các provider
 */
async function compareProviderPerformance() {
  const tests = [];

  // Test JsonRpcProvider
  if (process.env.RPC_URL) {
    tests.push({
      name: 'JsonRpcProvider',
      provider: new ethers.JsonRpcProvider(process.env.RPC_URL),
    });
  }

  // Test AlchemyProvider
  if (process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'your_alchemy_api_key_here') {
    tests.push({
      name: 'AlchemyProvider',
      provider: new ethers.AlchemyProvider('sepolia', process.env.ALCHEMY_API_KEY),
    });
  }

  // Test InfuraProvider
  if (process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'your_infura_api_key_here') {
    tests.push({
      name: 'InfuraProvider',
      provider: new ethers.InfuraProvider('sepolia', process.env.INFURA_API_KEY),
    });
  }

  if (tests.length === 0) {
    console.log('   ⚠️ Không có provider nào để test\n');
    return;
  }

  console.log(`   Đang test ${tests.length} provider(s)...\n`);

  for (const test of tests) {
    try {
      const startTime = Date.now();
      
      // Thực hiện 3 requests
      await Promise.all([
        test.provider.getBlockNumber(),
        test.provider.getFeeData(),
        test.provider.getNetwork(),
      ]);
      
      const duration = Date.now() - startTime;
      
      console.log(`   ${test.name}:`);
      console.log(`     Thời gian: ${duration}ms`);
      console.log(`     Trung bình: ~${Math.round(duration/3)}ms/request\n`);
    } catch (error) {
      console.log(`   ${test.name}:`);
      console.log(`     ✗ Lỗi: ${error.message}\n`);
    }
  }
}

// Chạy demo
demoProviders()
  .then(() => {
    console.log('✅ Demo hoàn thành!\n');
    console.log('💡 Best Practices:');
    console.log('   - Dùng Alchemy/Infura cho production');
    console.log('   - Implement FallbackProvider cho high availability');
    console.log('   - Monitor performance và error rate');
    console.log('   - Dùng WebSocket cho realtime events');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  });

