# Part 3: Event Handling - Examples

Simple scripts to test and learn about Events in Ethereum.

## 📋 Script List

### 1. Query Past Events (`01-query-past-events.js`)

Retrieve events that occurred in the past.

**Run:**

```bash
node 01-query-past-events.js
```

**What you'll learn:**

- Query events within a block range
- Get all Transfer events
- Calculate volume statistics
- Display event details

---

### 2. Filter by Address (`02-filter-by-address.js`)

Filter events by specific address.

**Run:**

```bash
node 02-filter-by-address.js
```

**What you'll learn:**

- Filter outgoing events (FROM = address)
- Filter incoming events (TO = address)
- Calculate total sent/received
- Net flow calculation

---

### 3. Transaction History (`03-transaction-history.js`)

Build complete transaction history for an address.

**Run:**

```bash
# Use default address
node 03-transaction-history.js

# Or specify address
node 03-transaction-history.js 0xYOUR_ADDRESS
```

**What you'll learn:**

- Combine incoming + outgoing events
- Sort by timestamp
- Format results nicely
- Summary statistics

---

### 4. Real-time Listener (`04-realtime-listener.js`)

Listen to events in real-time with WebSocket.

**Run:**

```bash
node 04-realtime-listener.js
```

**Stop:** Ctrl+C

**What you'll learn:**

- Connect WebSocket provider
- Listen to events in real-time
- Display events as they occur
- Time-based statistics

---

### 5. Filtered Listener (`05-filter-listener.js`)

Listen to events with filter (specific address only).

**Run:**

```bash
# Use default address
node 05-filter-listener.js

# Or specify address
node 05-filter-listener.js 0xYOUR_ADDRESS
```

**Stop:** Ctrl+C

**What you'll learn:**

- Filter events in real-time
- Listen to incoming/outgoing separately
- Track net flow in real-time
- Multiple listeners

---

### 6. Custom Events (`06-custom-events.js`)

Work with custom events from smart contract (Uniswap example).

**Run:**

```bash
node 06-custom-events.js
```

**What you'll learn:**

- Query multiple event types
- Swap, Mint, Burn, Sync events
- Parse event arguments
- Uniswap V2 pair events

---

## 🚀 Installation

```bash
cd part3-events/examples
npm install
```

## 📝 Running Scripts

### Method 1: Direct

```bash
node 01-query-past-events.js
node 02-filter-by-address.js
node 03-transaction-history.js 0xYOUR_ADDRESS
node 04-realtime-listener.js
node 05-filter-listener.js 0xYOUR_ADDRESS
node 06-custom-events.js
```

### Method 2: Using npm scripts

```bash
npm run 01  # Query past events
npm run 02  # Filter by address
npm run 03  # Transaction history
npm run 04  # Real-time listener
npm run 05  # Filtered listener
npm run 06  # Custom events
```

## 🔧 Configuration

### Network: Sepolia Testnet

Scripts 1-5 use **Sepolia Testnet**:

- **RPC URL (HTTP)**: `https://eth-sepolia.g.alchemy.com/v2/demo`
- **RPC URL (WebSocket)**: `wss://eth-sepolia.g.alchemy.com/v2/demo`
- **Network**: Sepolia Testnet
- **Contract**: USDT on Sepolia (`0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`)
- **Test Address**: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

### Script 6: Custom Events

Script 6 uses **Ethereum Mainnet** because Uniswap V2 is not deployed on Sepolia. This is acceptable for learning as we're only reading data (no transactions).

- **RPC URL**: `https://eth.llamarpc.com` (free public RPC)
- **Contract**: Uniswap V2 USDC/WETH Pair

### Using Your Own RPC

For better performance and higher rate limits, replace `demo` with your own Alchemy API key:

```javascript
// Get free API key at: https://www.alchemy.com/
const RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
const WS_URL = "wss://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY";
```

## 📊 Output Examples

### Script 1: Query Past Events (Sepolia)

```
🚀 Starting Past Events Query Demo

📊 Token: USDT (6 decimals)

📦 Current block: 5234567

🔍 Querying Transfer events from block 5234467 to 5234567...

✅ Found 12 Transfer events

📋 First 5 events:
────────────────────────────────────────────────────────────────────────────

1. Block 5234470
   From: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   To:   0xAAA...
   Amount: 100.00 USDT
   Tx: 0xabc123...
```

### Script 4: Real-time Listener (Sepolia)

```
🚀 Starting Real-time Event Listener

📊 Token: USDT
📡 Listening for Transfer events...
⏰ Started at: 2025-12-29 10:30:00
────────────────────────────────────────────────────────────────────────────
Press Ctrl+C to stop

🔔 Event #1 - Block 5234568
   From: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
   To:   0xBBB...
   Amount: 50.00 USDT
   Tx: 0xdef456...
────────────────────────────────────────────────────────────────────────────
```

## ⚠️ Important Notes

### Network: Sepolia Testnet

- ✅ All scripts (except #6) run on **Sepolia Testnet**
- ✅ Safe to test - no real money involved
- ✅ Free testnet ETH from faucets
- ⚠️ Script #6 uses Mainnet (read-only, no transactions)

### Rate Limiting

The demo RPC URL has rate limits. Solutions:

- Get your own free Alchemy API key: https://www.alchemy.com/
- Reduce block range for queries
- Add delay between requests

### WebSocket Connection

Scripts 4 and 5 use WebSocket. If errors occur:

- Make sure you have a valid Alchemy API key
- Try again after a few seconds
- Check your internet connection

### Block Range

Don't query too many blocks at once on Sepolia:

- ✅ 100-1000 blocks: OK
- ⚠️ 1000-5000 blocks: May be slow
- ❌ >10000 blocks: Usually fails

### Getting Testnet ETH

If you want to test with your own address:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

### Checking Transactions

View your transactions on Sepolia Etherscan:

```
https://sepolia.etherscan.io/address/YOUR_ADDRESS
https://sepolia.etherscan.io/tx/YOUR_TX_HASH
```

## 🎯 Exercises

1. **Modify Script 1**: Change to query events from other Sepolia tokens (LINK, DAI)

   - LINK on Sepolia: `0x779877A7B0D9E8603169DdbD7836e478b4624789`
   - DAI on Sepolia: `0x68194a729C2450ad26072b3D33ADaCbcef39D574`

2. **Modify Script 2**: Add amount filter (only show transactions > 100 USDT)

3. **Modify Script 3**: Export history to CSV file

4. **Modify Script 4**: Add notification for large transactions (> 1000 USDT)

5. **Modify Script 5**: Track multiple addresses simultaneously

6. **Modify Script 6**: Calculate APY of liquidity pool from Mint/Burn events (Mainnet)

## 📚 Reference Documentation

- [Solidity Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
- [Ethers.js - Contract Events](https://docs.ethers.org/v6/api/contract/#ContractEvent)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)

---

**Happy Learning!** 🚀
