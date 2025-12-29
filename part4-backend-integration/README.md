# Part 4: Off-chain Integration (Backend Node.js)

Example project for integrating Ethereum with Backend Node.js, including wallet management, automated transaction sending, RPC provider management, and monitoring.

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Examples](#examples)
- [WalletManager Class](#walletmanager-class)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

Backend plays a crucial role in blockchain systems, handling tasks such as:

- ✅ Automated transaction sending
- ✅ Secure private key management
- ✅ Event and balance monitoring
- ✅ Retry logic and error handling
- ✅ Integration with database and other services

### What You'll Learn

1. **Backend Wallet Management**

   - Create wallet from private key
   - Manage multiple wallets
   - Security best practices

2. **RPC Provider**

   - Types of providers (Alchemy, Infura, Public RPC)
   - FallbackProvider for high availability
   - Performance optimization

3. **Transaction Management**

   - Send ETH and ERC20 tokens
   - Gas estimation
   - Nonce management
   - Retry logic

4. **Monitoring & Alerting**
   - Automated balance monitoring
   - Low balance alerts
   - Logging and reporting

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies (1 minute)

```bash
cd part4-backend-integration
npm install
```

### Step 2: Generate Wallet (1 minute)

```bash
npm run generate
```

This will create a new wallet and display:

- Address
- Private Key
- Mnemonic Phrase

**⚠️ Save the Private Key securely!**

### Step 3: Get Testnet ETH (2 minutes)

Visit Sepolia faucet and request ETH:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

Paste your wallet address and wait ~1 minute.

### Step 4: Configure Environment (1 minute)

Create `.env` file:

```bash
# Copy example
cp .env.example .env

# Edit with your information
nano .env
```

Required configuration:

```bash
PRIVATE_KEY=0x...your_private_key_from_step2...
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Get free Alchemy API key:** https://www.alchemy.com/

### Step 5: Test Connection

```bash
npm run wallet
```

If you see your ETH balance → **Success!** 🎉

## 📦 Installation

### Requirements

- Node.js >= 16.0.0
- npm or pnpm
- Ethereum wallet with testnet ETH (Sepolia)
- Alchemy or Infura API key (free tier)

## ⚙️ Configuration

### `.env` File

```bash
# RPC Provider URL
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# API Keys
ALCHEMY_API_KEY=your_alchemy_api_key
INFURA_API_KEY=your_infura_api_key

# Wallet Private Key
PRIVATE_KEY=0x...your_private_key...

# Addresses
RECIPIENT_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
USDT_ADDRESS=0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

# Monitoring
MONITOR_INTERVAL=30000
MIN_BALANCE_ALERT=0.1
```

### 🔐 Private Key Security

**⚠️ IMPORTANT:**

- **NEVER** commit private key to Git
- `.env` file is already added to `.gitignore`
- In production, use secret management:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault
  - Google Secret Manager

### Get Testnet ETH

Sepolia Testnet:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)

### Register RPC Provider (Free)

1. **Alchemy** (Recommended): https://www.alchemy.com/

   - Sign up → Create app → Copy API key

2. **Infura**: https://infura.io/
   - Sign up → Create project → Copy API key

## 📚 Examples (All Running on Sepolia Testnet)

**⚠️ Important Notes:**

- All examples run on **Sepolia Testnet** by default
- Make sure you have testnet ETH in your wallet
- Check your `.env` configuration before running
- Monitor your transactions on [Sepolia Etherscan](https://sepolia.etherscan.io/)

### Example 1: Basic Wallet

Learn how to create a wallet and check information on Sepolia.

```bash
npm run wallet
```

**What it does:**

- Connects to Sepolia via RPC Provider
- Creates wallet from your private key
- Checks your ETH balance on Sepolia
- Gets current Sepolia blockchain information
- Shows gas price and block number

**Expected Output:**

```
=== EXAMPLE 1: BASIC WALLET ===

📡 Connecting to RPC Provider...
✓ Connected successfully!
   Network: sepolia (Chain ID: 11155111)

🔐 Creating wallet from private key...
✓ Wallet created!
   Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

💰 Checking balance...
✓ ETH Balance: 0.5 ETH
   (Wei: 500000000000000000)

⛓️  Blockchain information:
   Current block: 5234567
   Gas Price: 2.5 Gwei

📊 Wallet information:
   Transaction count: 3
   (Number of transactions sent from this wallet)

✅ Complete!
```

**File:** `examples/01-wallet-basic.js`

---

### Example 2: Send ETH on Sepolia

Learn how to send ETH from backend on Sepolia testnet.

```bash
npm run send-eth
# Or specify amount
node examples/02-send-eth.js 0.01
```

**What it does:**

- Connects to Sepolia network
- Checks your balance before sending
- Estimates gas fee on Sepolia
- Prepares transaction (DRY RUN by default)
- Shows total cost including gas

**Expected Output:**

```
=== EXAMPLE 2: SEND ETH FROM BACKEND ===

📡 Connecting...
✓ Connected: sepolia (Chain ID: 11155111)

📋 Transaction information:
   From: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   Amount: 0.01 ETH

💰 Checking balance...
   Current balance: 0.5 ETH
   ✓ Balance sufficient for transaction

⛽ Estimating gas fee...
   Gas Price: 2.5 Gwei
   Gas Limit: 21000
   Estimated gas fee: ~0.0000525 ETH

💡 Total cost: ~0.0100525 ETH (including gas)

ℹ️  This is DRY RUN mode (not sending real transaction)
   To send for real, uncomment code section from lines 60-87

✅ Complete!
```

**To Send Real Transaction:**

1. Open `examples/02-send-eth.js`
2. Uncomment lines 64-90 (the actual sending code)
3. Run again: `npm run send-eth`
4. Check transaction on [Sepolia Etherscan](https://sepolia.etherscan.io/)

**File:** `examples/02-send-eth.js`

⚠️ **Note:** Default is DRY RUN. This is testnet ETH, but still be careful!

---

### Example 3: Send ERC20 Token on Sepolia

Learn how to send ERC20 tokens on Sepolia testnet.

```bash
npm run send-token

# Or specify token and amount
node examples/03-send-token.js <token_address> <recipient> <amount>
```

**What it does:**

- Connects to Sepolia network
- Connects to ERC20 contract on Sepolia
- Gets token info (name, symbol, decimals)
- Checks your token balance
- Prepares token transfer (DRY RUN by default)

**Example Sepolia Tokens:**

- USDT: `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`
- LINK: `0x779877A7B0D9E8603169DdbD7836e478b4624789`
- DAI: `0x68194a729C2450ad26072b3D33ADaCbcef39D574`

**Expected Output:**

```
=== EXAMPLE 3: SEND ERC20 TOKEN ===

📡 Connecting...
✓ Connected: sepolia

🪙 Connecting to token contract...
📋 Token information:
   Name: Tether USD
   Symbol: USDT
   Decimals: 6
   Contract: 0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

💰 Checking token balance...
   Current balance: 100.0 USDT
   Amount to send: 10 USDT
   ✓ Balance sufficient for transaction

⛽ Estimating gas...
   Gas estimate: 65000
   Gas price: 2.5 Gwei
   Estimated gas fee: ~0.0001625 ETH

📤 Transaction information:
   From: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   Token: USDT
   Amount: 10 USDT

⚠️  WARNING: DRY RUN mode (not sending)
   Uncomment lines 95-111 to execute real transaction

✅ Complete!
```

**File:** `examples/03-send-token.js`

---

### Example 4: WalletManager Class on Sepolia

Demo WalletManager class with full features on Sepolia.

```bash
npm run wallet-manager
```

**What it does:**

- Initializes WalletManager connected to Sepolia
- Gets Sepolia network information
- Checks ETH balance on Sepolia
- Gets current gas prices on Sepolia
- Checks token balances (if configured)
- Estimates gas for transactions
- Demonstrates message signing
- Validates Ethereum addresses

**Expected Output:**

```
=== EXAMPLE 4: WALLET MANAGER CLASS ===

🔧 Initializing WalletManager...
✓ Wallet Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

🌐 Network Information:
   Name: sepolia
   Chain ID: 11155111

💰 ETH Balance:
   0.5 ETH

⛽ Gas Information:
   Gas Price: 2.5 Gwei
   Max Fee: 3.0 Gwei
   Priority Fee: 1.5 Gwei

⛓️  Blockchain Info:
   Current Block: 5234567
   Transaction Count: 3

🪙 Token Information:
   Name: Tether USD
   Symbol: USDT
   Decimals: 6
   Balance: 100.0 USDT

📊 Gas Estimation for ETH Transfer:
   Gas Limit: 21000
   Gas Price: 2.5 Gwei
   Estimated Cost: 0.0000525 ETH

✍️  Sign Message:
   Message: "Hello from WalletManager!"
   Signature: 0x1234567890abcdef...
   Verified: ✓

🔍 Validate Address:
   0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb: ✓ Valid
   0xinvalid: ✗ Invalid
   not-an-address: ✗ Invalid

✅ Demo complete!
```

**File:** `examples/04-wallet-manager.js`

---

### Example 5: RPC Provider Comparison

Learn about different RPC provider types for Sepolia.

```bash
npm run rpc-provider
```

**What it does:**

- Tests JsonRpcProvider with Sepolia
- Tests AlchemyProvider (if API key configured)
- Tests InfuraProvider (if API key configured)
- Demonstrates FallbackProvider setup
- Compares performance of different providers

**Expected Output:**

```
=== EXAMPLE 5: RPC PROVIDER ===

📡 1. JsonRpcProvider (Direct RPC URL):
   ✓ Block number: 5234567

📡 2. AlchemyProvider:
   ✓ Block number: 5234567

📡 3. InfuraProvider:
   ⚠️ Need to setup INFURA_API_KEY in .env

📡 4. WebSocketProvider (for realtime):
   ℹ️ WebSocket is good for listening to realtime events
   Example: wss://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

📡 5. FallbackProvider (High reliability):
   Automatically switches provider when one fails

   Setting up FallbackProvider with 2 providers...
   ✓ Block number: 5234567
   ✓ Time: 250ms
   ✓ If main provider fails, automatically switches to backup

📊 Performance Comparison:

   Testing 2 provider(s)...

   JsonRpcProvider:
     Time: 750ms
     Average: ~250ms/request

   AlchemyProvider:
     Time: 600ms
     Average: ~200ms/request

✅ Demo complete!

💡 Best Practices:
   - Use Alchemy/Infura for production
   - Implement FallbackProvider for high availability
   - Monitor performance and error rate
   - Use WebSocket for realtime events
```

**File:** `examples/05-rpc-provider.js`

---

### Example 6: Retry Logic with Sepolia

Learn how to handle errors and retry when working with Sepolia.

```bash
npm run retry-logic
```

**What it does:**

- Demonstrates basic retry logic
- Shows exponential backoff strategy
- Classifies different error types
- Tests retry with Sepolia RPC calls
- Handles network errors and timeouts

**Expected Output:**

```
=== EXAMPLE 6: RETRY LOGIC ===

📝 Demo 1: Basic Retry Logic

Executing unreliable function with retry...

   Attempt 1...
❌ Attempt 1/5 failed:
   Error: Network timeout
   ⏳ Waiting 500ms before retry...

   Attempt 2...
❌ Attempt 2/5 failed:
   Error: Network timeout
   ⏳ Waiting 1000ms before retry...

   Attempt 3...

✓ Result: Success!

📝 Demo 2: Retry for RPC Calls

Getting block number with retry...
✓ Block number: 5234567

Getting detailed information...
✓ Network: sepolia
✓ Gas Price: 2.5 Gwei
✓ Balance: 0.5 ETH

📝 Demo 3: Error Classification

Checking error types:

1. "NETWORK_ERROR: Connection failed"
   Network Error: ✓
   Rate Limit: ✗
   Can Retry: ✓ YES

2. "rate limit exceeded"
   Network Error: ✗
   Rate Limit: ✓
   Can Retry: ✓ YES

3. "nonce too low"
   Network Error: ✗
   Rate Limit: ✗
   Can Retry: ✗ NO

4. "insufficient funds for gas"
   Network Error: ✗
   Rate Limit: ✗
   Can Retry: ✗ NO

📝 Demo 4: Retry Transaction (DRY RUN)

Checking balance before sending...
Balance: 0.5 ETH

Estimating gas with retry...
✓ Gas estimate: 21000

💡 In production, you should:
   1. Retry on network error
   2. DO NOT retry on: insufficient funds, nonce too low
   3. Increase delay on rate limit
   4. Set appropriate timeout for each transaction type
   5. Log details for debugging

✅ Demo complete!
```

**File:** `examples/06-retry-logic.js`

---

### Example 7: Monitor Balance on Sepolia

Monitor your Sepolia wallet balance with automated alerts.

```bash
npm run monitor
```

**What it does:**

- Monitors your Sepolia wallet balance every 30 seconds
- Tracks balance changes in real-time
- Sends alerts if balance drops below threshold
- Demonstrates structured logging
- Shows best practices for monitoring

**Expected Output:**

```
=== EXAMPLE 7: MONITOR BALANCE ===

📍 Wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

📊 Monitor ETH and Token

Token: Tether USD (USDT)

📊 Balance Snapshot:
   ETH: 0.5
   USDT: 100.0

📝 Best Practices for Logging:

1. Structured Logging:
  const log = {
    timestamp: new Date().toISOString(),
    wallet: walletManager.getAddress(),
    balance: balance,
    network: 'sepolia',
    blockNumber: blockNumber,
  };
  console.log(JSON.stringify(log));

2. Log Levels:
   INFO  - Normal operations
   WARN  - Low balance, rate limit
   ERROR - Failed transactions, network errors
   DEBUG - Detailed debugging info

3. Monitoring Tools:
   - Winston / Pino for logging
   - Prometheus for metrics
   - Grafana for visualization
   - Sentry for error tracking

4. Alerts:
   - Email (Sendgrid, AWS SES)
   - SMS (Twilio)
   - Slack/Discord webhook
   - Telegram bot
   - PagerDuty for on-call

🚀 Starting monitor (will run for 2 minutes)...

[2024-01-15T10:30:00.000Z] 💰 Balance: 0.5 ETH

[2024-01-15T10:30:30.000Z] 💰 Balance: 0.5 ETH

[2024-01-15T10:31:00.000Z] 💰 Balance: 0.49 ETH
  📉 Change: -0.01 ETH

⚠️  🚨 LOW BALANCE ALERT! 🚨
   Current: 0.09 ETH
   Threshold: 0.1 ETH
   Action Required: Top up wallet!

🛑 Monitor stopped

✅ Demo complete!

💡 In Production:
   - Run monitor as background service
   - Implement proper error handling
   - Setup alerts (Email, SMS, Slack)
   - Use monitoring tools (Prometheus, Grafana)
   - Store metrics in database
   - Create dashboard for visualization
```

**File:** `examples/07-monitor-balance.js`

⚠️ **Note:** Script runs for 2 minutes then stops automatically. Press `Ctrl+C` to stop early.

**Real-world Usage:**

```bash
# Run in background with PM2
pm2 start examples/07-monitor-balance.js --name "sepolia-monitor"

# View logs
pm2 logs sepolia-monitor

# Stop monitor
pm2 stop sepolia-monitor
```

---

## 🔍 Verify Your Transactions

All transactions can be viewed on Sepolia Etherscan:

**Sepolia Etherscan:** https://sepolia.etherscan.io/

### Check Your Wallet

```
https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS
```

### Check Transaction

```
https://sepolia.etherscan.io/tx/YOUR_TX_HASH
```

### Check Token Balance

```
https://sepolia.etherscan.io/token/TOKEN_ADDRESS?a=YOUR_WALLET_ADDRESS
```

**Example:**

- Your wallet: https://sepolia.etherscan.io/address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- USDT token: https://sepolia.etherscan.io/token/0x7169D38820dfd117C3FA1f22a697dBA58d90BA06

---

## 🏗️ WalletManager Class

Production-ready wallet management class with full features.

### Initialization

```javascript
const WalletManager = require("./src/WalletManager");

const walletManager = new WalletManager(
  process.env.RPC_URL,
  process.env.PRIVATE_KEY
);
```

### Main Methods

#### Balance Management

```javascript
// Get ETH balance
const balance = await walletManager.getBalance();

// Get token balance
const tokenBalance = await walletManager.getTokenBalance(tokenAddress);

// Get token info
const tokenInfo = await walletManager.getTokenInfo(tokenAddress);
```

#### Send Transactions

```javascript
// Send ETH
const result = await walletManager.sendETH(toAddress, "0.1");

// Send Token
const result = await walletManager.sendToken(tokenAddress, toAddress, "100");
```

#### Gas & Estimation

```javascript
// Estimate gas
const gasEstimate = await walletManager.estimateGas(
  toAddress,
  ethers.parseEther("0.1")
);

// Get fee data
const feeData = await walletManager.getFeeData();
```

#### Signing

```javascript
// Sign message
const signature = await walletManager.signMessage("Hello World");

// Verify signature
const signer = walletManager.verifyMessage("Hello World", signature);
```

#### Blockchain Info

```javascript
// Block number
const blockNumber = await walletManager.getBlockNumber();

// Block info
const block = await walletManager.getBlock(blockNumber);

// Transaction count (nonce)
const txCount = await walletManager.getTransactionCount();

// Transaction info
const tx = await walletManager.getTransaction(txHash);
const receipt = await walletManager.getTransactionReceipt(txHash);
```

#### Utilities

```javascript
// Get address
const address = walletManager.getAddress();

// Validate address
const isValid = WalletManager.isValidAddress(address);

// Format address (checksum)
const formatted = WalletManager.formatAddress(address);
```

### See More

File: `src/WalletManager.js`

---

## 🔧 Retry Utilities

Helper functions for retry logic.

```javascript
const {
  callWithRetry,
  rpcCallWithRetry,
  isRetryableError,
} = require("./utils/retry");

// Basic retry
const result = await callWithRetry(
  async () => {
    return await someFunction();
  },
  3, // max retries
  1000 // initial delay
);

// RPC retry with options
const blockNumber = await rpcCallWithRetry(() => provider.getBlockNumber(), {
  maxRetries: 3,
  initialDelay: 1000,
  timeout: 10000,
});
```

File: `utils/retry.js`

---

## ✅ Best Practices

### 1. Security

- ✅ Store private keys in environment variables
- ✅ Use `.gitignore` for `.env`
- ✅ Encrypt private keys in database
- ✅ Use secret management service (production)
- ✅ Rotate keys regularly
- ✅ Separate hot wallet and cold wallet

### 2. RPC Provider

- ✅ Use Alchemy/Infura for production
- ✅ Implement FallbackProvider
- ✅ Monitor rate limits
- ✅ Cache results when possible
- ✅ Implement retry logic
- ✅ Set appropriate timeouts

### 3. Transaction Management

- ✅ Validate input before sending
- ✅ Check balance before transaction
- ✅ Estimate gas accurately
- ✅ Handle nonce properly
- ✅ Implement retry for network errors
- ✅ Wait for confirmations
- ✅ Log all transactions

### 4. Error Handling

- ✅ Classify errors (retryable vs fatal)
- ✅ Exponential backoff for retry
- ✅ Set appropriate max retries
- ✅ Log detailed errors
- ✅ Alert for critical errors
- ✅ Handle edge cases

### 5. Monitoring

- ✅ Monitor balance regularly
- ✅ Track gas prices
- ✅ Alert on low balance
- ✅ Log all operations
- ✅ Metrics and dashboards
- ✅ Health checks

### 6. Performance

- ✅ Cache token info
- ✅ Batch requests when possible
- ✅ Use connection pooling
- ✅ Optimize RPC calls
- ✅ Implement rate limiting
- ✅ Load balancing for multiple providers

---

## 🐛 Troubleshooting

### RPC Connection Error

**Symptoms:**

```
Error: could not detect network
Error: NETWORK_ERROR
```

**Solutions:**

1. Check `RPC_URL` in `.env`
2. Verify API key is still valid
3. Check rate limits
4. Try different provider
5. Implement FallbackProvider

---

### Insufficient funds

**Symptoms:**

```
Error: insufficient funds for gas * price + value
```

**Solutions:**

1. Check ETH balance
2. Get testnet ETH from faucet
3. Reduce gas price if possible
4. Check gas estimation

---

### Nonce too low

**Symptoms:**

```
Error: nonce has already been used
Error: replacement transaction underpriced
```

**Solutions:**

1. Wait for previous transaction to complete
2. Get new nonce: `getTransactionCount('pending')`
3. Don't send multiple tx at once
4. Implement nonce management

---

### Rate limit exceeded

**Symptoms:**

```
Error: rate limit exceeded
Error: 429 Too Many Requests
```

**Solutions:**

1. Upgrade RPC provider plan
2. Implement rate limiting
3. Cache results
4. Use multiple providers
5. Add delays between requests

---

### Transaction timeout

**Symptoms:**

- Transaction not confirmed after long time
- Stuck pending

**Solutions:**

1. Check if gas price is high enough
2. Increase `maxFeePerGas` and `maxPriorityFeePerGas`
3. Replace transaction with higher gas price
4. Wait longer (may take many blocks)

---

## 🧪 Testing on Sepolia

### Important Notes

**✅ Safe to Test:**

- All examples run on Sepolia Testnet
- Testnet ETH has no real value
- Perfect for learning and experimentation
- No risk of losing real money

**📝 Best Practices:**

1. Always test on testnet first
2. Verify transactions on Sepolia Etherscan
3. Monitor gas prices (they fluctuate)
4. Keep some testnet ETH for gas fees
5. Use DRY RUN mode before real transactions

**🔄 Get More Testnet ETH:**
If you run out of testnet ETH:

- [Alchemy Faucet](https://sepoliafaucet.com/) - 0.5 ETH/day
- [Infura Faucet](https://www.infura.io/faucet/sepolia) - 0.5 ETH/day
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)

**⚠️ Moving to Mainnet:**
When ready for mainnet:

1. Change `RPC_URL` to mainnet endpoint
2. Ensure wallet has real ETH
3. Test with small amounts first
4. **CAREFUL**: Mainnet = Real money!

---

## 📖 References

- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Infura Documentation](https://docs.infura.io/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)
- [Sepolia Faucets](https://sepoliafaucet.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

---

## 📝 Additional Notes

### Network Configuration

**Current Setup: Sepolia Testnet**

- All examples are pre-configured for Sepolia
- No code changes needed
- Just configure `.env` and run

**Switching Networks:**

```bash
# Sepolia (Current - Testnet)
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Ethereum Mainnet (Production - Real Money!)
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Other Testnets
# Goerli: https://eth-goerli.g.alchemy.com/v2/YOUR_KEY
# Mumbai (Polygon): https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY
```

### Transaction Costs on Sepolia

Typical gas costs (as of 2024):

- Simple ETH transfer: ~0.00005 ETH (~$0.00 testnet)
- ERC20 transfer: ~0.0001 ETH (~$0.00 testnet)
- Contract interaction: ~0.0002 ETH (~$0.00 testnet)

**Note:** Testnet ETH is free and has no value!

### Production Deployment

When deploying to production:

- [ ] Use secret management service
- [ ] Setup monitoring and alerting
- [ ] Implement proper logging
- [ ] Database for tracking transactions
- [ ] Load balancing for RPC calls
- [ ] Backup and recovery plan
- [ ] Security audit
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline

---

## 🤝 Contributing

If you find bugs or have suggestions, please create an issue or pull request.

---

## 📄 License

MIT

---

## 🎓 Next Steps

- **Part 5**: Introduction to Security and Auditing
- **Part 6**: Comprehensive Exercise

---

**Happy Coding! 🚀**
