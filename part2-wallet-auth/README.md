# Part 2: Wallet, Signing and Authentication (Client-side)

Practical examples of wallet connection, message signing, and user authentication on Ethereum.

## 📋 Learning Objectives

- Connect MetaMask to website
- Understand Provider vs Signer in Ethers.js
- Handle events from MetaMask (account change, network change)
- Implement SIWE (Sign-In With Ethereum)
- Sign and verify messages
- Manage sessions with JWT

## 🛠️ Technologies Used

- **Frontend**: React 18, Vite
- **Library**: Ethers.js v6
- **Backend**: Node.js, Express
- **Auth**: SIWE (EIP-4361), JWT
- **Network**: Sepolia Testnet

## 📁 Directory Structure

```
part2-wallet-auth/
├── frontend/                        # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.jsx    # MetaMask connection
│   │   │   ├── NetworkSwitcher.jsx  # Network switcher
│   │   │   ├── SignMessage.jsx      # Message signing
│   │   │   └── SIWEAuth.jsx         # SIWE authentication
│   │   ├── hooks/
│   │   │   ├── useWallet.js         # Custom hook for wallet
│   │   │   └── useAuth.js           # Custom hook for auth
│   │   ├── utils/
│   │   │   ├── ethereum.js          # Ethereum utilities
│   │   │   └── siwe.js              # SIWE utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                         # Express API
│   ├── src/
│   │   ├── routes/
│   │   │   └── auth.js              # Auth endpoints
│   │   ├── middleware/
│   │   │   └── verifyToken.js       # JWT verification
│   │   ├── utils/
│   │   │   └── siwe.js              # SIWE verification
│   │   └── server.js
│   ├── package.json
│   └── .env.example
│
├── examples/                        # Standalone examples
│   ├── 01-connect-metamask.html     # Basic MetaMask connection
│   ├── 02-provider-signer.html      # Provider vs Signer demo
│   ├── 03-sign-message.html         # Sign & verify message
│   ├── 04-network-switch.html       # Switch networks
│   └── 05-siwe-simple.html          # Simple SIWE example
│
└── README.md
```

## 🚀 Installation Guide

> 📖 **Full Details**: See [SETUP.md](./SETUP.md) for detailed setup instructions and troubleshooting.

### 1. Backend Setup

```bash
cd part2-wallet-auth/backend
npm install

# Create .env file (or copy from .env.example)
echo 'PORT=3001
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456
FRONTEND_URL=http://localhost:5173' > .env
```

### 2. Frontend Setup

```bash
cd part2-wallet-auth/frontend
npm install

# Create .env file (or copy from .env.example)
echo 'VITE_API_URL=http://localhost:3001' > .env
```

### 3. MetaMask Setup

If you don't have MetaMask:
1. Visit https://metamask.io/
2. Install extension for Chrome/Firefox/Brave
3. Create new wallet or import test wallet
4. Switch to Sepolia network

## 📝 Practice Exercises

### Exercise 1: Basic MetaMask Connection

Open file `examples/01-connect-metamask.html` in browser.

**What you'll learn:**
- Check if MetaMask is installed
- Connect wallet with `eth_requestAccounts`
- Get wallet address and balance
- Handle errors when user rejects

**Code highlights:**
```javascript
// Check MetaMask
if (typeof window.ethereum !== 'undefined') {
  console.log('MetaMask is installed!');
}

// Connect
const accounts = await window.ethereum.request({ 
  method: 'eth_requestAccounts' 
});
```

---

### Exercise 2: Provider vs Signer

Open file `examples/02-provider-signer.html` in browser.

**What you'll learn:**
- Provider: Read-only operations
- Signer: Write operations (requires signature)
- When to use Provider vs Signer
- Types of Providers

**Concepts:**
```
Provider (Read):
- getBalance()
- getBlockNumber()
- getTransaction()
- Contract read functions

Signer (Write):
- sendTransaction()
- signMessage()
- Contract write functions
```

---

### Exercise 3: Sign and Verify Message

Open file `examples/03-sign-message.html` in browser.

**What you'll learn:**
- Sign message with MetaMask
- Verify signature
- Personal sign vs Typed data
- Use cases: Proof of ownership

**Flow:**
```
1. User enters message
2. Click "Sign" → MetaMask popup
3. User confirms → Receive signature
4. Verify signature → Recover address
5. Compare with wallet address
```

---

### Exercise 4: Switch Network

Open file `examples/04-network-switch.html` in browser.

**What you'll learn:**
- Detect current network
- Switch network with `wallet_switchEthereumChain`
- Add network with `wallet_addEthereumChain`
- Handle network change events

**Networks:**
- Ethereum Mainnet
- Sepolia Testnet
- BSC Mainnet
- Polygon Mainnet

---

### Exercise 5: SIWE Simple

Open file `examples/05-siwe-simple.html` in browser.

**What you'll learn:**
- SIWE message format
- Sign-in flow
- Nonce generation
- Message verification

**Flow:**
```
1. Generate nonce
2. Create SIWE message
3. Sign message
4. Verify signature
5. Create session
```

---

### Exercise 6: Full-stack App with SIWE

Run both frontend and backend:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit: http://localhost:5173

**What you'll learn:**
- Complete SIWE implementation with React
- JWT authentication flow
- Protected routes with Bearer token
- Session management with localStorage
- Auto sign-out when account/network changes
- Complete logout flow

**Features:**
- ✅ Connect wallet with MetaMask
- ✅ Sign-in with Ethereum (EIP-4361)
- ✅ Nonce generation and verification
- ✅ JWT token management
- ✅ View profile (protected route demo)
- ✅ Logout and clear session
- ✅ Auto-reconnect wallet
- ✅ Handle account/network changes
- ✅ Error handling and user feedback

**Tech Stack:**
- Frontend: React 18 + Vite + Ethers.js v6
- Backend: Node.js + Express + SIWE library
- Auth: JWT tokens + SIWE verification
- State Management: Custom hooks (useWallet, useAuth)

---

## 🧪 Testing

### Test Frontend

```bash
cd frontend
npm run test
```

### Test Backend

```bash
cd backend
npm run test
```

### Manual Testing Checklist

**MetaMask Connection:**
- [ ] Connect wallet successfully
- [ ] Display correct address
- [ ] Display correct balance
- [ ] Handle user rejection
- [ ] Handle MetaMask not installed

**Network Switching:**
- [ ] Detect current network
- [ ] Switch network successfully
- [ ] Add custom network
- [ ] Handle network change event

**Message Signing:**
- [ ] Sign message successfully
- [ ] Verify signature correctly
- [ ] Handle user rejection
- [ ] Display signature

**SIWE Authentication:**
- [ ] Generate nonce
- [ ] Create SIWE message
- [ ] Sign message
- [ ] Verify on backend
- [ ] Receive JWT token
- [ ] Access protected routes
- [ ] Logout successfully

**Event Handling:**
- [ ] accountsChanged event
- [ ] chainChanged event
- [ ] disconnect event
- [ ] Auto-reconnect

---

## 📊 Expected Results

After completing the exercises, you will:

✅ Know how to connect MetaMask to website  
✅ Understand Provider vs Signer clearly  
✅ Handle wallet events properly  
✅ Implement SIWE authentication  
✅ Manage sessions with JWT  
✅ Build complete auth flow  

---

## 🔗 Resources

**MetaMask:**
- [MetaMask Docs](https://docs.metamask.io/)
- [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) - Ethereum Provider API
- [MetaMask Best Practices](https://docs.metamask.io/guide/ethereum-provider.html)

**SIWE:**
- [Sign-In with Ethereum](https://login.xyz/)
- [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) - SIWE Specification
- [SIWE Library](https://github.com/spruceid/siwe)

**Ethers.js:**
- [Providers](https://docs.ethers.org/v6/api/providers/)
- [Signers](https://docs.ethers.org/v6/api/providers/#Signer)
- [BrowserProvider](https://docs.ethers.org/v6/api/providers/#BrowserProvider)

---

## ⚠️ Important Notes

### Security

1. **NEVER** store private key on frontend
2. **ALWAYS** verify signature on backend
3. **USE** HTTPS in production
4. **DON'T** trust data from client
5. **VALIDATE** all inputs

### Best Practices

1. **Handle errors gracefully**
   - User rejects connection
   - MetaMask not installed
   - Network errors

2. **Provide good UX**
   - Loading states
   - Clear error messages
   - Success feedback

3. **Manage state properly**
   - Wallet connection state
   - Network state
   - Auth state

4. **Listen to events**
   - Account changes
   - Network changes
   - Disconnection

---

## 🆘 Troubleshooting

### Error: "MetaMask is not installed"
- Install MetaMask extension
- Refresh page after installation

### Error: "User rejected the request"
- User clicked "Cancel" on MetaMask
- This is normal behavior
- Show message asking user to try again

### Error: "Chain ID mismatch"
- User is on wrong network
- Prompt user to switch network
- Or automatically switch with `wallet_switchEthereumChain`

### Error: "Nonce already used"
- Nonce must be unique for each sign-in attempt
- Generate new nonce for each request

### Frontend can't connect to Backend
- Check backend is running
- Check CORS settings
- Check port numbers

---

## 📞 Support

If you encounter issues:
- [MetaMask Support](https://metamask.zendesk.com/)
- [Ethers.js Discussions](https://github.com/ethers-io/ethers.js/discussions)
- [SIWE Discord](https://discord.gg/login-xyz)

---

**Happy Learning!** 🚀

