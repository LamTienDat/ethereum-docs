# Phần 4: Tích hợp Off-chain (Backend Node.js)

Project ví dụ về tích hợp Ethereum với Backend Node.js, bao gồm quản lý wallet, gửi transaction tự động, RPC provider management, và monitoring.

## 📋 Mục lục

- [Tổng quan](#tổng-quan)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Các ví dụ](#các-ví-dụ)
- [WalletManager Class](#walletmanager-class)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Tổng quan

Backend đóng vai trò quan trọng trong hệ thống blockchain, xử lý các tác vụ:

- ✅ Tự động gửi transaction
- ✅ Quản lý private keys an toàn
- ✅ Monitor events và balance
- ✅ Xử lý retry logic và error handling
- ✅ Integration với database và services khác

### Kiến thức học được

1. **Backend Wallet Management**
   - Tạo wallet từ private key
   - Quản lý nhiều wallets
   - Security best practices

2. **RPC Provider**
   - Các loại provider (Alchemy, Infura, Public RPC)
   - FallbackProvider cho high availability
   - Performance optimization

3. **Transaction Management**
   - Gửi ETH và ERC20 tokens
   - Gas estimation
   - Nonce management
   - Retry logic

4. **Monitoring & Alerting**
   - Monitor balance tự động
   - Alert khi số dư thấp
   - Logging và reporting

## 🚀 Cài đặt

### Yêu cầu

- Node.js >= 16.0.0
- npm hoặc pnpm
- Ethereum wallet với testnet ETH (Sepolia)

### Các bước cài đặt

```bash
# 1. Di chuyển vào thư mục
cd part4-backend-integration

# 2. Cài đặt dependencies
npm install

# 3. Copy file .env.example
cp .env.example .env

# 4. Chỉnh sửa .env với thông tin của bạn
nano .env
```

## ⚙️ Cấu hình

### File `.env`

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

### 🔐 Bảo mật Private Key

**⚠️ QUAN TRỌNG:**

- **KHÔNG BAO GIỜ** commit private key lên Git
- File `.env` đã được thêm vào `.gitignore`
- Trong production, dùng secret management:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault
  - Google Secret Manager

### Lấy Testnet ETH

Sepolia Testnet:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [QuickNode Faucet](https://faucet.quicknode.com/ethereum/sepolia)

### Đăng ký RPC Provider (Miễn phí)

1. **Alchemy** (Khuyến nghị): https://www.alchemy.com/
   - Đăng ký → Tạo app → Copy API key

2. **Infura**: https://infura.io/
   - Đăng ký → Tạo project → Copy API key

## 📚 Các ví dụ

### Ví dụ 1: Wallet cơ bản

Học cách tạo wallet và kiểm tra thông tin.

```bash
npm run wallet
```

**Nội dung:**
- Kết nối RPC Provider
- Tạo wallet từ private key
- Kiểm tra số dư ETH
- Lấy thông tin blockchain

**File:** `examples/01-wallet-basic.js`

---

### Ví dụ 2: Gửi ETH

Học cách gửi ETH từ backend.

```bash
npm run send-eth
# Hoặc chỉ định số lượng
node examples/02-send-eth.js 0.01
```

**Nội dung:**
- Kiểm tra số dư trước khi gửi
- Ước tính gas fee
- Gửi transaction
- Chờ confirmation

**File:** `examples/02-send-eth.js`

⚠️ **Lưu ý:** Mặc định là DRY RUN (không gửi thật). Bỏ comment code để gửi thật.

---

### Ví dụ 3: Gửi ERC20 Token

Học cách gửi ERC20 token.

```bash
npm run send-token

# Hoặc chỉ định token và số lượng
node examples/03-send-token.js <token_address> <recipient> <amount>
```

**Nội dung:**
- Kết nối với ERC20 contract
- Lấy thông tin token (name, symbol, decimals)
- Kiểm tra số dư token
- Gửi token với amount đúng decimals

**File:** `examples/03-send-token.js`

---

### Ví dụ 4: WalletManager Class

Demo WalletManager class với đầy đủ tính năng.

```bash
npm run wallet-manager
```

**Nội dung:**
- Quản lý wallet chuyên nghiệp
- Kiểm tra số dư ETH và Token
- Ước tính gas
- Sign message và verify
- Validate address

**File:** `examples/04-wallet-manager.js`

---

### Ví dụ 5: RPC Provider

Học các loại RPC provider và FallbackProvider.

```bash
npm run rpc-provider
```

**Nội dung:**
- JsonRpcProvider
- AlchemyProvider
- InfuraProvider
- FallbackProvider (high availability)
- So sánh performance

**File:** `examples/05-rpc-provider.js`

---

### Ví dụ 6: Retry Logic

Học cách xử lý lỗi và retry với exponential backoff.

```bash
npm run retry-logic
```

**Nội dung:**
- Retry cơ bản
- Exponential backoff
- Phân loại lỗi (retryable vs non-retryable)
- Timeout handling
- Rate limiting

**File:** `examples/06-retry-logic.js`

---

### Ví dụ 7: Monitor Balance

Monitor số dư và alert tự động.

```bash
npm run monitor
```

**Nội dung:**
- Monitor balance định kỳ
- Track thay đổi số dư
- Alert khi số dư thấp
- Logging best practices

**File:** `examples/07-monitor-balance.js`

⚠️ **Lưu ý:** Script sẽ chạy trong 2 phút rồi tự động dừng. Nhấn `Ctrl+C` để dừng sớm.

---

## 🏗️ WalletManager Class

Class quản lý wallet production-ready với đầy đủ tính năng.

### Khởi tạo

```javascript
const WalletManager = require('./src/WalletManager');

const walletManager = new WalletManager(
  process.env.RPC_URL,
  process.env.PRIVATE_KEY
);
```

### Các method chính

#### Balance Management

```javascript
// Lấy số dư ETH
const balance = await walletManager.getBalance();

// Lấy số dư token
const tokenBalance = await walletManager.getTokenBalance(tokenAddress);

// Lấy thông tin token
const tokenInfo = await walletManager.getTokenInfo(tokenAddress);
```

#### Send Transactions

```javascript
// Gửi ETH
const result = await walletManager.sendETH(toAddress, '0.1');

// Gửi Token
const result = await walletManager.sendToken(
  tokenAddress,
  toAddress,
  '100'
);
```

#### Gas & Estimation

```javascript
// Ước tính gas
const gasEstimate = await walletManager.estimateGas(
  toAddress,
  ethers.parseEther('0.1')
);

// Lấy fee data
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

### Xem thêm

File: `src/WalletManager.js`

---

## 🔧 Retry Utilities

Helper functions cho retry logic.

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

// RPC retry với options
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

- ✅ Store private keys trong environment variables
- ✅ Sử dụng `.gitignore` cho `.env`
- ✅ Encrypt private keys trong database
- ✅ Dùng secret management service (production)
- ✅ Rotate keys định kỳ
- ✅ Separate hot wallet và cold wallet

### 2. RPC Provider

- ✅ Dùng Alchemy/Infura cho production
- ✅ Implement FallbackProvider
- ✅ Monitor rate limits
- ✅ Cache kết quả khi có thể
- ✅ Implement retry logic
- ✅ Set appropriate timeouts

### 3. Transaction Management

- ✅ Validate input trước khi gửi
- ✅ Kiểm tra số dư trước transaction
- ✅ Ước tính gas chính xác
- ✅ Handle nonce properly
- ✅ Implement retry cho network errors
- ✅ Wait for confirmations
- ✅ Log tất cả transactions

### 4. Error Handling

- ✅ Phân loại lỗi (retryable vs fatal)
- ✅ Exponential backoff cho retry
- ✅ Set max retries phù hợp
- ✅ Log chi tiết errors
- ✅ Alert cho critical errors
- ✅ Handle edge cases

### 5. Monitoring

- ✅ Monitor balance định kỳ
- ✅ Track gas prices
- ✅ Alert khi số dư thấp
- ✅ Log tất cả operations
- ✅ Metrics và dashboards
- ✅ Health checks

### 6. Performance

- ✅ Cache token info
- ✅ Batch requests khi có thể
- ✅ Use connection pooling
- ✅ Optimize RPC calls
- ✅ Implement rate limiting
- ✅ Load balancing cho multiple providers

---

## 🐛 Troubleshooting

### Lỗi kết nối RPC

**Triệu chứng:**
```
Error: could not detect network
Error: NETWORK_ERROR
```

**Giải pháp:**
1. Kiểm tra `RPC_URL` trong `.env`
2. Verify API key còn hiệu lực
3. Check rate limits
4. Thử provider khác
5. Implement FallbackProvider

---

### Insufficient funds

**Triệu chứng:**
```
Error: insufficient funds for gas * price + value
```

**Giải pháp:**
1. Kiểm tra số dư ETH
2. Lấy testnet ETH từ faucet
3. Giảm gas price nếu có thể
4. Check gas estimation

---

### Nonce too low

**Triệu chứng:**
```
Error: nonce has already been used
Error: replacement transaction underpriced
```

**Giải pháp:**
1. Đợi transaction trước complete
2. Lấy nonce mới: `getTransactionCount('pending')`
3. Không gửi nhiều tx cùng lúc
4. Implement nonce management

---

### Rate limit exceeded

**Triệu chứng:**
```
Error: rate limit exceeded
Error: 429 Too Many Requests
```

**Giải pháp:**
1. Upgrade RPC provider plan
2. Implement rate limiting
3. Cache results
4. Sử dụng multiple providers
5. Add delays giữa requests

---

### Transaction timeout

**Triệu chứng:**
- Transaction không được confirm sau lâu
- Stuck pending

**Giải pháp:**
1. Check gas price có đủ cao không
2. Tăng `maxFeePerGas` và `maxPriorityFeePerGas`
3. Replace transaction với gas price cao hơn
4. Wait thêm thời gian (có thể đợi nhiều blocks)

---

## 📖 Tài liệu tham khảo

- [Ethers.js Documentation](https://docs.ethers.org/v6/)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Infura Documentation](https://docs.infura.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Smart Contract Security](https://consensys.github.io/smart-contract-best-practices/)

---

## 📝 Ghi chú

### Testing

Tất cả ví dụ mặc định chạy trên **Sepolia Testnet**. Để chuyển sang mainnet:

1. Đổi `RPC_URL` trong `.env`
2. Đảm bảo wallet có ETH thật
3. Test kỹ trước khi deploy
4. **CAREFUL**: Mainnet = Real money!

### Production Deployment

Khi deploy production:

- [ ] Sử dụng secret management service
- [ ] Setup monitoring và alerting
- [ ] Implement proper logging
- [ ] Database cho tracking transactions
- [ ] Load balancing cho RPC calls
- [ ] Backup và recovery plan
- [ ] Security audit
- [ ] Rate limiting
- [ ] Error tracking (Sentry)
- [ ] CI/CD pipeline

---

## 🤝 Đóng góp

Nếu bạn tìm thấy bug hoặc có suggestions, vui lòng tạo issue hoặc pull request.

---

## 📄 License

MIT

---

## 🎓 Học tiếp

- **Phần 5**: Nhập môn Bảo mật và Kiểm toán
- **Phần 6**: Bài tập tổng hợp

---

**Happy Coding! 🚀**

