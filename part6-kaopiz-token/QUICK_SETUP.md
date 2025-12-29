# 🚀 Quick Setup Guide - KaopizCoin Project

Hướng dẫn nhanh để tạo project hoàn chỉnh từ đầu.

## ⚡ Setup trong 10 phút

### Bước 1: Cài đặt Dependencies (2 phút)

```bash
cd part6-kaopiz-token

# Install Hardhat và dependencies
npm install

# Hoặc nếu chưa có package.json, chạy:
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv
```

### Bước 2: Copy Smart Contract (1 phút)

Tạo file `contracts/KaopizCoin.sol` và copy nội dung từ **README.md chính (dòng 5653-5770)**.

Hoặc chạy script tự động:

```bash
# Script sẽ extract code từ README.md
node -e "
const fs = require('fs');
const path = require('path');

const contractCode = \`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';

contract KaopizCoin is ERC20, ERC20Burnable, Ownable, Pausable {
    // Events
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;

    constructor(address initialOwner)
        ERC20('KaopizCoin', 'KPC')
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_SUPPLY);
        emit TokensMinted(initialOwner, INITIAL_SUPPLY, block.timestamp);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), 'Cannot mint to zero address');
        require(totalSupply() + amount <= MAX_SUPPLY, 'Exceeds max supply');
        _mint(to, amount);
        emit TokensMinted(to, amount, block.timestamp);
    }

    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount, block.timestamp);
    }

    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount, block.timestamp);
    }

    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    function _update(address from, address to, uint256 value)
        internal
        override
        whenNotPaused
    {
        super._update(from, to, value);
    }

    function getTokenInfo() public view returns (
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenTotalSupply,
        uint256 tokenMaxSupply,
        bool isPaused
    ) {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            paused()
        );
    }
}\`;

fs.mkdirSync('contracts', { recursive: true });
fs.writeFileSync('contracts/KaopizCoin.sol', contractCode);
console.log('✅ Created contracts/KaopizCoin.sol');
"
```

### Bước 3: Copy Test File (1 phút)

Tạo file `test/KaopizCoin.test.js` và copy nội dung từ **README.md chính (dòng 5840-5988)**.

### Bước 4: Tạo Deploy Script (2 phút)

Tạo file `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying KaopizCoin...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  const KaopizCoin = await ethers.getContractFactory("KaopizCoin");
  const kaopizCoin = await KaopizCoin.deploy(deployer.address);
  await kaopizCoin.waitForDeployment();

  const contractAddress = await kaopizCoin.getAddress();
  console.log("✅ KaopizCoin deployed to:", contractAddress);

  const [name, symbol, decimals, totalSupply, maxSupply, isPaused] =
    await kaopizCoin.getTokenInfo();

  console.log("\n📊 Token Info:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatEther(totalSupply), symbol);
  console.log("   Max Supply:", ethers.formatEther(maxSupply), symbol);
  console.log("   Is Paused:", isPaused);

  console.log("\n📝 Save this for later:");
  console.log("   CONTRACT_ADDRESS=" + contractAddress);
  console.log("\n🔍 Verify with:");
  console.log(
    "   npx hardhat verify --network",
    hre.network.name,
    contractAddress,
    deployer.address
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Bước 5: Setup Environment (1 phút)

```bash
# Copy .env.example thành .env
cp .env.example .env

# Chỉnh sửa .env (dùng editor hoặc vim)
nano .env

# Điền:
# - PRIVATE_KEY (từ MetaMask)
# - SEPOLIA_RPC_URL (từ Alchemy/Infura)
```

### Bước 6: Test & Deploy (3 phút)

```bash
# 1. Compile
npx hardhat compile

# 2. Run tests
npx hardhat test

# 3. Deploy to local (for testing)
npx hardhat node  # Terminal 1 - giữ chạy
npx hardhat run scripts/deploy.js --network localhost  # Terminal 2

# 4. Deploy to Sepolia (thật)
npx hardhat run scripts/deploy.js --network sepolia

# 5. Verify (sau khi deploy)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <YOUR_WALLET_ADDRESS>
```

---

## 📱 Frontend Setup (Nếu muốn)

### Option A: Sử dụng các file từ Part 6 trong README

Copy tất cả code từ README.md phần 6.2 và 6.3:
- WalletConnect.jsx
- TokenInfo.jsx
- TransferForm.jsx
- TransactionHistory.jsx
- App.jsx

### Option B: Clone từ example (Nếu có sẵn)

```bash
# Nếu có example repository
git clone <example-repo> frontend
cd frontend
npm install
npm run dev
```

### Option C: Tạo nhanh với Vite

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install ethers

# Copy các component từ README.md
# Chỉnh sửa App.jsx với CONTRACT_ADDRESS
npm run dev
```

---

## 🎯 Checklist Hoàn thành

### Smart Contract
- [ ] `contracts/KaopizCoin.sol` đã tạo
- [ ] Compile thành công (`npx hardhat compile`)
- [ ] Tests pass (`npx hardhat test`)

### Deployment
- [ ] `.env` đã config đúng
- [ ] Deploy thành công lên testnet
- [ ] Contract đã verify trên explorer
- [ ] Copy contract address

### Frontend (Optional)
- [ ] Frontend setup xong
- [ ] Connect MetaMask thành công
- [ ] Có thể xem token info
- [ ] Có thể transfer tokens

---

## 🆘 Troubleshooting Nhanh

### Error: Cannot find module '@openzeppelin/contracts'
```bash
npm install @openzeppelin/contracts
```

### Error: insufficient funds
```bash
# Lấy testnet ETH từ faucet
# Sepolia: https://sepoliafaucet.com/
```

### Error: invalid private key
```bash
# Check PRIVATE_KEY trong .env
# Phải bắt đầu với 0x
# Độ dài 66 characters (bao gồm 0x)
```

### Frontend không connect được MetaMask
```bash
# 1. Cài MetaMask extension
# 2. Switch network sang Sepolia
# 3. Refresh page
```

---

## 📚 Next Steps

Sau khi hoàn thành:

1. **Test kỹ trên testnet**
   - Mint tokens
   - Transfer
   - Burn
   - Pause/Unpause

2. **Improve Frontend**
   - Add more features
   - Better UI/UX
   - Error handling

3. **Security Review**
   - Code audit
   - Test edge cases
   - Gas optimization

4. **Documentation**
   - API documentation
   - User guide
   - Developer guide

---

## ✨ Tips

1. **Development:**
   - Dùng `hardhat node` cho local testing
   - Dùng `hardhat console` để interact nhanh
   - Enable gas reporter: `REPORT_GAS=true npx hardhat test`

2. **Deployment:**
   - Test kỹ trên testnet trước
   - Verify contract ngay sau deploy
   - Backup private key an toàn

3. **Frontend:**
   - Dùng `useEffect` để listen events
   - Handle loading states
   - Show transaction status
   - Add error notifications

---

**Happy Coding! 🚀**

> 💡 Nếu gặp khó khăn, tham khảo code đầy đủ trong README.md chính (Phần 6)

