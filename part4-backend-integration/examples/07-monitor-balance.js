/**
 * Ví dụ 7: Monitor Balance và Alert
 * 
 * Học cách:
 * - Monitor số dư wallet định kỳ
 * - Gửi alert khi số dư thấp
 * - Track thay đổi số dư
 * - Logging và reporting
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
   * Bắt đầu monitor
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Monitor đã đang chạy');
      return;
    }

    console.log('🚀 Bắt đầu monitor balance...');
    console.log(`   Interval: ${this.interval / 1000}s`);
    console.log(`   Alert threshold: ${this.minBalanceAlert} ETH\n`);

    this.isRunning = true;

    // Check ngay lập tức
    this.checkBalance();

    // Schedule check định kỳ
    this.intervalId = setInterval(() => {
      this.checkBalance();
    }, this.interval);
  }

  /**
   * Dừng monitor
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('\n🛑 Đã dừng monitor');
  }

  /**
   * Kiểm tra số dư
   */
  async checkBalance() {
    try {
      const timestamp = new Date().toISOString();
      
      // Lấy số dư ETH
      const balance = await rpcCallWithRetry(
        () => this.walletManager.getBalance()
      );
      const balanceNum = parseFloat(balance);

      // Log
      console.log(`[${timestamp}] 💰 Balance: ${balance} ETH`);

      // Check thay đổi
      if (this.lastBalance !== null) {
        const change = balanceNum - this.lastBalance;
        if (change !== 0) {
          const emoji = change > 0 ? '📈' : '📉';
          console.log(`  ${emoji} Change: ${change > 0 ? '+' : ''}${change.toFixed(6)} ETH`);
        }
      }

      // Alert nếu số dư thấp
      if (balanceNum < this.minBalanceAlert) {
        this.sendLowBalanceAlert(balanceNum);
      }

      this.lastBalance = balanceNum;

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Lỗi: ${error.message}`);
    }
  }

  /**
   * Gửi alert khi số dư thấp
   */
  sendLowBalanceAlert(balance) {
    console.log('\n⚠️  🚨 LOW BALANCE ALERT! 🚨');
    console.log(`   Current: ${balance} ETH`);
    console.log(`   Threshold: ${this.minBalanceAlert} ETH`);
    console.log(`   Action Required: Top up wallet!\n`);

    // Trong production, gửi email/SMS/webhook
    // await this.sendEmail(balance);
    // await this.sendSlackNotification(balance);
    // await this.sendTelegramMessage(balance);
  }
}

/**
 * Demo monitor với token balance
 */
async function monitorWithTokens(walletManager) {
  console.log('\n📊 Monitor cả ETH và Token\n');

  const tokenAddress = process.env.USDT_ADDRESS;
  
  if (!tokenAddress || !WalletManager.isValidAddress(tokenAddress)) {
    console.log('⚠️  Không có token address hợp lệ để monitor\n');
    return;
  }

  try {
    // Lấy thông tin token
    const tokenInfo = await walletManager.getTokenInfo(tokenAddress);
    console.log(`Token: ${tokenInfo.name} (${tokenInfo.symbol})\n`);

    // Check balance một lần
    const [ethBalance, tokenBalance] = await Promise.all([
      walletManager.getBalance(),
      walletManager.getTokenBalance(tokenAddress),
    ]);

    console.log('📊 Balance Snapshot:');
    console.log(`   ETH: ${ethBalance}`);
    console.log(`   ${tokenBalance.symbol}: ${tokenBalance.balance}\n`);

  } catch (error) {
    console.error(`Lỗi khi monitor token: ${error.message}\n`);
  }
}

/**
 * Demo logging chi tiết
 */
function demoLogging() {
  console.log('\n📝 Best Practices cho Logging:\n');
  
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
  console.log('   - Winston / Pino cho logging');
  console.log('   - Prometheus cho metrics');
  console.log('   - Grafana cho visualization');
  console.log('   - Sentry cho error tracking');

  console.log('\n4. Alerts:');
  console.log('   - Email (Sendgrid, AWS SES)');
  console.log('   - SMS (Twilio)');
  console.log('   - Slack/Discord webhook');
  console.log('   - Telegram bot');
  console.log('   - PagerDuty cho on-call');
}

// Main
async function main() {
  console.log('=== VÍ DỤ 7: MONITOR BALANCE ===\n');

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

    // Demo 2: Monitor với tokens
    await monitorWithTokens(walletManager);

    // Demo 3: Logging best practices
    demoLogging();

    // Chạy monitor trong 2 phút
    console.log('\n🚀 Bắt đầu monitor (sẽ chạy 2 phút)...\n');
    monitor.start();

    // Dừng sau 2 phút
    setTimeout(() => {
      monitor.stop();
      
      console.log('\n✅ Demo hoàn thành!\n');
      console.log('💡 Trong Production:');
      console.log('   - Run monitor as background service');
      console.log('   - Implement proper error handling');
      console.log('   - Setup alerts (Email, SMS, Slack)');
      console.log('   - Use monitoring tools (Prometheus, Grafana)');
      console.log('   - Store metrics in database');
      console.log('   - Create dashboard for visualization');
      
      process.exit(0);
    }, 120000); // 2 minutes

  } catch (error) {
    console.error('\n❌ Lỗi:', error);
    process.exit(1);
  }
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 Đang dừng monitor...');
  process.exit(0);
});

main();

