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

## 🚀 Installation

### Requirements

- Node.js >= 16.0.0
- npm or pnpm
- Ethereum wallet with testnet ETH (Sepolia)

### Installation Steps

```bash
# 1. Navigate to directory
cd part4-backend-integration

# 2. Install dependencies
npm install

# 3. Copy .env.example file
cp .env.example .env

# 4. Edit .env with your information
nano .env
```

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

## 📚 Examples

### Example 1: Basic Wallet

Learn how to create a wallet and check information.

```bash
npm run wallet
```

**Content:**
- Connect to RPC Provider
- Create wallet from private key
- Check ETH balance
- Get blockchain information

**File:** `examples/01-wallet-basic.js`

---

### Example 2: Send ETH

Learn how to send ETH from backend.

```bash
npm run send-eth
# Or specify amount
node examples/02-send-eth.js 0.01
```

**Content:**
- Check balance before sending
- Estimate gas fee
- Send transaction
- Wait for confirmation

**File:** `examples/02-send-eth.js`

⚠️ **Note:** Default is DRY RUN (doesn't actually send). Uncomment code to send for real.

---

### Example 3: Send ERC20 Token

Learn how to send ERC20 tokens.

```bash
npm run send-token

# Or specify token and amount
node examples/03-send-token.js <token_address> <recipient> <amount>
```

**Content:**
- Connect to ERC20 contract
- Get token info (name, symbol, decimals)
- Check token balance
- Send token with correct decimals

**File:** `examples/03-send-token.js`

---

### Example 4: WalletManager Class

Demo WalletManager class with full features.

```bash
npm run wallet-manager
```

**Content:**
- Professional wallet management
- Check ETH and Token balance
- Estimate gas
- Sign message and verify
- Validate address

**File:** `examples/04-wallet-manager.js`

---

### Example 5: RPC Provider

Learn about RPC provider types and FallbackProvider.

```bash
npm run rpc-provider
```

**Content:**
- JsonRpcProvider
- AlchemyProvider
- InfuraProvider
- FallbackProvider (high availability)
- Performance comparison

**File:** `examples/05-rpc-provider.js`

---

### Example 6: Retry Logic

Learn how to handle errors and retry with exponential backoff.

```bash
npm run retry-logic
```

**Content:**
- Basic retry
- Exponential backoff
- Error classification (retryable vs non-retryable)
- Timeout handling
- Rate limiting

**File:** `examples/06-retry-logic.js`

---

### Example 7: Monitor Balance

Monitor balance and automated alerts.

```bash
npm run monitor
```

**Content:**
- Periodic balance monitoring
- Track balance changes
- Low balance alerts
- Logging best practices

**File:** `examples/07-monitor-balance.js`

⚠️ **Note:** Script will run for 2 minutes then automatically stop. Press `Ctrl+C` to stop early.

---

## 🏗️ WalletManager Class

Production-ready wallet management class with full features.

### Initialization

```javascript
const WalletManager = require('./src/WalletManager');

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
const result = await walletManager.sendETH(toAddress, '0.1');

// Send Token
const result = await walletManager.sendToken(
  tokenAddress,
  toAddress,
  '100'
);
```

#### Gas & Estimation

```javascript
// Estimate gas
const gasEstimate = await walletManager.estimateGas(
  toAddress,
  ethers.parseEther('0.1')
);

// Get fee data
const feeData = await walletManager.getFeeData();
```

#### Signing

```javascript
// Sign message
const signature = await walletManager.signMessage('Hello World');

// Verify signature
const signer = walletManager.verifyMessage('Hello World', signature);
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
} = require('./utils/retry');

// Basic retry
const result = await callWithRetry(
  async () => {
    return await someFunction();
  },
  3,     // max retries
  1000   // initial delay
);

// RPC retry with options
const blockNumber = await rpcCallWithRetry(
  () => provider.getBlockNumber(),
  {
    maxRetries: 3,
    initialDelay: 1000,
    timeout: 10000,
  }
);
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

## 📖 References

- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Infura Documentation](https://docs.infura.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

---

## 📝 Notes

### Testing

All examples run on **Sepolia Testnet** by default. To switch to mainnet:

1. Change `RPC_URL` in `.env`
2. Ensure wallet has real ETH
3. Test thoroughly before deployment
4. **CAREFUL**: Mainnet = Real money!

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
