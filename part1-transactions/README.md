# Part 1: Money Transfer and Transaction Operations

Practical examples of money transfer mechanisms on Ethereum testnet.

## 📋 Learning Objectives

- Understand the difference between ETH and ERC20 token transfers
- Practice `transfer`, `approve`, `transferFrom`
- Observe Nonce, Gas, and Confirmations
- Deploy and interact with real smart contracts

## 🛠️ Technologies Used

- **Network**: Sepolia Testnet
- **Framework**: Hardhat
- **Library**: Ethers.js v6
- **Language**: Solidity 0.8.20, JavaScript

## 📁 Directory Structure

```
part1-transactions/
├── contracts/
│   └── SimpleERC20.sol          # Simple ERC20 smart contract
├── scripts/
│   ├── 01-deploy.js             # Deploy contract
│   ├── 02-transfer-eth.js       # Demo ETH transfer
│   ├── 03-transfer-erc20.js     # Demo ERC20 transfer
│   ├── 04-approve-transferFrom.js # Demo approve/transferFrom
│   ├── 05-nonce-demo.js         # Demo Nonce
│   ├── 06-gas-estimation.js     # Demo Gas estimation
│   └── 07-confirmations.js      # Demo Confirmations
├── test/
│   └── SimpleERC20.test.js      # Unit tests
├── .env.example                 # Template for environment variables
├── hardhat.config.js            # Hardhat configuration
├── package.json
└── README.md
```

## 🚀 Installation Guide

### 1. Install dependencies

```bash
cd part1-transactions
npm install
```

### 2. Environment configuration

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Fill in the information in `.env`:

```env
# Sepolia RPC URL (get from Alchemy or Infura)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Private key of test wallet (NEVER use real wallet!)
PRIVATE_KEY=your_private_key_here

# Etherscan API key (to verify contract)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 3. Get Sepolia ETH (Testnet)

Visit these faucets to get test ETH:

- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

## 📝 Practice Exercises

### Exercise 1: Deploy Smart Contract

```bash
npx hardhat run scripts/01-deploy.js --network sepolia
```

**What you'll learn:**

- How to deploy smart contract to testnet
- Gas cost for deployment
- Verify contract on Etherscan

### Exercise 2: Transfer ETH

```bash
npx hardhat run scripts/02-transfer-eth.js --network sepolia
```

**What you'll learn:**

- Native token (ETH) transfer mechanism
- Gas cost for ETH transfer (~21,000 gas)
- Transaction receipt and block confirmation

### Exercise 3: Transfer ERC20

```bash
npx hardhat run scripts/03-transfer-erc20.js --network sepolia
```

**What you'll learn:**

- How to call ERC20 `transfer()` function
- Gas cost for ERC20 transfer (~50,000-65,000 gas)
- Comparison with ETH transfer

### Exercise 4: Approve and TransferFrom

```bash
npx hardhat run scripts/04-approve-transferFrom.js --network sepolia
```

**What you'll learn:**

- Flow of approve/transferFrom
- Use case: DEX, payment gateway
- Check allowance

### Exercise 5: Nonce Demo

```bash
npx hardhat run scripts/05-nonce-demo.js --network sepolia
```

**What you'll learn:**

- What is nonce and why it's important
- Stuck transaction and how to fix
- Parallel transactions

### Exercise 6: Gas Estimation

```bash
npx hardhat run scripts/06-gas-estimation.js --network sepolia
```

**What you'll learn:**

- Estimate gas before sending transaction
- EIP-1559: Base Fee + Priority Fee
- Automatic vs manual gas handling

### Exercise 7: Confirmations

```bash
npx hardhat run scripts/07-confirmations.js --network sepolia
```

**What you'll learn:**

- Wait for confirmations
- Why multiple confirmations are needed
- Re-org attack

## 🧪 Run Tests

```bash
# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test
npx hardhat test test/SimpleERC20.test.js
```

## 📊 Expected Results

After completing the exercises, you will:

✅ Understand the difference between ETH vs ERC20  
✅ Know how to use transfer/approve/transferFrom  
✅ Understand Nonce and how to handle stuck transactions  
✅ Know how to estimate and optimize gas  
✅ Understand confirmations and transaction finality

## 🔗 Resources

- [Sepolia Testnet Explorer](https://sepolia.etherscan.io/)
- [ERC20 Standard (EIP-20)](https://eips.ethereum.org/EIPS/eip-20)
- [EIP-1559 (Gas Fee)](https://eips.ethereum.org/EIPS/eip-1559)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)

## ⚠️ Important Notes

1. **NEVER** push private key to Git
2. Only use test wallet, don't use wallet with real money
3. Sepolia ETH has no value, can be obtained for free
4. Each transaction needs to wait ~12 seconds to be confirmed

## 🆘 Troubleshooting

### Error: "insufficient funds for gas"

- Need to get more Sepolia ETH from faucet

### Error: "nonce too low"

- Reset MetaMask: Settings → Advanced → Clear activity tab data

### Error: "replacement transaction underpriced"

- Increase gas price or wait for old transaction to complete

### Transaction stuck

- See script `05-nonce-demo.js` to learn how to fix

## 📞 Support

If you encounter issues, refer to:

- [Hardhat Discord](https://hardhat.org/discord)
- [Ethereum Stack Exchange](https://ethereum.stackexchange.com/)
- Documentation in each script

---

**Happy Learning!** 🚀
