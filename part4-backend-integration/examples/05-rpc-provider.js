/**
 * Example 5: RPC Provider and Fallback
 * 
 * Learn how to:
 * - Use different types of RPC providers
 * - Setup FallbackProvider
 * - Increase application reliability
 */

require('dotenv').config();
const { ethers } = require('ethers');

async function demoProviders() {
  console.log('=== EXAMPLE 5: RPC PROVIDER ===\n');

  // 1. JsonRpcProvider - Most basic
  console.log('📡 1. JsonRpcProvider (Direct RPC URL):');
  try {
    const provider1 = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const blockNumber1 = await provider1.getBlockNumber();
    console.log(`   ✓ Block number: ${blockNumber1}\n`);
  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }

  // 2. AlchemyProvider - Recommended for Production
  if (process.env.ALCHEMY_API_KEY && process.env.ALCHEMY_API_KEY !== 'your_alchemy_api_key_here') {
    console.log('📡 2. AlchemyProvider:');
    try {
      const provider2 = new ethers.AlchemyProvider(
        'sepolia', // or 'mainnet', 'polygon', 'arbitrum'
        process.env.ALCHEMY_API_KEY
      );
      const blockNumber2 = await provider2.getBlockNumber();
      console.log(`   ✓ Block number: ${blockNumber2}\n`);
    } catch (error) {
      console.error(`   ✗ Error: ${error.message}\n`);
    }
  } else {
    console.log('📡 2. AlchemyProvider:');
    console.log('   ⚠️ Need to setup ALCHEMY_API_KEY in .env\n');
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
      console.error(`   ✗ Error: ${error.message}\n`);
    }
  } else {
    console.log('📡 3. InfuraProvider:');
    console.log('   ⚠️ Need to setup INFURA_API_KEY in .env\n');
  }

  // 4. WebSocketProvider - For realtime events
  console.log('📡 4. WebSocketProvider (for realtime):');
  console.log('   ℹ️ WebSocket is good for listening to realtime events');
  console.log('   Example: wss://eth-mainnet.g.alchemy.com/v2/YOUR_KEY\n');

  // 5. Demo FallbackProvider
  console.log('📡 5. FallbackProvider (High reliability):');
  console.log('   Automatically switches provider when one fails\n');
  
  await demoFallbackProvider();

  // 6. Compare performance
  console.log('\n📊 Performance Comparison:');
  await compareProviderPerformance();
}

/**
 * Demo FallbackProvider
 */
async function demoFallbackProvider() {
  try {
    const providers = [];

    // Add available providers
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
        weight: 2, // Higher weight = higher priority
      });
    }

    if (process.env.INFURA_API_KEY && process.env.INFURA_API_KEY !== 'your_infura_api_key_here') {
      providers.push({
        provider: new ethers.InfuraProvider('sepolia', process.env.INFURA_API_KEY),
        priority: 2, // Lower priority = backup
        weight: 1,
      });
    }

    if (providers.length < 2) {
      console.log('   ⚠️ Need at least 2 providers to demo FallbackProvider');
      console.log('   Add ALCHEMY_API_KEY or INFURA_API_KEY to .env\n');
      return;
    }

    console.log(`   Setting up FallbackProvider with ${providers.length} providers...`);
    const fallbackProvider = new ethers.FallbackProvider(providers);

    // Test
    const startTime = Date.now();
    const blockNumber = await fallbackProvider.getBlockNumber();
    const duration = Date.now() - startTime;

    console.log(`   ✓ Block number: ${blockNumber}`);
    console.log(`   ✓ Time: ${duration}ms`);
    console.log(`   ✓ If main provider fails, automatically switches to backup\n`);

  } catch (error) {
    console.error(`   ✗ Error: ${error.message}\n`);
  }
}

/**
 * Compare provider performance
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
    console.log('   ⚠️ No providers to test\n');
    return;
  }

  console.log(`   Testing ${tests.length} provider(s)...\n`);

  for (const test of tests) {
    try {
      const startTime = Date.now();
      
      // Execute 3 requests
      await Promise.all([
        test.provider.getBlockNumber(),
        test.provider.getFeeData(),
        test.provider.getNetwork(),
      ]);
      
      const duration = Date.now() - startTime;
      
      console.log(`   ${test.name}:`);
      console.log(`     Time: ${duration}ms`);
      console.log(`     Average: ~${Math.round(duration/3)}ms/request\n`);
    } catch (error) {
      console.log(`   ${test.name}:`);
      console.log(`     ✗ Error: ${error.message}\n`);
    }
  }
}

// Run demo
demoProviders()
  .then(() => {
    console.log('✅ Demo complete!\n');
    console.log('💡 Best Practices:');
    console.log('   - Use Alchemy/Infura for production');
    console.log('   - Implement FallbackProvider for high availability');
    console.log('   - Monitor performance and error rate');
    console.log('   - Use WebSocket for realtime events');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
