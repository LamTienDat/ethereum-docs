/**
 * Ví dụ 6: Retry Logic với Exponential Backoff
 * 
 * Học cách:
 * - Xử lý lỗi network
 * - Retry với exponential backoff
 * - Timeout cho requests
 * - Phân biệt lỗi có thể retry và không thể retry
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
  console.log('=== VÍ DỤ 6: RETRY LOGIC ===\n');

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Demo 1: Retry cơ bản
  await demo1_BasicRetry(provider);

  // Demo 2: Retry với RPC calls
  await demo2_RpcRetry(provider);

  // Demo 3: Phân loại lỗi
  await demo3_ErrorClassification();

  // Demo 4: Retry khi gửi transaction
  await demo4_TransactionRetry(wallet, provider);
}

/**
 * Demo 1: Retry cơ bản
 */
async function demo1_BasicRetry(provider) {
  console.log('📝 Demo 1: Retry Logic Cơ Bản\n');

  // Simulate function có thể fail
  let attemptCount = 0;
  const unreliableFunction = async () => {
    attemptCount++;
    console.log(`   Attempt ${attemptCount}...`);
    
    // Fail 2 lần đầu, thành công lần thứ 3
    if (attemptCount < 3) {
      throw new Error('Network timeout');
    }
    
    return 'Success!';
  };

  try {
    console.log('Đang thực thi function không ổn định với retry...\n');
    
    const result = await callWithRetry(
      unreliableFunction,
      5,     // Max 5 retries
      500    // Delay 500ms
    );
    
    console.log(`\n✓ Kết quả: ${result}\n`);
  } catch (error) {
    console.error(`✗ Thất bại sau nhiều lần retry: ${error.message}\n`);
  }
}

/**
 * Demo 2: Retry với RPC calls
 */
async function demo2_RpcRetry(provider) {
  console.log('📝 Demo 2: Retry cho RPC Calls\n');

  try {
    console.log('Đang lấy block number với retry...');
    
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

    // Lấy nhiều thông tin cùng lúc
    console.log('Đang lấy thông tin chi tiết...');
    
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
    console.error(`✗ Lỗi: ${error.message}\n`);
  }
}

/**
 * Demo 3: Phân loại lỗi
 */
async function demo3_ErrorClassification() {
  console.log('📝 Demo 3: Phân Loại Lỗi\n');

  const testErrors = [
    new Error('NETWORK_ERROR: Connection failed'),
    new Error('rate limit exceeded'),
    new Error('nonce too low'),
    new Error('insufficient funds for gas'),
    new Error('TIMEOUT'),
    { code: 'INVALID_ARGUMENT', message: 'Invalid parameter' },
  ];

  console.log('Kiểm tra các loại lỗi:\n');

  testErrors.forEach((error, index) => {
    console.log(`${index + 1}. "${error.message}"`);
    console.log(`   Network Error: ${isNetworkError(error) ? '✓' : '✗'}`);
    console.log(`   Rate Limit: ${isRateLimitError(error) ? '✓' : '✗'}`);
    console.log(`   Có thể Retry: ${isRetryableError(error) ? '✓ YES' : '✗ NO'}`);
    console.log();
  });
}

/**
 * Demo 4: Retry khi gửi transaction
 */
async function demo4_TransactionRetry(wallet, provider) {
  console.log('📝 Demo 4: Retry Transaction (DRY RUN)\n');

  const recipientAddress = process.env.RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  try {
    console.log('Kiểm tra số dư trước khi gửi...');
    
    const balance = await rpcCallWithRetry(
      () => provider.getBalance(wallet.address)
    );
    
    console.log(`Số dư: ${ethers.formatEther(balance)} ETH\n`);

    // Ước tính gas với retry
    console.log('Ước tính gas với retry...');
    
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

    console.log('💡 Trong production, bạn nên:');
    console.log('   1. Retry khi network error');
    console.log('   2. KHÔNG retry khi: insufficient funds, nonce too low');
    console.log('   3. Increase delay khi rate limit');
    console.log('   4. Set timeout phù hợp cho từng loại transaction');
    console.log('   5. Log chi tiết để debug\n');

    // Uncomment để thực sự gửi transaction với retry
    /*
    console.log('Đang gửi transaction với retry...');
    
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
      isRetryableError // Chỉ retry khi lỗi có thể retry
    );
    
    console.log(`✓ Transaction sent: ${tx.hash}`);
    
    // Chờ confirmation với retry
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
    console.error(`✗ Lỗi: ${error.message}\n`);
  }
}

/**
 * Demo 5: Advanced - Rate Limiting
 */
async function demo5_RateLimiting() {
  console.log('📝 Demo 5: Rate Limiting (Giới hạn số request)\n');

  console.log('💡 Để tránh rate limit từ RPC provider:');
  console.log('   1. Sử dụng queue để giới hạn concurrent requests');
  console.log('   2. Thêm delay giữa các requests');
  console.log('   3. Cache kết quả khi có thể');
  console.log('   4. Sử dụng multiple providers với load balancing');
  console.log('   5. Monitor usage và upgrade plan khi cần\n');

  console.log('Ví dụ simple rate limiter:');
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
  
  // Sử dụng
  const limiter = new RateLimiter(5, 1000); // 5 requests/second
  
  await limiter.acquire();
  const result = await provider.getBlockNumber();
  `);
}

// Chạy demo
async function main() {
  await demoRetryLogic();
  await demo5_RateLimiting();

  console.log('\n✅ Demo hoàn thành!\n');
  console.log('📚 Tóm tắt:');
  console.log('   ✓ Luôn implement retry cho network operations');
  console.log('   ✓ Sử dụng exponential backoff');
  console.log('   ✓ Phân biệt lỗi có thể retry vs không thể retry');
  console.log('   ✓ Set timeout phù hợp');
  console.log('   ✓ Implement rate limiting khi cần');
  console.log('   ✓ Log chi tiết để debug');
  console.log('\n   Xem code chi tiết trong utils/retry.js');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  });

