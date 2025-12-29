# Phần 1: Chuyển tiền và Nghiệp vụ giao dịch (Transaction)

Ví dụ thực hành về cơ chế chuyển tiền trên Ethereum testnet.

## 📋 Mục tiêu học tập

- Hiểu sự khác biệt giữa chuyển ETH và ERC20 token
- Thực hành `transfer`, `approve`, `transferFrom`
- Quan sát Nonce, Gas, và Confirmations
- Deploy và tương tác với smart contract thực tế

## 🛠️ Công nghệ sử dụng

- **Network**: Sepolia Testnet
- **Framework**: Hardhat
- **Library**: Ethers.js v6
- **Language**: Solidity 0.8.20, JavaScript

## 📁 Cấu trúc thư mục

```
part1-transactions/
├── contracts/
│   └── SimpleERC20.sol          # Smart contract ERC20 đơn giản
├── scripts/
│   ├── 01-deploy.js             # Deploy contract
│   ├── 02-transfer-eth.js       # Demo chuyển ETH
│   ├── 03-transfer-erc20.js     # Demo transfer ERC20
│   ├── 04-approve-transferFrom.js # Demo approve/transferFrom
│   ├── 05-nonce-demo.js         # Demo Nonce
│   ├── 06-gas-estimation.js     # Demo Gas estimation
│   └── 07-confirmations.js      # Demo Confirmations
├── test/
│   └── SimpleERC20.test.js      # Unit tests
├── .env.example                 # Template cho environment variables
├── hardhat.config.js            # Hardhat configuration
├── package.json
└── README.md
```

## 🚀 Hướng dẫn cài đặt

### 1. Cài đặt dependencies

```bash
cd part1-transactions
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Điền thông tin vào `.env`:

```env
# Sepolia RPC URL (lấy từ Alchemy hoặc Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key của ví test (KHÔNG BAO GIỜ dùng ví thật!)
PRIVATE_KEY=your_private_key_here

# Etherscan API key (để verify contract)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Lấy Sepolia ETH (Testnet)

Truy cập các faucets sau để lấy ETH test:

- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

## 📝 Các bài thực hành

### Bài 1: Deploy Smart Contract

```bash
npx hardhat run scripts/01-deploy.js --network sepolia
```

**Học được:**

- Cách deploy smart contract lên testnet
- Gas cost cho deployment
- Verify contract trên Etherscan

### Bài 2: Chuyển ETH

```bash
npx hardhat run scripts/02-transfer-eth.js --network sepolia
```

**Học được:**

- Cơ chế chuyển native token (ETH)
- Gas cost cho ETH transfer (~21,000 gas)
- Transaction receipt và block confirmation

### Bài 3: Transfer ERC20

```bash
npx hardhat run scripts/03-transfer-erc20.js --network sepolia
```

**Học được:**

- Cách gọi hàm `transfer()` của ERC20
- Gas cost cho ERC20 transfer (~50,000-65,000 gas)
- So sánh với ETH transfer

### Bài 4: Approve và TransferFrom

```bash
npx hardhat run scripts/04-approve-transferFrom.js --network sepolia
```

**Học được:**

- Flow của approve/transferFrom
- Use case: DEX, payment gateway
- Kiểm tra allowance

### Bài 5: Nonce Demo

```bash
npx hardhat run scripts/05-nonce-demo.js --network sepolia
```

**Học được:**

- Nonce là gì và tại sao quan trọng
- Stuck transaction và cách fix
- Parallel transactions

### Bài 6: Gas Estimation

```bash
npx hardhat run scripts/06-gas-estimation.js --network sepolia
```

**Học được:**

- Estimate gas trước khi gửi transaction
- EIP-1559: Base Fee + Priority Fee
- Xử lý gas tự động vs manual

### Bài 7: Confirmations

```bash
npx hardhat run scripts/07-confirmations.js --network sepolia
```

**Học được:**

- Đợi confirmations
- Tại sao cần nhiều confirmations
- Re-org attack

## 🧪 Chạy Tests

```bash
# Chạy tất cả tests
npx hardhat test

# Chạy với coverage
npx hardhat coverage

# Chạy test cụ thể
npx hardhat test test/SimpleERC20.test.js
```

## 📊 Kết quả mong đợi

Sau khi hoàn thành các bài thực hành, bạn sẽ:

✅ Hiểu rõ sự khác biệt ETH vs ERC20  
✅ Biết cách sử dụng transfer/approve/transferFrom  
✅ Hiểu Nonce và cách xử lý stuck transactions  
✅ Biết estimate và optimize gas  
✅ Hiểu confirmations và transaction finality

## 🔗 Resources

- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [ERC20 Standard (EIP-20)](https://eips.ethereum.org/EIPS/eip-20)
- [EIP-1559 (Gas Fee)](https://eips.ethereum.org/EIPS/eip-1559)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)

## ⚠️ Lưu ý quan trọng

1. **KHÔNG BAO GIỜ** push private key lên Git
2. Chỉ sử dụng ví test, không dùng ví chứa tiền thật
3. Sepolia ETH không có giá trị, có thể xin miễn phí
4. Mỗi transaction cần đợi ~12 giây để được confirm

## 🆘 Troubleshooting

### Lỗi: "insufficient funds for gas"

- Cần xin thêm Sepolia ETH từ faucet

### Lỗi: "nonce too low"

- Reset MetaMask: Settings → Advanced → Clear activity tab data

### Lỗi: "replacement transaction underpriced"

- Tăng gas price hoặc đợi transaction cũ complete

### Transaction bị stuck

- Xem script `05-nonce-demo.js` để học cách fix

## 📞 Hỗ trợ

Nếu gặp vấn đề, tham khảo:

- [Hardhat Discord](https://hardhat.org/discord)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- Documentation trong từng script

---

**Happy Learning!** 🚀
