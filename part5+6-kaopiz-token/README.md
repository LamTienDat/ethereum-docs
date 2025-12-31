# 🪙 TLCoin (TLC) - Complete DApp Project

Complete project from Smart Contract to Frontend for custom ERC20 token.

## 📋 Overview

**TLCoin (TLC)** is an ERC20 token with features:

- ✅ ERC20 standard compliant
- ✅ Mint tokens (owner only)
- ✅ Burn tokens (anyone)
- ✅ Pause/Unpause transfers (owner only)
- ✅ Complete event logging
- ✅ Max supply limit (1 billion tokens)
- ✅ Initial supply (100 million tokens)

## 🎯 Learning Objectives

After completing this project, you will know how to:

1. **Smart Contract Development**

   - Write ERC20 token with OpenZeppelin
   - Implement access control (Ownable)
   - Add pausable mechanism
   - Custom events and modifiers

2. **Deployment**

   - Deploy to testnet (Sepolia/BSC Testnet)
   - Verify contract on Etherscan
   - Manage deployment scripts

3. **Frontend Development**
   - Connect wallet with MetaMask
   - Interact with smart contract
   - Display token information
   - Send transactions
   - Listen to events

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or pnpm
- MetaMask wallet
- Testnet ETH (from faucet)

### Installation

```bash
# 1. Clone or copy project
cd part6-tl-token

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Setup environment
cp .env.example .env
# Edit .env with your information
```

### Configuration

Create `.env` file:

```bash
# Wallet private key (for deployment)
PRIVATE_KEY=0x...your_private_key...

# RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

## 📦 Project Structure

```
part6-tl-token/
├── contracts/
│   └── TLCoin.sol          # Main smart contract
├── scripts/
│   ├── deploy.js               # Deploy script
│   ├── interact.js             # Interact with contract
│   └── verify.js               # Verify on Etherscan
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

### 2. Deploy to Testnet

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
🚀 Deploying TLCoin...
📝 Deploying with account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
💰 Account balance: 0.5 ETH
✅ TLCoin deployed to: 0x1234567890abcdef...
📊 Token Info:
   Name: TLCoin
   Symbol: TLC
   Decimals: 18
   Initial Supply: 100000000.0 TLC
   Max Supply: 1000000000.0 TLC
```

**⚠️ NOTE:** Copy contract address to use for frontend!

### 3. Verify Contract

```bash
# Verify on Etherscan (Sepolia)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <OWNER_ADDRESS>

# Verify on BSCScan (Testnet)
npx hardhat verify --network bscTestnet <CONTRACT_ADDRESS> <OWNER_ADDRESS>
```

### 4. Interact with Contract

```bash
# Mint tokens
npx hardhat run scripts/interact.js --network sepolia

# Or use Hardhat console
npx hardhat console --network sepolia
```

Example console commands:

```javascript
const TLCoin = await ethers.getContractFactory("TLCoin");
const kpc = await TLCoin.attach("0x...contract_address...");

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
# Edit src/App.jsx and replace YOUR_CONTRACT_ADDRESS

# Start development server
npm run dev
```

Open browser: `http://localhost:5173`

### Frontend Features

1. **Wallet Connection**

   - Connect/Disconnect MetaMask
   - Display account and network
   - Auto-detect network changes

2. **Token Information**

   - Display token name, symbol, decimals
   - Show total supply and max supply
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

## 🔒 Security Considerations

### Implemented

✅ **Access Control**

- `onlyOwner` modifier for mint and pause
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
5. ✅ Verify contract on explorer
6. ✅ Keep private key secure

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
2. Interact via Hardhat console

### Intermediate

3. Deploy to testnet
4. Verify contract
5. Connect frontend with MetaMask

### Advanced

6. Customize contract (add features)
7. Optimize gas costs
8. Implement advanced frontend features
9. Add backend monitoring

## 🤝 Contributing

If you find bugs or have suggestions:

1. Create issue
2. Fork project
3. Create feature branch
4. Submit pull request

## 📄 License

MIT License - See LICENSE file

---

## 📞 Support

If you encounter issues:

1. Re-read documentation
2. Check Troubleshooting section
3. Search on Google/StackOverflow
4. Ask on Discord/Forum

---

**Happy Coding! 🚀**
