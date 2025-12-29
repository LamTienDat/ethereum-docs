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

Scripts use:

- **RPC URL**: `https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07` (HTTP) or `wss://eth.llamarpc.com` (WebSocket)
- **Network**: Ethereum Mainnet
- **Contract**: USDT (`0xdAC17F958D2ee523a2206206994597C13D831ec7`)

You can change these in the code if you want to test with other contracts.

## 📊 Output Examples

### Script 1: Query Past Events

```
🚀 Starting Past Events Query Demo

📊 Token: USDT (6 decimals)

📦 Current block: 18500000

🔍 Querying Transfer events from block 18499900 to 18500000...

✅ Found 1247 Transfer events

📋 First 5 events:
────────────────────────────────────────────────────────────────────────────

1. Block 18499901
   From: 0xAAA...
   To:   0xBBB...
   Amount: 1000.00 USDT
   Tx: 0xabc123...
```

### Script 4: Real-time Listener

```
🚀 Starting Real-time Event Listener

📊 Token: USDT
📡 Listening for Transfer events...
⏰ Started at: 2025-12-17 10:30:00
────────────────────────────────────────────────────────────────────────────
Press Ctrl+C to stop

🔔 Event #1 - Block 18500001
   From: 0xAAA...
   To:   0xBBB...
   Amount: 500.00 USDT
   Tx: 0xdef456...
────────────────────────────────────────────────────────────────────────────
```

## ⚠️ Important Notes

### Rate Limiting

If querying too much, you may hit rate limits. Solutions:

- Reduce block range
- Add delay between requests
- Use paid RPC provider (Infura, Alchemy)

### WebSocket Connection

Scripts 4 and 5 use WebSocket. If errors occur:

- Try again after a few seconds
- Or switch to another RPC provider
- Or use HTTP provider (not real-time)

### Block Range

Don't query too many blocks at once:

- ✅ 100-1000 blocks: OK
- ⚠️ 1000-5000 blocks: May be slow
- ❌ >10000 blocks: Usually fails

## 🎯 Exercises

1. **Modify Script 1**: Change to query events from other tokens (DAI, USDC)
2. **Modify Script 2**: Add amount filter (only show transactions > 10000 USDT)
3. **Modify Script 3**: Export history to CSV file
4. **Modify Script 4**: Add notification for large transactions (> 100000 USDT)
5. **Modify Script 5**: Track multiple addresses simultaneously
6. **Modify Script 6**: Calculate APY of liquidity pool from Mint/Burn events

## 📚 Reference Documentation

- [Solidity Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
- [Ethers.js - Contract Events](https://docs.ethers.org/v6/api/contract/#ContractEvent)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)

---

**Happy Learning!** 🚀

_Documentation compiled by Kaopiz Team - © 2025_
