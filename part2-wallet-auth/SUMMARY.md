# 📋 Tổng kết Phần 2: Ví, Ký và Xác thực

## ✅ Những gì đã tạo

### 1. Standalone HTML Examples (5 files)

#### **Example 1: Connect MetaMask** (`01-connect-metamask.html`)
**Học được**:
- Kiểm tra MetaMask đã cài chưa
- Kết nối ví với `eth_requestAccounts`
- Lấy địa chỉ, số dư, network info
- Xử lý lỗi và events

**Features**:
- ✅ Detect MetaMask
- ✅ Connect wallet
- ✅ Display wallet info
- ✅ Handle account/chain changes
- ✅ Auto-reconnect

---

#### **Example 2: Provider vs Signer** (`02-provider-signer.html`)
**Học được**:
- Provider: Read-only operations
- Signer: Write operations
- Khi nào dùng Provider/Signer
- So sánh chi tiết

**Provider Functions**:
- `getBalance()` - Lấy số dư
- `getBlockNumber()` - Lấy block number
- `getGasPrice()` - Lấy gas price
- `getNetwork()` - Lấy network info

**Signer Functions**:
- `sendTransaction()` - Gửi ETH
- `signMessage()` - Ký message
- `getAddress()` - Lấy địa chỉ signer

---

#### **Example 3: Sign Message** (`03-sign-message.html`)
**Học được**:
- Ký message với MetaMask
- Verify signature off-chain
- Recover address từ signature
- Use cases thực tế

**Flow**:
```
1. User nhập message
2. Sign với MetaMask
3. Nhận signature
4. Verify signature
5. Recover address
6. So sánh với expected address
```

**Use Cases**:
- Authentication (SIWE)
- Proof of ownership
- Off-chain voting
- Message verification

---

#### **Example 4: Network Switch** (`04-network-switch.html`)
**Học được**:
- Detect current network
- Switch network với `wallet_switchEthereumChain`
- Add custom network với `wallet_addEthereumChain`
- Handle network change events

**Networks hỗ trợ**:
- Ethereum Mainnet
- Sepolia Testnet
- Polygon Mainnet
- BSC Mainnet

**Features**:
- ✅ Detect current network
- ✅ Switch network
- ✅ Add custom network
- ✅ Handle network change event
- ✅ Visual feedback

---

#### **Example 5: SIWE Simple** (`05-siwe-simple.html`)
**Học được**:
- SIWE message format theo EIP-4361
- Generate nonce
- Create và sign SIWE message
- Verify signature
- Create session với localStorage

**SIWE Flow**:
```
1. Generate random nonce
2. Create SIWE message
3. User ký message
4. Verify signature (recover address)
5. Create session
```

**Features**:
- ✅ Complete SIWE flow
- ✅ Nonce generation
- ✅ Message signing
- ✅ Signature verification
- ✅ Session management
- ✅ Auto sign-out on account/network change

---

### 2. React Frontend Application

#### **Structure**:
```
frontend/
├── src/
│   ├── hooks/
│   │   ├── useWallet.js          # Custom hook quản lý wallet
│   │   └── useAuth.js            # Custom hook cho SIWE auth
│   ├── components/
│   │   ├── WalletConnect.jsx     # Component kết nối ví
│   │   ├── WalletConnect.css     # Styles
│   │   ├── SIWEAuth.jsx          # SIWE authentication component
│   │   └── SIWEAuth.css          # Styles
│   ├── utils/
│   │   └── siwe.js               # SIWE utilities & API calls
│   ├── App.jsx                   # Main app
│   ├── App.css                   # App styles
│   └── main.jsx                  # Entry point
├── index.html
├── vite.config.js
└── package.json
```

#### **useWallet Hook**:
Custom hook cung cấp:
- `account` - Địa chỉ ví
- `chainId` - Chain ID
- `provider` - Ethers provider
- `signer` - Ethers signer
- `isConnected` - Trạng thái kết nối
- `isConnecting` - Đang kết nối
- `error` - Lỗi nếu có
- `connect()` - Kết nối ví
- `disconnect()` - Ngắt kết nối

**Features**:
- ✅ Auto-connect nếu đã connect trước
- ✅ Listen to account changes
- ✅ Listen to chain changes
- ✅ Handle disconnect
- ✅ Error handling

#### **WalletConnect Component**:
- ✅ Hiển thị button kết nối
- ✅ Hiển thị thông tin wallet
- ✅ Copy địa chỉ
- ✅ Link to Etherscan
- ✅ Disconnect button
- ✅ Loading states
- ✅ Error messages

#### **useAuth Hook**:
Custom hook cung cấp:
- `isAuthenticated` - Trạng thái đăng nhập
- `isAuthenticating` - Đang xác thực
- `user` - Thông tin user
- `error` - Lỗi nếu có
- `signIn()` - Sign in với SIWE
- `signOut()` - Sign out

**Features**:
- ✅ Complete SIWE flow
- ✅ JWT token management
- ✅ Auto sign-out on account/network change
- ✅ Token persistence với localStorage
- ✅ Error handling

#### **SIWEAuth Component**:
- ✅ SIWE authentication UI
- ✅ Sign-in button
- ✅ User info display
- ✅ Protected route demo
- ✅ Sign-out button
- ✅ Loading states
- ✅ Error messages
- ✅ Success feedback

#### **SIWE Utils**:
- `createSiweMessage()` - Tạo SIWE message
- `requestNonce()` - Request nonce từ backend
- `verifySiweMessage()` - Verify với backend
- `getCurrentUser()` - Get user info (protected)
- `logoutUser()` - Logout
- `getUserProfile()` - Get profile (protected)
- Token management functions

---

### 3. Backend API (Node.js + Express)

#### **Structure**:
```
backend/
├── src/
│   └── server.js                 # Express server với SIWE
├── env.example
└── package.json
```

#### **API Endpoints**:

**1. GET `/api/auth/nonce`**
- Generate nonce cho SIWE
- Response: `{ nonce }`

**2. POST `/api/auth/verify`**
- Verify SIWE message và signature
- Body: `{ message, signature }`
- Response: `{ token, address }`

**3. GET `/api/auth/me`** (Protected)
- Lấy thông tin user hiện tại
- Header: `Authorization: Bearer <token>`
- Response: `{ address, chainId, iat, exp }`

**4. POST `/api/auth/logout`** (Protected)
- Logout user
- Response: `{ success: true }`

**5. GET `/api/profile`** (Protected)
- Example protected route
- Response: User profile data

**6. GET `/health`**
- Health check
- Response: `{ status, timestamp, uptime }`

#### **Features**:
- ✅ SIWE authentication
- ✅ JWT token generation
- ✅ Token verification middleware
- ✅ Nonce management
- ✅ CORS configuration
- ✅ Error handling
- ✅ Graceful shutdown

---

## 📊 Kiến thức đã học

### 1. MetaMask Integration

✅ **EIP-1193: Ethereum Provider API**
- `window.ethereum` object
- `eth_requestAccounts` - Kết nối ví
- `eth_accounts` - Lấy accounts
- `eth_chainId` - Lấy chain ID

✅ **Events**
- `accountsChanged` - Account thay đổi
- `chainChanged` - Network thay đổi
- `disconnect` - Ngắt kết nối

✅ **Best Practices**
- Kiểm tra MetaMask installed
- Handle user rejection
- Auto-reconnect
- Listen to events

---

### 2. Ethers.js v6

✅ **Provider (Read-only)**
```javascript
const provider = new BrowserProvider(window.ethereum);

// Read operations
await provider.getBalance(address);
await provider.getBlockNumber();
await provider.getGasPrice();
await provider.getNetwork();
```

✅ **Signer (Write)**
```javascript
const signer = await provider.getSigner();

// Write operations
await signer.sendTransaction({ to, value });
await signer.signMessage(message);
const address = await signer.getAddress();
```

---

### 3. Message Signing

✅ **Sign Message**
```javascript
const message = "Hello Ethereum!";
const signature = await signer.signMessage(message);
```

✅ **Verify Signature**
```javascript
import { verifyMessage } from 'ethers';

const recoveredAddress = verifyMessage(message, signature);
// So sánh với expected address
```

✅ **Use Cases**
- Authentication
- Proof of ownership
- Off-chain voting
- Message verification

---

### 4. SIWE (Sign-In With Ethereum)

✅ **EIP-4361 Standard**
- Decentralized authentication
- Không cần password
- Chứng minh ownership
- Off-chain verification

✅ **Flow**
```
1. Frontend: Request nonce từ backend
2. Frontend: Tạo SIWE message
3. Frontend: User ký message
4. Frontend: Gửi message + signature lên backend
5. Backend: Verify signature
6. Backend: Issue JWT token
7. Frontend: Lưu token, gửi kèm requests
```

✅ **SIWE Message Format**
```
example.com wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

I accept the Terms of Service: https://example.com/tos

URI: https://example.com
Version: 1
Chain ID: 1
Nonce: 32891756
Issued At: 2025-01-01T00:00:00.000Z
```

---

### 5. JWT Authentication

✅ **Token Generation**
```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { address, chainId },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

✅ **Token Verification**
```javascript
const decoded = jwt.verify(token, JWT_SECRET);
// decoded = { address, chainId, iat, exp }
```

✅ **Protected Routes**
```javascript
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  req.user = decoded;
  next();
}

app.get('/api/profile', verifyToken, (req, res) => {
  // req.user.address available
});
```

---

### 6. React Patterns

✅ **Custom Hooks**
- Encapsulate wallet logic
- Reusable across components
- Manage state và side effects

✅ **Event Listeners**
- Setup trong useEffect
- Cleanup on unmount
- Handle account/chain changes

✅ **Error Handling**
- User rejection (code 4001)
- Pending request (code -32002)
- Network errors
- Display user-friendly messages

---

## 🎯 Skills Acquired

Sau khi hoàn thành Phần 2, bạn có thể:

✅ Kết nối MetaMask với website  
✅ Quản lý wallet state với React hooks  
✅ Xử lý wallet events  
✅ Ký và verify messages  
✅ Implement SIWE authentication  
✅ Build protected routes với JWT  
✅ Tạo full-stack auth flow  
✅ Handle errors gracefully  

---

## 📈 Next Steps

Sau khi master Phần 2, bạn có thể:

1. **Thực hành thêm**:
   - Thêm network switcher
   - Implement typed data signing (EIP-712)
   - Add session management
   - Build complete auth UI

2. **Học Phần 3**: Xử lý Events
   - Query past events
   - Real-time event listeners
   - Custom events
   - Event indexing

3. **Explore Advanced Topics**:
   - Multi-wallet support (Coinbase, WalletConnect)
   - Account abstraction (ERC-4337)
   - Gasless transactions
   - Social recovery

---

## 🔗 Resources

**MetaMask**:
- [MetaMask Docs](https://docs.metamask.io/)
- [EIP-1193](https://eips.ethereum.org/EIPS/eip-1193) - Provider API
- [Best Practices](https://docs.metamask.io/guide/ethereum-provider.html)

**SIWE**:
- [Sign-In With Ethereum](https://login.xyz/)
- [EIP-4361](https://eips.ethereum.org/EIPS/eip-4361) - SIWE Spec
- [SIWE Library](https://github.com/spruceid/siwe)

**Ethers.js**:
- [Providers](https://docs.ethers.org/v6/api/providers/)
- [Signers](https://docs.ethers.org/v6/api/providers/#Signer)
- [BrowserProvider](https://docs.ethers.org/v6/api/providers/#BrowserProvider)

**React**:
- [Hooks](https://react.dev/reference/react)
- [useEffect](https://react.dev/reference/react/useEffect)
- [Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

## ⚠️ Security Notes

**Frontend**:
- ❌ KHÔNG lưu private key
- ❌ KHÔNG trust client data
- ✅ Validate inputs
- ✅ Handle errors

**Backend**:
- ✅ Verify signatures server-side
- ✅ Use secure JWT secret
- ✅ Implement rate limiting
- ✅ Validate nonces
- ✅ Use HTTPS in production

**SIWE**:
- ✅ Nonce phải unique
- ✅ Nonce phải expire
- ✅ Verify domain
- ✅ Check chain ID

---

## ✨ Congratulations!

Bạn đã hoàn thành **Phần 2: Ví, Ký và Xác thực**! 🎉

Bạn đã học được:
- ✅ Kết nối MetaMask
- ✅ Provider vs Signer
- ✅ Message signing
- ✅ SIWE authentication
- ✅ JWT tokens
- ✅ Protected routes

**Keep building!** 🚀

---

_Tài liệu được biên soạn bởi Kaopiz Team - © 2025_

