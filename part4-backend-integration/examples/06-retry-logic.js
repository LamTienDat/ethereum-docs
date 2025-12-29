/**
 * Example 6: Retry Logic with Exponential Backoff
 * 
 * Learn how to:
 * - Handle network errors
 * - Retry with exponential backoff
 * - Timeout for requests
 * - Distinguish retryable vs non-retryable errors
 */

require('dotenv').config();
const { ethers } = require('ethers');
const {
  callWithRetry,
  rpcCallWithRetry,
  isRetryableError,
  isNetworkError,
  isRateLimitError,
} = require('../utils/retry');

async function demoRetryLogic() {
  console.log('=== EXAMPLE 6: RETRY LOGIC ===\n');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Demo 1: Basic retry
  await demo1_BasicRetry(provider);

  // Demo 2: Retry with RPC calls
  await demo2_RpcRetry(provider);

  // Demo 3: Error classification
  await demo3_ErrorClassification();

  // Demo 4: Retry when sending transaction
  await demo4_TransactionRetry(wallet, provider);
}

/**
 * Demo 1: Basic retry
 */
async function demo1_BasicRetry(provider) {
  console.log('📝 Demo 1: Basic Retry Logic\n');

  // Simulate function that can fail
  let attemptCount = 0;
  const unreliableFunction = async () => {
    attemptCount++;
    console.log(`   Attempt ${attemptCount}...`);
    
    // Fail first 2 times, succeed on 3rd
    if (attemptCount < 3) {
      throw new Error('Network timeout');
    }
    
    return 'Success!';
  };

  try {
    console.log('Executing unreliable function with retry...\n');
    
    const result = await callWithRetry(
      unreliableFunction,
      5,     // Max 5 retries
      500    // Delay 500ms
    );
    
    console.log(`\n✓ Result: ${result}\n`);
  } catch (error) {
    console.error(`✗ Failed after multiple retries: ${error.message}\n`);
  }
}

/**
 * Demo 2: Retry with RPC calls
 */
async function demo2_RpcRetry(provider) {
  console.log('📝 Demo 2: Retry for RPC Calls\n');

  try {
    console.log('Getting block number with retry...');
    
    const blockNumber = await rpcCallWithRetry(
      async () => {
        return await provider.getBlockNumber();
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        timeout: 10000, // 10s timeout
      }
    );
    
    console.log(`✓ Block number: ${blockNumber}\n`);

    // Get multiple information at once
    console.log('Getting detailed information...');
    
    const [network, feeData, balance] = await Promise.all([
      rpcCallWithRetry(() => provider.getNetwork()),
      rpcCallWithRetry(() => provider.getFeeData()),
      rpcCallWithRetry(() => provider.getBalance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
      )),
    ]);
    
    console.log(`✓ Network: ${network.name}`);
    console.log(`✓ Gas Price: ${ethers.formatUnits(feeData.gasPrice, 'gwei')} Gwei`);
    console.log(`✓ Balance: ${ethers.formatEther(balance)} ETH\n`);

  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }
}

/**
 * Demo 3: Error classification
 */
async function demo3_ErrorClassification() {
  console.log('📝 Demo 3: Error Classification\n');

  const testErrors = [
    new Error('NETWORK_ERROR: Connection failed'),
    new Error('rate limit exceeded'),
    new Error('nonce too low'),
    new Error('insufficient funds for gas'),
    new Error('TIMEOUT'),
    { code: 'INVALID_ARGUMENT', message: 'Invalid parameter' },
  ];

  console.log('Checking error types:\n');

  testErrors.forEach((error, index) => {
    console.log(`${index + 1}. "${error.message}"`);
    console.log(`   Network Error: ${isNetworkError(error) ? '✓' : '✗'}`);
    console.log(`   Rate Limit: ${isRateLimitError(error) ? '✓' : '✗'}`);
    console.log(`   Can Retry: ${isRetryableError(error) ? '✓ YES' : '✗ NO'}`);
    console.log();
  });
}

/**
 * Demo 4: Retry when sending transaction
 */
async function demo4_TransactionRetry(wallet, provider) {
  console.log('📝 Demo 4: Retry Transaction (DRY RUN)\n');

  const recipientAddress = process.env.RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  try {
    console.log('Checking balance before sending...');
    
    const balance = await rpcCallWithRetry(
      () => provider.getBalance(wallet.address)
    );
    
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    // Estimate gas with retry
    console.log('Estimating gas with retry...');
    
    const gasEstimate = await rpcCallWithRetry(
      async () => {
        return await provider.estimateGas({
          from: wallet.address,
          to: recipientAddress,
          value: ethers.parseEther('0.001'),
        });
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        timeout: 15000,
      }
    );
    
    console.log(`✓ Gas estimate: ${gasEstimate.toString()}\n`);

    console.log('💡 In production, you should:');
    console.log('   1. Retry on network error');
    console.log('   2. DO NOT retry on: insufficient funds, nonce too low');
    console.log('   3. Increase delay on rate limit');
    console.log('   4. Set appropriate timeout for each transaction type');
    console.log('   5. Log details for debugging\n');

    // Uncomment to actually send transaction with retry
    /*
    console.log('Sending transaction with retry...');
    
    const tx = await callWithRetry(
      async () => {
        return await wallet.sendTransaction({
          to: recipientAddress,
          value: ethers.parseEther('0.001'),
          gasLimit: gasEstimate,
        });
      },
      3,  // Max 3 retries
      2000, // 2s delay
      isRetryableError // Only retry on retryable errors
    );
    
    console.log(`✓ Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation with retry
    const receipt = await rpcCallWithRetry(
      () => tx.wait(),
      {
        maxRetries: 5,
        initialDelay: 2000,
        timeout: 60000, // 1 minute
      }
    );
    
    console.log(`✓ Transaction confirmed at block ${receipt.blockNumber}`);
    */

  } catch (error) {
    console.error(`✗ Error: ${error.message}\n`);
  }
}

/**
 * Demo 5: Advanced - Rate Limiting
 */
async function demo5_RateLimiting() {
  console.log('📝 Demo 5: Rate Limiting\n');

  console.log('💡 To avoid rate limit from RPC provider:');
  console.log('   1. Use queue to limit concurrent requests');
  console.log('   2. Add delay between requests');
  console.log('   3. Cache results when possible');
  console.log('   4. Use multiple providers with load balancing');
  console.log('   5. Monitor usage and upgrade plan when needed\n');

  console.log('Example simple rate limiter:');
  console.log(`
  class RateLimiter {
    constructor(maxRequests, perMilliseconds) {
      this.maxRequests = maxRequests;
      this.perMilliseconds = perMilliseconds;
      this.requests = [];
    }
    
    async acquire() {
      const now = Date.now();
      // Remove old requests
      this.requests = this.requests.filter(
        time => now - time < this.perMilliseconds
      );
      
      if (this.requests.length >= this.maxRequests) {
        const oldestRequest = this.requests[0];
        const waitTime = this.perMilliseconds - (now - oldestRequest);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.acquire();
      }
      
      this.requests.push(now);
    }
  }
  
  // Usage
  const limiter = new RateLimiter(5, 1000); // 5 requests/second
  
  await limiter.acquire();
  const result = await provider.getBlockNumber();
  `);
}

// Run demo
async function main() {
  await demoRetryLogic();
  await demo5_RateLimiting();

  console.log('\n✅ Demo complete!\n');
  console.log('📚 Summary:');
  console.log('   ✓ Always implement retry for network operations');
  console.log('   ✓ Use exponential backoff');
  console.log('   ✓ Distinguish retryable vs non-retryable errors');
  console.log('   ✓ Set appropriate timeout');
  console.log('   ✓ Implement rate limiting when needed');
  console.log('   ✓ Log details for debugging');
  console.log('\n   See detailed code in utils/retry.js');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
