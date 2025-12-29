/**
 * Retry Helper - Xử lý retry logic với exponential backoff
 * 
 * Tính năng:
 * - Retry với số lần tùy chỉnh
 * - Exponential backoff
 * - Logging chi tiết
 */

/**
 * Thực thi function với retry logic
 * @param {Function} fn - Function cần thực thi
 * @param {number} maxRetries - Số lần retry tối đa (mặc định 3)
 * @param {number} delay - Thời gian chờ ban đầu ms (mặc định 1000)
 * @param {Function} shouldRetry - Function kiểm tra có nên retry không
 * @returns {Promise<any>}
 */
async function callWithRetry(
  fn,
  maxRetries = 3,
  delay = 1000,
  shouldRetry = null
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Thực thi function
      const result = await fn();
      
      // Thành công
      if (attempt > 0) {
        console.log(`✓ Thành công sau ${attempt + 1} lần thử`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      console.error(`❌ Lần thử ${attempt + 1}/${maxRetries} thất bại:`);
      console.error(`   Lỗi: ${error.message}`);

      // Kiểm tra xem có nên retry không
      if (shouldRetry && !shouldRetry(error)) {
        console.error('   → Lỗi không thể retry, dừng lại');
        throw error;
      }

      // Nếu đã hết số lần retry
      if (attempt === maxRetries - 1) {
        console.error('   → Đã hết số lần retry');
        throw error;
      }

      // Tính thời gian chờ với exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      console.log(`   ⏳ Đợi ${waitTime}ms trước khi thử lại...\n`);
      
      await sleep(waitTime);
    }
  }

  throw lastError;
}

/**
 * Sleep helper
 * @param {number} ms - Milliseconds
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry với timeout
 * @param {Function} fn - Function cần thực thi
 * @param {number} timeoutMs - Timeout milliseconds
 * @param {string} timeoutMessage - Message khi timeout
 * @returns {Promise<any>}
 */
async function callWithTimeout(fn, timeoutMs, timeoutMessage = 'Operation timeout') {
  return Promise.race([
    fn(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

/**
 * Kiểm tra lỗi có phải network error không
 * @param {Error} error
 * @returns {boolean}
 */
function isNetworkError(error) {
  const networkErrorCodes = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVER_ERROR',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
  ];

  return networkErrorCodes.some(code => 
    error.code === code || error.message.includes(code)
  );
}

/**
 * Kiểm tra lỗi có phải rate limit không
 * @param {Error} error
 * @returns {boolean}
 */
function isRateLimitError(error) {
  return (
    error.message.includes('rate limit') ||
    error.message.includes('too many requests') ||
    error.code === 429
  );
}

/**
 * Kiểm tra lỗi có thể retry không
 * @param {Error} error
 * @returns {boolean}
 */
function isRetryableError(error) {
  // Network errors - có thể retry
  if (isNetworkError(error)) {
    return true;
  }

  // Rate limit - có thể retry với delay lớn hơn
  if (isRateLimitError(error)) {
    return true;
  }

  // Nonce too low - không nên retry
  if (error.message.includes('nonce too low')) {
    return false;
  }

  // Insufficient funds - không nên retry
  if (error.message.includes('insufficient funds')) {
    return false;
  }

  // Invalid parameter - không nên retry
  if (error.code === 'INVALID_ARGUMENT') {
    return false;
  }

  // Các lỗi khác - retry
  return true;
}

/**
 * Retry wrapper cho RPC calls
 * @param {Function} fn - RPC function
 * @param {Object} options - Options
 * @returns {Promise<any>}
 */
async function rpcCallWithRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    timeout = 30000, // 30s
  } = options;

  return callWithRetry(
    async () => {
      return await callWithTimeout(
        fn,
        timeout,
        'RPC call timeout'
      );
    },
    maxRetries,
    initialDelay,
    isRetryableError
  );
}

module.exports = {
  callWithRetry,
  callWithTimeout,
  rpcCallWithRetry,
  isNetworkError,
  isRateLimitError,
  isRetryableError,
  sleep,
};

