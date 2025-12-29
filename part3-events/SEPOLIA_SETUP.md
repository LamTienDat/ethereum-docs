# Sepolia Testnet Setup Guide

## ✅ Network Configuration

All examples (except Script 6) are configured to run on **Sepolia Testnet**.

### Why Sepolia?

- ✅ **Safe**: No real money involved
- ✅ **Free**: Get testnet ETH from faucets
- ✅ **Fast**: Faster block times than mainnet
- ✅ **Reliable**: Stable testnet for development

## 🔧 Configuration Details

### Scripts 1-5: Sepolia Testnet

```javascript
// HTTP RPC
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo';

// WebSocket RPC (for real-time listeners)
const WS_URL = 'wss://eth-sepolia.g.alchemy.com/v2/demo';

// USDT Token on Sepolia
const USDT_ADDRESS = '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06';

// Example test address
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
```

### Script 6: Ethereum Mainnet

Script 6 (Custom Events) uses **Ethereum Mainnet** because Uniswap V2 is not deployed on Sepolia. This is acceptable for learning purposes as we're only reading data (no transactions).

```javascript
// Mainnet RPC (free public)
const RPC_URL = 'https://eth.llamarpc.com';

// Uniswap V2 USDC/WETH Pair
const PAIR_ADDRESS = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc';
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd part3-events/examples
npm install
```

### 2. Run Scripts

```bash
# Query past events
node 01-query-past-events.js

# Filter by address
node 02-filter-by-address.js

# Transaction history
node 03-transaction-history.js

# Real-time listener (Ctrl+C to stop)
node 04-realtime-listener.js

# Filtered listener (Ctrl+C to stop)
node 05-filter-listener.js

# Custom events (Mainnet - read only)
node 06-custom-events.js
```

## 🔑 Using Your Own API Key (Recommended)

The demo API key has rate limits. For better performance:

### 1. Get Free Alchemy API Key

1. Visit: https://www.alchemy.com/
2. Sign up for free account
3. Create new app:
   - Network: **Ethereum Sepolia**
   - Name: `Part3-Events-Learning`
4. Copy your API key

### 2. Update Scripts

Replace `demo` with your API key in each script:

```javascript
// Before
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/demo';

// After
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY_HERE';
```

For WebSocket (Scripts 4 & 5):

```javascript
// Before
const RPC_URL = 'wss://eth-sepolia.g.alchemy.com/v2/demo';

// After
const RPC_URL = 'wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY_HERE';
```

## 🪙 Other Sepolia Tokens

You can test with other tokens on Sepolia:

### LINK Token

```javascript
const LINK_ADDRESS = '0x779877A7B0D9E8603169DdbD7836e478b4624789';
```

### DAI Token

```javascript
const DAI_ADDRESS = '0x68194a729C2450ad26072b3D33ADaCbcef39D574';
```

### WETH Token

```javascript
const WETH_ADDRESS = '0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9';
```

## 💰 Getting Testnet ETH

If you want to test with your own wallet address:

### Faucets

1. **Alchemy Faucet**: https://sepoliafaucet.com/
   - 0.5 ETH per day
   - Requires account

2. **Infura Faucet**: https://www.infura.io/faucet/sepolia
   - 0.5 ETH per day
   - Requires account

3. **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia
   - 0.1 ETH per request

## 🔍 Viewing Transactions

### Sepolia Etherscan

View all transactions and contracts on Sepolia:

```
https://sepolia.etherscan.io/
```

### Check Address

```
https://sepolia.etherscan.io/address/YOUR_ADDRESS
```

### Check Transaction

```
https://sepolia.etherscan.io/tx/YOUR_TX_HASH
```

### Check Token

```
https://sepolia.etherscan.io/token/TOKEN_ADDRESS
```

## 📊 Expected Behavior

### Block Times

- Sepolia: ~12 seconds per block
- Mainnet: ~12 seconds per block

### Transaction Volume

Sepolia has **much lower** transaction volume than mainnet:

- Mainnet USDT: 1000+ transfers per 100 blocks
- Sepolia USDT: 1-50 transfers per 100 blocks

This is normal! Sepolia is a testnet with less activity.

### Script Adjustments

You may need to adjust block ranges for Sepolia:

```javascript
// Mainnet - lots of activity
const fromBlock = currentBlock - 100; // 100 blocks enough

// Sepolia - less activity
const fromBlock = currentBlock - 1000; // May need more blocks to see events
```

## ⚠️ Troubleshooting

### No Events Found

If scripts return 0 events:

1. **Increase block range**:
   ```javascript
   const fromBlock = currentBlock - 5000; // Try more blocks
   ```

2. **Check token has activity**:
   - Visit Sepolia Etherscan
   - Check token contract for recent transfers

3. **Use your own wallet**:
   - Send some test tokens
   - Query your own address

### Rate Limit Errors

```
Error: rate limit exceeded
```

**Solution**: Get your own free Alchemy API key (see above)

### WebSocket Connection Failed

```
Error: WebSocket connection failed
```

**Solutions**:
1. Check your API key is valid
2. Try again after a few seconds
3. Check internet connection
4. Use HTTP provider instead (not real-time)

### Wrong Network

```
Error: could not detect network
```

**Solution**: Make sure RPC URL is correct:
```javascript
// Correct - Sepolia
const RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY';

// Wrong - Mainnet
const RPC_URL = 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY';
```

## 🎯 Testing Your Changes

### 1. Test with Your Wallet

Replace `TARGET_ADDRESS` with your own address:

```javascript
const TARGET_ADDRESS = '0xYOUR_WALLET_ADDRESS';
```

### 2. Send Test Transactions

Use MetaMask to send some USDT on Sepolia:

1. Add Sepolia network to MetaMask
2. Get testnet ETH from faucet
3. Get testnet USDT (or other tokens)
4. Send transactions to yourself or friends
5. Run scripts to see your transactions!

### 3. Monitor Your Activity

```bash
# Watch your address in real-time
node 05-filter-listener.js YOUR_WALLET_ADDRESS
```

## 📚 Additional Resources

- **Sepolia Testnet Info**: https://sepolia.dev/
- **Alchemy Docs**: https://docs.alchemy.com/
- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **Sepolia Faucets List**: https://faucetlink.to/sepolia

## ✅ Verification Checklist

Before running scripts, verify:

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] RPC URL points to Sepolia
- [ ] (Optional) Own API key configured
- [ ] Internet connection stable

## 🎓 Learning Path

1. **Start with Script 1**: Query past events
   - Understand basic event querying
   - See how to filter by block range

2. **Try Script 2**: Filter by address
   - Learn about indexed parameters
   - Understand incoming vs outgoing

3. **Explore Script 3**: Transaction history
   - Build complete transaction history
   - Format and display results

4. **Test Script 4**: Real-time listener
   - Experience WebSocket connections
   - See events as they happen

5. **Advanced Script 5**: Filtered listener
   - Multiple event listeners
   - Real-time monitoring

6. **Expert Script 6**: Custom events
   - Complex event structures
   - Multiple event types

---

**Happy Learning on Sepolia!** 🚀

_Last updated: December 29, 2025_

