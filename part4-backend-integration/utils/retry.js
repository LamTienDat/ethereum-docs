/**
 * Retry Helper - Handle retry logic with exponential backoff
 * 
 * Features:
 * - Retry with customizable attempts
 * - Exponential backoff
 * - Detailed logging
 */

/**
 * Execute function with retry logic
 * @param {Function} fn - Function to execute
 * @param {number} maxRetries - Maximum retry attempts (default 3)
 * @param {number} delay - Initial wait time in ms (default 1000)
 * @param {Function} shouldRetry - Function to check if should retry
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
      // Execute function
      const result = await fn();
      
      // Success
      if (attempt > 0) {
        console.log(`✓ Succeeded after ${attempt + 1} attempt(s)`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      console.error(`❌ Attempt ${attempt + 1}/${maxRetries} failed:`);
      console.error(`   Error: ${error.message}`);

      // Check if should retry
      if (shouldRetry && !shouldRetry(error)) {
        console.error('   → Error is not retryable, stopping');
        throw error;
      }

      // If out of retry attempts
      if (attempt === maxRetries - 1) {
        console.error('   → Out of retry attempts');
        throw error;
      }

      // Calculate wait time with exponential backoff
      const waitTime = delay * Math.pow(2, attempt);
      console.log(`   ⏳ Waiting ${waitTime}ms before retry...\n`);
      
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
 * Retry with timeout
 * @param {Function} fn - Function to execute
 * @param {number} timeoutMs - Timeout milliseconds
 * @param {string} timeoutMessage - Message on timeout
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
 * Check if error is network error
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
 * Check if error is rate limit error
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
 * Check if error is retryable
 * @param {Error} error
 * @returns {boolean}
 */
function isRetryableError(error) {
  // Network errors - can retry
  if (isNetworkError(error)) {
    return true;
  }

  // Rate limit - can retry with larger delay
  if (isRateLimitError(error)) {
    return true;
  }

  // Nonce too low - should not retry
  if (error.message.includes('nonce too low')) {
    return false;
  }

  // Insufficient funds - should not retry
  if (error.message.includes('insufficient funds')) {
    return false;
  }

  // Invalid parameter - should not retry
  if (error.code === 'INVALID_ARGUMENT') {
    return false;
  }

  // Other errors - retry
  return true;
}

/**
 * Retry wrapper for RPC calls
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
