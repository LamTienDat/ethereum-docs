# 🪙 KaopizCoin (KPC) - Complete DApp Project

Project hoàn chỉnh từ Smart Contract đến Frontend cho token ERC20 tùy chỉnh.

## 📋 Tổng quan

**KaopizCoin (KPC)** là một ERC20 token với các tính năng:

- ✅ Tuân thủ chuẩn ERC20
- ✅ Mint tokens (chỉ owner)
- ✅ Burn tokens (bất kỳ ai)
- ✅ Pause/Unpause transfers (chỉ owner)
- ✅ Event logging đầy đủ
- ✅ Max supply limit (1 tỷ tokens)
- ✅ Initial supply (100 triệu tokens)

## 🎯 Mục tiêu học tập

Sau khi hoàn thành project này, bạn sẽ biết cách:

1. **Smart Contract Development**

   - Viết ERC20 token với OpenZeppelin
   - Implement access control (Ownable)
   - Thêm pausable mechanism
   - Custom events và modifiers

2. **Testing**

   - Viết unit tests với Hardhat và Chai
   - Test các edge cases
   - Coverage testing

3. **Deployment**

   - Deploy lên testnet (Sepolia/BSC Testnet)
   - Verify contract trên Etherscan
   - Quản lý deployment scripts

4. **Frontend Development**
   - Connect wallet với MetaMask
   - Tương tác với smart contract
   - Display token information
   - Send transactions
   - Listen to events

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm hoặc pnpm
- MetaMask wallet
- Testnet ETH (từ faucet)

### Installation

```bash
# 1. Clone hoặc copy project
cd part6-kaopiz-token

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Setup environment
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn
```

### Configuration

Tạo file `.env`:

```bash
# Private key của wallet (để deploy)
PRIVATE_KEY=0x...your_private_key...

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# API Keys cho verify
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

## 📦 Project Structure

```
part6-kaopiz-token/
├── contracts/
│   └── KaopizCoin.sol          # Smart contract chính
├── test/
│   └── KaopizCoin.test.js      # Unit tests
├── scripts/
│   ├── deploy.js               # Deploy script
│   ├── interact.js             # Interact with contract
│   └── verify.js               # Verify trên Etherscan
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.jsx
│   │   │   ├── TokenInfo.jsx
│   │   │   ├── TransferForm.jsx
│   │   │   └── TransactionHistory.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── hardhat.config.js
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## 🔧 Development

### 1. Compile Contract

```bash
npx hardhat compile
```

### 2. Run Tests

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test
npx hardhat test test/KaopizCoin.test.js
```

Expected output:

```
  KaopizCoin
    Deployment
      ✔ Should set the right owner
      ✔ Should assign the initial supply to the owner
      ✔ Should have correct token info
    Minting
      ✔ Should allow owner to mint tokens
      ✔ Should fail if non-owner tries to mint
      ✔ Should not exceed max supply
      ✔ Should emit TokensMinted event
    ...

  15 passing (2s)
```

### 3. Deploy to Testnet

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Deploy to local network (for development)
npx hardhat node  # Terminal 1
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2
```

Output:

```
🚀 Deploying KaopizCoin...
📝 Deploying with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
💰 Account balance: 0.5 ETH
✅ KaopizCoin deployed to: 0x1234567890abcdef...
📊 Token Info:
   Name: KaopizCoin
   Symbol: KPC
   Decimals: 18
   Initial Supply: 100000000.0 KPC
   Max Supply: 1000000000.0 KPC
```

**⚠️ LƯU Ý:** Copy contract address để dùng cho frontend!

### 4. Verify Contract

```bash
# Verify on Etherscan (Sepolia)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <OWNER_ADDRESS>

# Verify on BSCScan (Testnet)
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <OWNER_ADDRESS>
```

### 5. Interact with Contract

```bash
# Mint tokens
npx hardhat run scripts/interact.js --network sepolia

# Hoặc dùng Hardhat console
npx hardhat console --network sepolia
```

Example console commands:

```javascript
const KaopizCoin = await ethers.getContractFactory("KaopizCoin");
const kpc = await KaopizCoin.attach("0x...contract_address...");

// Check balance
const balance = await kpc.balanceOf("0x...address...");
console.log(ethers.formatEther(balance));

// Mint tokens
await kpc.mint("0x...recipient...", ethers.parseEther("1000"));

// Transfer
await kpc.transfer("0x...recipient...", ethers.parseEther("100"));
```

## 🎨 Frontend

### Setup Frontend

```bash
cd frontend

# Copy contract address
# Chỉnh sửa src/App.jsx và thay YOUR_CONTRACT_ADDRESS

# Start development server
npm run dev
```

Mở browser: `http://localhost:5173`

### Frontend Features

1. **Wallet Connection**

   - Connect/Disconnect MetaMask
   - Display account và network
   - Auto-detect network changes

2. **Token Information**

   - Display token name, symbol, decimals
   - Show total supply và max supply
   - Show user balance
   - Refresh button

3. **Transfer Form**

   - Input recipient address
   - Input amount
   - Send transaction
   - Transaction feedback

4. **Transaction History**
   - Display last 20 transactions
   - Filter by sent/received
   - Link to explorer
   - Auto-refresh

### Build for Production

```bash
cd frontend

# Build
npm run build

# Preview
npm run preview

# Deploy (upload dist/ folder to hosting)
```

## 📚 Detailed Documentation

### Smart Contract API

#### Read Functions

```solidity
// ERC20 Standard
function name() public view returns (string)
function symbol() public view returns (string)
function decimals() public view returns (uint8)
function totalSupply() public view returns (uint256)
function balanceOf(address account) public view returns (uint256)
function allowance(address owner, address spender) public view returns (uint256)

// Custom
function MAX_SUPPLY() public view returns (uint256)
function INITIAL_SUPPLY() public view returns (uint256)
function owner() public view returns (address)
function paused() public view returns (bool)
function getTokenInfo() public view returns (...)
```

#### Write Functions

```solidity
// ERC20 Standard
function transfer(address to, uint256 amount) public returns (bool)
function approve(address spender, uint256 amount) public returns (bool)
function transferFrom(address from, address to, uint256 amount) public returns (bool)

// Minting (Only Owner)
function mint(address to, uint256 amount) public onlyOwner

// Burning (Anyone)
function burn(uint256 amount) public
function burnFrom(address account, uint256 amount) public

// Pausable (Only Owner)
function pause() public onlyOwner
function unpause() public onlyOwner

// Ownable (Only Owner)
function transferOwnership(address newOwner) public onlyOwner
function renounceOwnership() public onlyOwner
```

#### Events

```solidity
// ERC20
event Transfer(address indexed from, address indexed to, uint256 value)
event Approval(address indexed owner, address indexed spender, uint256 value)

// Custom
event TokensMinted(address indexed to, uint256 amount, uint256 timestamp)
event TokensBurned(address indexed from, uint256 amount, uint256 timestamp)
event ContractPaused(address indexed by, uint256 timestamp)
event ContractUnpaused(address indexed by, uint256 timestamp)

// Ownable
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)

// Pausable
event Paused(address account)
event Unpaused(address account)
```

## 🧪 Testing Guide

### Test Coverage

```bash
npx hardhat coverage
```

Expected coverage:

```
File               | % Stmts | % Branch | % Funcs | % Lines |
-------------------|---------|----------|---------|---------|
contracts/         |     100 |      100 |     100 |     100 |
  KaopizCoin.sol   |     100 |      100 |     100 |     100 |
-------------------|---------|----------|---------|---------|
All files          |     100 |      100 |     100 |     100 |
```

### Test Scenarios

✅ **Deployment**

- Contract owner được set đúng
- Initial supply được mint cho owner
- Token info đúng (name, symbol, decimals)

✅ **Minting**

- Owner có thể mint
- Non-owner không thể mint
- Không vượt quá max supply
- Events được emit

✅ **Burning**

- User có thể burn tokens của mình
- BurnFrom với approve
- Events được emit

✅ **Transfer**

- Transfer giữa accounts
- Fail khi insufficient balance
- Fail khi paused

✅ **Pausable**

- Owner có thể pause/unpause
- Transfer bị block khi paused
- Mint/burn vẫn hoạt động khi paused (nếu owner)

## 🔒 Security Considerations

### Implemented

✅ **Access Control**

- `onlyOwner` modifier cho mint và pause
- OpenZeppelin's Ownable

✅ **Pausable**

- Emergency stop mechanism
- Only owner can pause

✅ **Supply Cap**

- MAX_SUPPLY limit
- Prevents infinite minting

✅ **Safe Math**

- Solidity 0.8+ auto checks overflow/underflow

### Best Practices

1. ✅ Use OpenZeppelin contracts (audited)
2. ✅ Implement events for all state changes
3. ✅ Check for zero address
4. ✅ Use modifiers for access control
5. ✅ Test extensively
6. ✅ Verify contract on explorer
7. ✅ Keep private key secure

## 🐛 Troubleshooting

### Common Issues

**1. Deployment fails - Insufficient funds**

```
Error: insufficient funds for gas * price + value
```

**Solution:** Get testnet ETH from faucet

**2. Frontend can't connect to MetaMask**

```
Error: MetaMask not found
```

**Solution:** Install MetaMask extension

**3. Wrong network**

```
Error: execution reverted
```

**Solution:** Switch MetaMask to correct network (Sepolia/BSC Testnet)

**4. Contract not verified**

```
Contract source code not verified
```

**Solution:** Run verify script with correct parameters

## 📖 Resources

### Faucets (Get Testnet ETH)

- **Sepolia:**

  - https://sepoliafaucet.com/
  - https://www.infura.io/faucet/sepolia

- **BSC Testnet:**
  - https://testnet.bnbchain.org/faucet-smart

### Explorers

- **Sepolia:** https://sepolia.etherscan.io/
- **BSC Testnet:** https://testnet.bscscan.com/

### Documentation

- **Hardhat:** https://hardhat.org/docs
- **OpenZeppelin:** https://docs.openzeppelin.com/contracts
- **Ethers.js:** https://docs.ethers.org/v6/
- **Vite:** https://vitejs.dev/

## 🎓 Learning Path

### Beginner

1. Deploy contract to local network
2. Run tests và understand results
3. Interact via Hardhat console

### Intermediate

4. Deploy to testnet
5. Verify contract
6. Connect frontend với MetaMask

### Advanced

7. Customize contract (add features)
8. Optimize gas costs
9. Implement advanced frontend features
10. Add backend monitoring

## 🤝 Contributing

Nếu bạn tìm thấy bug hoặc có suggestions:

1. Tạo issue
2. Fork project
3. Create feature branch
4. Submit pull request

## 📄 License

MIT License - See LICENSE file

---

## 📞 Support

Nếu gặp vấn đề:

1. Đọc lại documentation
2. Check Troubleshooting section
3. Search trên Google/StackOverflow
4. Hỏi trên Discord/Forum

---

**Happy Coding! 🚀**

Made with ❤️ for Kaopiz Team
