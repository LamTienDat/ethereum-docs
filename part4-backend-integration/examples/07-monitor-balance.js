/**
 * Example 7: Monitor Balance and Alert
 * 
 * Learn how to:
 * - Monitor wallet balance regularly
 * - Send alert on low balance
 * - Track balance changes
 * - Logging and reporting
 */

require('dotenv').config();
const WalletManager = require('../src/WalletManager');
const { rpcCallWithRetry } = require('../utils/retry');

class BalanceMonitor {
  constructor(walletManager, options = {}) {
    this.walletManager = walletManager;
    this.interval = options.interval || 30000; // 30s default
    this.minBalanceAlert = options.minBalanceAlert || 0.1; // 0.1 ETH
    this.lastBalance = null;
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start monitoring
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running');
      return;
    }

    console.log('🚀 Starting balance monitor...');
    console.log(`   Interval: ${this.interval / 1000}s`);
    console.log(`   Alert threshold: ${this.minBalanceAlert} ETH\n`);

    this.isRunning = true;

    // Check immediately
    this.checkBalance();

    // Schedule periodic checks
    this.intervalId = setInterval(() => {
      this.checkBalance();
    }, this.interval);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('\n🛑 Monitor stopped');
  }

  /**
   * Check balance
   */
  async checkBalance() {
    try {
      const timestamp = new Date().toISOString();
      
      // Get ETH balance
      const balance = await rpcCallWithRetry(
        () => this.walletManager.getBalance()
      );
      const balanceNum = parseFloat(balance);

      // Log
      console.log(`[${timestamp}] 💰 Balance: ${balance} ETH`);

      // Check changes
      if (this.lastBalance !== null) {
        const change = balanceNum - this.lastBalance;
        if (change !== 0) {
          const emoji = change > 0 ? '📈' : '📉';
          console.log(`  ${emoji} Change: ${change > 0 ? '+' : ''}${change.toFixed(6)} ETH`);
        }
      }

      // Alert if balance is low
      if (balanceNum < this.minBalanceAlert) {
        this.sendLowBalanceAlert(balanceNum);
      }

      this.lastBalance = balanceNum;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Error: ${error.message}`);
    }
  }

  /**
   * Send alert on low balance
   */
  sendLowBalanceAlert(balance) {
    console.log('\n⚠️  🚨 LOW BALANCE ALERT! 🚨');
    console.log(`   Current: ${balance} ETH`);
    console.log(`   Threshold: ${this.minBalanceAlert} ETH`);
    console.log(`   Action Required: Top up wallet!\n`);

    // In production, send email/SMS/webhook
    // await this.sendEmail(balance);
    // await this.sendSlackNotification(balance);
    // await this.sendTelegramMessage(balance);
  }
}

/**
 * Demo monitor with token balance
 */
async function monitorWithTokens(walletManager) {
  console.log('\n📊 Monitor ETH and Token\n');

  const tokenAddress = process.env.USDT_ADDRESS;
  
  if (!tokenAddress || !WalletManager.isValidAddress(tokenAddress)) {
    console.log('⚠️  No valid token address to monitor\n');
    return;
  }

  try {
    // Get token info
    const tokenInfo = await walletManager.getTokenInfo(tokenAddress);
    console.log(`Token: ${tokenInfo.name} (${tokenInfo.symbol})\n`);

    // Check balance once
    const [ethBalance, tokenBalance] = await Promise.all([
      walletManager.getBalance(),
      walletManager.getTokenBalance(tokenAddress),
    ]);

    console.log('📊 Balance Snapshot:');
    console.log(`   ETH: ${ethBalance}`);
    console.log(`   ${tokenBalance.symbol}: ${tokenBalance.balance}\n`);

  } catch (error) {
    console.error(`Error monitoring token: ${error.message}\n`);
  }
}

/**
 * Demo detailed logging
 */
function demoLogging() {
  console.log('\n📝 Best Practices for Logging:\n');
  
  console.log('1. Structured Logging:');
  console.log(`
  const log = {
    timestamp: new Date().toISOString(),
    wallet: walletManager.getAddress(),
    balance: balance,
    network: 'sepolia',
    blockNumber: blockNumber,
  };
  console.log(JSON.stringify(log));
  `);

  console.log('\n2. Log Levels:');
  console.log('   INFO  - Normal operations');
  console.log('   WARN  - Low balance, rate limit');
  console.log('   ERROR - Failed transactions, network errors');
  console.log('   DEBUG - Detailed debugging info');

  console.log('\n3. Monitoring Tools:');
  console.log('   - Winston / Pino for logging');
  console.log('   - Prometheus for metrics');
  console.log('   - Grafana for visualization');
  console.log('   - Sentry for error tracking');

  console.log('\n4. Alerts:');
  console.log('   - Email (Sendgrid, AWS SES)');
  console.log('   - SMS (Twilio)');
  console.log('   - Slack/Discord webhook');
  console.log('   - Telegram bot');
  console.log('   - PagerDuty for on-call');
}

// Main
async function main() {
  console.log('=== EXAMPLE 7: MONITOR BALANCE ===\n');

  try {
    // Setup wallet manager
    const walletManager = new WalletManager(
      process.env.RPC_URL,
      process.env.PRIVATE_KEY
    );

    console.log(`📍 Wallet: ${walletManager.getAddress()}\n`);

    // Demo 1: Monitor ETH balance
    const monitor = new BalanceMonitor(walletManager, {
      interval: parseInt(process.env.MONITOR_INTERVAL) || 30000,
      minBalanceAlert: parseFloat(process.env.MIN_BALANCE_ALERT) || 0.1,
    });

    // Demo 2: Monitor with tokens
    await monitorWithTokens(walletManager);

    // Demo 3: Logging best practices
    demoLogging();

    // Run monitor for 2 minutes
    console.log('\n🚀 Starting monitor (will run for 2 minutes)...\n');
    monitor.start();

    // Stop after 2 minutes
    setTimeout(() => {
      monitor.stop();
      
      console.log('\n✅ Demo complete!\n');
      console.log('💡 In Production:');
      console.log('   - Run monitor as background service');
      console.log('   - Implement proper error handling');
      console.log('   - Setup alerts (Email, SMS, Slack)');
      console.log('   - Use monitoring tools (Prometheus, Grafana)');
      console.log('   - Store metrics in database');
      console.log('   - Create dashboard for visualization');
      
      process.exit(0);
    }, 120000); // 2 minutes

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping monitor...');
  process.exit(0);
});

main();
