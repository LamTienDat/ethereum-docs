# Phần 3: Xử lý sự kiện (Events) - Examples

Các script đơn giản để test và học về Events trong Ethereum.

## 📋 Danh sách Scripts

### 1. Query Past Events (`01-query-past-events.js`)

Lấy các events đã xảy ra trong quá khứ.

**Chạy:**

```bash
node 01-query-past-events.js
```

**Học được:**

- Query events trong một block range
- Lấy tất cả Transfer events
- Thống kê volume
- Hiển thị event details

---

### 2. Filter by Address (`02-filter-by-address.js`)

Filter events theo địa chỉ cụ thể.

**Chạy:**

```bash
node 02-filter-by-address.js
```

**Học được:**

- Filter events gửi đi (FROM = address)
- Filter events nhận vào (TO = address)
- Tính tổng sent/received
- Net flow calculation

---

### 3. Transaction History (`03-transaction-history.js`)

Xây dựng lịch sử giao dịch đầy đủ cho một địa chỉ.

**Chạy:**

```bash
# Dùng địa chỉ mặc định
node 03-transaction-history.js

# Hoặc chỉ định địa chỉ
node 03-transaction-history.js 0xYOUR_ADDRESS
```

**Học được:**

- Gộp incoming + outgoing events
- Sắp xếp theo thời gian
- Format kết quả đẹp
- Thống kê tổng hợp

---

### 4. Real-time Listener (`04-realtime-listener.js`)

Lắng nghe events real-time với WebSocket.

**Chạy:**

```bash
node 04-realtime-listener.js
```

**Dừng:** Ctrl+C

**Học được:**

- Kết nối WebSocket provider
- Lắng nghe events real-time
- Hiển thị events ngay khi xảy ra
- Thống kê theo thời gian

---

### 5. Filtered Listener (`05-filter-listener.js`)

Lắng nghe events với filter (chỉ địa chỉ cụ thể).

**Chạy:**

```bash
# Dùng địa chỉ mặc định
node 05-filter-listener.js

# Hoặc chỉ định địa chỉ
node 05-filter-listener.js 0xYOUR_ADDRESS
```

**Dừng:** Ctrl+C

**Học được:**

- Filter events real-time
- Lắng nghe incoming/outgoing riêng biệt
- Track net flow real-time
- Multiple listeners

---

### 6. Custom Events (`06-custom-events.js`)

Làm việc với custom events từ smart contract (Uniswap example).

**Chạy:**

```bash
node 06-custom-events.js
```

**Học được:**

- Query nhiều loại events khác nhau
- Swap, Mint, Burn, Sync events
- Parse event arguments
- Uniswap V2 pair events

---

## 🚀 Cài đặt

```bash
cd part3-events/examples
npm install
```

## 📝 Chạy Scripts

### Cách 1: Trực tiếp

```bash
node 01-query-past-events.js
node 02-filter-by-address.js
node 03-transaction-history.js 0xYOUR_ADDRESS
node 04-realtime-listener.js
node 05-filter-listener.js 0xYOUR_ADDRESS
node 06-custom-events.js
```

### Cách 2: Dùng npm scripts

```bash
npm run 01  # Query past events
npm run 02  # Filter by address
npm run 03  # Transaction history
npm run 04  # Real-time listener
npm run 05  # Filtered listener
npm run 06  # Custom events
```

## 🔧 Cấu hình

Các scripts sử dụng:

- **RPC URL**: `https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07` (HTTP) hoặc `wss://eth.llamarpc.com` (WebSocket)
- **Network**: Ethereum Mainnet
- **Contract**: USDT (`0xdAC17F958D2ee523a2206206994597C13D831ec7`)

Bạn có thể thay đổi trong code nếu muốn test với contract khác.

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

## ⚠️ Lưu ý

### Rate Limiting

Nếu query quá nhiều, có thể bị rate limit. Giải pháp:

- Giảm block range
- Thêm delay giữa các requests
- Dùng paid RPC provider (Infura, Alchemy)

### WebSocket Connection

Scripts 4 và 5 dùng WebSocket. Nếu lỗi:

- Thử lại sau vài giây
- Hoặc đổi sang RPC provider khác
- Hoặc dùng HTTP provider (không real-time)

### Block Range

Không nên query quá nhiều blocks cùng lúc:

- ✅ 100-1000 blocks: OK
- ⚠️ 1000-5000 blocks: Có thể chậm
- ❌ >10000 blocks: Thường bị lỗi

## 🎯 Bài tập

1. **Modify Script 1**: Thay đổi để query events của token khác (DAI, USDC)
2. **Modify Script 2**: Thêm filter theo amount (chỉ hiển thị giao dịch > 10000 USDT)
3. **Modify Script 3**: Export lịch sử ra file CSV
4. **Modify Script 4**: Thêm notification khi có giao dịch lớn (> 100000 USDT)
5. **Modify Script 5**: Track nhiều địa chỉ cùng lúc
6. **Modify Script 6**: Tính APY của liquidity pool từ Mint/Burn events

## 📚 Tài liệu tham khảo

- [Solidity Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
- [Ethers.js - Contract Events](https://docs.ethers.org/v6/api/contract/#ContractEvent)
- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)

---

**Happy Learning!** 🚀

_Tài liệu được biên soạn bởi Kaopiz Team - © 2025_
