# 🎨 KaopizCoin Frontend

React frontend application để tương tác với KaopizCoin smart contract.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📋 Features

### 1. **Wallet Connection** 🦊
- Connect/Disconnect MetaMask
- Display account address
- Show current network
- Auto-detect network changes
- Switch to Sepolia testnet

### 2. **Token Information** 📊
- Token name, symbol, decimals
- Total supply và max supply
- User balance
- Contract status (active/paused)
- Supply percentage
- Refresh button

### 3. **Transfer Tokens** 💸
- Input recipient address
- Input amount
- Validate address và balance
- Send transaction
- Wait for confirmation
- Success/Error feedback

### 4. **Transaction History** 📜
- Display last 20 transactions
- Filter sent/received
- Show timestamp và block number
- Link to Etherscan
- Auto-refresh

## 🔧 Configuration

### Update Contract Address

Chỉnh sửa `src/App.jsx`:

```javascript
// Line 8
const CONTRACT_ADDRESS = 'YOUR_CONTRACT_ADDRESS_HERE'
```

**Contract address hiện tại:** `0xE4e0429D16f174E36D966806569aD800eD6F5B12`

### Supported Networks

- **Sepolia Testnet** (Chain ID: 11155111) - Default
- **BSC Testnet** (Chain ID: 97)
- **Localhost** (Chain ID: 31337)

Để thêm networks khác, chỉnh sửa `TransactionHistory.jsx`:

```javascript
const getExplorerUrl = (txHash) => {
  if (wallet.chainId === 11155111) {
    return `https://sepolia.etherscan.io/tx/${txHash}`
  } else if (wallet.chainId === YOUR_CHAIN_ID) {
    return `https://your-explorer.com/tx/${txHash}`
  }
  return '#'
}
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── WalletConnect.jsx         # Wallet connection component
│   │   ├── WalletConnect.css
│   │   ├── TokenInfo.jsx             # Display token info
│   │   ├── TokenInfo.css
│   │   ├── TransferForm.jsx          # Transfer tokens
│   │   ├── TransferForm.css
│   │   ├── TransactionHistory.jsx    # Show transaction history
│   │   └── TransactionHistory.css
│   ├── App.jsx                       # Main app component
│   ├── App.css
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 🔌 Smart Contract ABI

Contract ABIs được define inline trong components:

**WalletConnect & TokenInfo:**
```javascript
const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function paused() view returns (bool)',
  'function getTokenInfo() view returns (string, string, uint8, uint256, uint256, bool)'
]
```

**TransferForm:**
```javascript
const TOKEN_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
]
```

**TransactionHistory:**
```javascript
const TOKEN_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)'
]
```

## 💡 Usage Examples

### Connect Wallet

```javascript
// User clicks "Connect Wallet" button
// MetaMask popup appears
// User approves connection
// Wallet info is passed to App.jsx via onConnect callback
```

### Transfer Tokens

```javascript
// 1. Enter recipient address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
// 2. Enter amount: 100
// 3. Click "Send Transfer"
// 4. MetaMask popup for confirmation
// 5. Wait for transaction confirmation
// 6. Success message displayed
// 7. Token info and history auto-refresh
```

### View Transactions

```javascript
// Automatically loads when wallet connects
// Shows last 20 transactions
// Click "View on Explorer" to see details
// Click refresh button to update
```

## 🎨 Customization

### Change Theme Colors

Edit `src/index.css`:

```css
:root {
  /* Change primary color */
  --primary-color: #646cff;
  
  /* Change gradient */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Modify Components

Mỗi component có file CSS riêng, dễ dàng customize:

- `WalletConnect.css` - Wallet connection UI
- `TokenInfo.css` - Token information display
- `TransferForm.css` - Transfer form styling
- `TransactionHistory.css` - Transaction list styling

## 🐛 Troubleshooting

### MetaMask not found

```
Error: Please install MetaMask!
```

**Solution:**
1. Install MetaMask extension
2. Refresh page

### Wrong network

```
Warning: Please switch to Sepolia Testnet
```

**Solution:**
1. Click warning message
2. Approve network switch in MetaMask
3. Or manually switch in MetaMask settings

### Transaction failed

```
Error: insufficient funds for gas
```

**Solution:**
- Get testnet ETH from faucet: https://sepoliafaucet.com/

### Contract not responding

```
Error: Failed to load token information
```

**Solution:**
1. Check contract address is correct
2. Check you're on correct network
3. Check RPC connection
4. Try refresh button

## 📦 Dependencies

```json
{
  "ethers": "^6.13.0",      // Ethereum library
  "react": "^18.3.1",        // UI framework
  "react-dom": "^18.3.1",    // React DOM
  "vite": "^5.4.2"           // Build tool
}
```

## 🔐 Security Notes

1. **Never commit private keys**
2. **Validate all user inputs**
3. **Handle errors gracefully**
4. **Always check network before transactions**
5. **Show clear confirmations to users**

## 📱 Responsive Design

Frontend is fully responsive:
- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1200px)
- ✅ Mobile (< 768px)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

Tạo folder `dist/` với static files.

### Deploy Options

1. **Vercel** (Recommended)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   ```bash
   npm install -g netlify-cli
   netlify deploy
   ```

3. **GitHub Pages**
   ```bash
   npm run build
   # Upload dist/ folder to gh-pages branch
   ```

4. **IPFS** (Decentralized)
   ```bash
   npm install -g ipfs
   ipfs add -r dist/
   ```

## 📖 Learn More

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [MetaMask Docs](https://docs.metamask.io/)

---

**Built with ❤️ by Kaopiz Team**

