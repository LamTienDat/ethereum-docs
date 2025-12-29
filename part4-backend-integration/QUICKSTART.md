# 🚀 Quick Start Guide

Hướng dẫn nhanh để bắt đầu với Part 4 - Backend Integration.

## 📦 Cài đặt (5 phút)

### Bước 1: Install dependencies

```bash
cd part4-backend-integration
npm install
```

### Bước 2: Tạo wallet mới

```bash
node scripts/generate-wallet.js
```

Script sẽ tạo wallet mới và hiển thị:
- Address
- Private Key
- Mnemonic Phrase

**⚠️ Lưu Private Key an toàn!**

### Bước 3: Setup .env

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:

```bash
# 1. Paste Private Key từ bước 2
PRIVATE_KEY=0x...your_private_key...

# 2. Setup RPC URL (chọn 1 trong 2):

# Option A: Public RPC (miễn phí, không cần đăng ký)
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Option B: Alchemy (khuyến nghị, cần đăng ký)
# Đăng ký tại: https://www.alchemy.com/
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ALCHEMY_API_KEY=your_api_key_here
```

### Bước 4: Lấy Testnet ETH

Vào faucet và paste address của bạn:
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)

Đợi ~1 phút để nhận ETH.

### Bước 5: Test

```bash
npm run wallet
```

Nếu thấy số dư ETH → **Thành công!** 🎉

---

## 🎯 Chạy các ví dụ

### 1. Wallet cơ bản

```bash
npm run wallet
```

Kiểm tra thông tin wallet và số dư.

### 2. WalletManager (Khuyến nghị bắt đầu từ đây)

```bash
npm run wallet-manager
```

Demo tất cả tính năng của WalletManager class.

### 3. RPC Provider

```bash
npm run rpc-provider
```

Học về các loại RPC provider và cách tối ưu.

### 4. Retry Logic

```bash
npm run retry-logic
```

Học cách xử lý lỗi và retry.

### 5. Monitor Balance

```bash
npm run monitor
```

Monitor số dư tự động (chạy 2 phút).

### 6. Send ETH (Thận trọng!)

```bash
npm run send-eth
```

**⚠️ Lưu ý:** Mặc định là DRY RUN (không gửi thật). 
- Xem code trong `examples/02-send-eth.js`
- Bỏ comment để gửi thật

### 7. Send Token

```bash
npm run send-token
```

Gửi ERC20 token (cũng là DRY RUN).

---

## 📚 Cấu trúc project

```
part4-backend-integration/
├── examples/              # Các ví dụ
│   ├── 01-wallet-basic.js
│   ├── 02-send-eth.js
│   ├── 03-send-token.js
│   ├── 04-wallet-manager.js
│   ├── 05-rpc-provider.js
│   ├── 06-retry-logic.js
│   └── 07-monitor-balance.js
├── src/
│   └── WalletManager.js   # Main class
├── utils/
│   └── retry.js           # Retry helpers
├── scripts/
│   └── generate-wallet.js # Generate wallet
├── .env.example           # Template
├── .gitignore            
├── package.json
├── README.md             # Full documentation
└── QUICKSTART.md         # This file
```

---

## 🔑 Sử dụng WalletManager trong code của bạn

```javascript
require('dotenv').config();
const WalletManager = require('./src/WalletManager');

async function main() {
  // 1. Khởi tạo
  const wallet = new WalletManager(
    process.env.RPC_URL,
    process.env.PRIVATE_KEY
  );

  // 2. Check balance
  const balance = await wallet.getBalance();
  console.log('Balance:', balance, 'ETH');

  // 3. Send ETH
  const result = await wallet.sendETH(
    '0xRecipientAddress',
    '0.01' // 0.01 ETH
  );
  console.log('TX Hash:', result.txHash);

  // 4. Send Token
  const tokenResult = await wallet.sendToken(
    '0xTokenAddress',
    '0xRecipientAddress',
    '100' // 100 tokens
  );
  console.log('Token TX:', tokenResult.txHash);
}

main();
```

---

## ❓ Troubleshooting

### ❌ "could not detect network"

**Nguyên nhân:** RPC_URL không đúng hoặc không hoạt động.

**Giải pháp:**
1. Check RPC_URL trong .env
2. Thử public RPC: `https://ethereum-sepolia-rpc.publicnode.com`
3. Hoặc đăng ký Alchemy/Infura

### ❌ "insufficient funds"

**Nguyên nhân:** Wallet chưa có ETH.

**Giải pháp:**
1. Lấy testnet ETH từ faucet
2. Đợi vài phút
3. Check lại: `npm run wallet`

### ❌ "nonce too low"

**Nguyên nhân:** Gửi nhiều transaction cùng lúc.

**Giải pháp:**
- Đợi transaction trước complete
- Chỉ gửi 1 transaction tại 1 thời điểm

### ❌ Private Key format error

**Nguyên nhân:** Private key không đúng format.

**Giải pháp:**
- Private key phải bắt đầu bằng `0x`
- Độ dài 66 ký tự (bao gồm 0x)
- Generate wallet mới: `node scripts/generate-wallet.js`

---

## 🎓 Học tiếp

1. Đọc full documentation: `README.md`
2. Xem code trong `examples/`
3. Đọc comments trong `src/WalletManager.js`
4. Thử modify code và experiment
5. Build project của riêng bạn!

---

## 💡 Tips

- ✅ Luôn test trên Testnet trước
- ✅ Backup Private Key an toàn
- ✅ Đọc error messages kỹ
- ✅ Check transaction trên [Etherscan Sepolia](https://sepolia.etherscan.io/)
- ✅ Join [Ethereum Discord](https://discord.gg/ethereum) nếu cần help

---

## 🆘 Cần giúp đỡ?

1. Đọc lại documentation
2. Check Troubleshooting section
3. Google error message
4. Hỏi trên Discord/Forum
5. Tạo issue trên GitHub

---

**Happy Coding! 🚀**

Đã sẵn sàng? Chạy lệnh đầu tiên:

```bash
npm run wallet
```

