# Phần 2: Ví, Ký và Xác thực (Client-side)

Ví dụ thực hành về kết nối ví, ký message và xác thực người dùng trên Ethereum.

## 📋 Mục tiêu học tập

- Kết nối MetaMask với website
- Hiểu Provider vs Signer trong Ethers.js
- Xử lý events từ MetaMask (account change, network change)
- Implement SIWE (Sign-In With Ethereum)
- Ký và verify messages
- Quản lý session với JWT

## 🛠️ Công nghệ sử dụng

- **Frontend**: React 18, Vite
- **Library**: Ethers.js v6
- **Backend**: Node.js, Express
- **Auth**: SIWE (EIP-4361), JWT
- **Network**: Sepolia Testnet

## 📁 Cấu trúc thư mục

```
part2-wallet-auth/
├── frontend/                        # React app
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.jsx    # Kết nối MetaMask
│   │   │   ├── NetworkSwitcher.jsx  # Chuyển network
│   │   │   ├── SignMessage.jsx      # Ký message
│   │   │   └── SIWEAuth.jsx         # SIWE authentication
│   │   ├── hooks/
│   │   │   ├── useWallet.js         # Custom hook cho wallet
│   │   │   └── useAuth.js           # Custom hook cho auth
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

## 🚀 Hướng dẫn cài đặt

> 📖 **Chi tiết đầy đủ**: Xem file [SETUP.md](./SETUP.md) để có hướng dẫn setup chi tiết và troubleshooting.

### 1. Cài đặt Backend

```bash
cd part2-wallet-auth/backend
npm install

# Tạo file .env (hoặc copy từ .env.example)
echo 'PORT=3001
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456
FRONTEND_URL=http://localhost:5173' > .env
```

### 2. Cài đặt Frontend

```bash
cd part2-wallet-auth/frontend
npm install

# Tạo file .env (hoặc copy từ .env.example)
echo 'VITE_API_URL=http://localhost:3001' > .env
```

### 3. Cài đặt MetaMask

Nếu chưa có MetaMask:
1. Truy cập https://metamask.io/
2. Cài extension cho Chrome/Firefox/Brave
3. Tạo ví mới hoặc import ví test
4. Chuyển sang Sepolia network

## 📝 Các bài thực hành

### Bài 1: Kết nối MetaMask cơ bản

Mở file `examples/01-connect-metamask.html` trong browser.

**Học được:**
- Kiểm tra MetaMask đã cài chưa
- Kết nối ví với `eth_requestAccounts`
- Lấy địa chỉ ví và số dư
- Xử lý lỗi khi user reject

**Code highlights:**
```javascript
// Kiểm tra MetaMask
if (typeof window.ethereum !== 'undefined') {
  console.log('MetaMask is installed!');
}

// Kết nối
const accounts = await window.ethereum.request({ 
  method: 'eth_requestAccounts' 
});
```

---

### Bài 2: Provider vs Signer

Mở file `examples/02-provider-signer.html` trong browser.

**Học được:**
- Provider: Read-only operations
- Signer: Write operations (cần signature)
- Khi nào dùng Provider, khi nào dùng Signer
- Các loại Providers

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

### Bài 3: Ký và Verify Message

Mở file `examples/03-sign-message.html` trong browser.

**Học được:**
- Ký message với MetaMask
- Verify signature
- Personal sign vs Typed data
- Use cases: Proof of ownership

**Flow:**
```
1. User nhập message
2. Click "Sign" → MetaMask popup
3. User confirm → Nhận signature
4. Verify signature → Recover address
5. So sánh với wallet address
```

---

### Bài 4: Chuyển Network

Mở file `examples/04-network-switch.html` trong browser.

**Học được:**
- Detect current network
- Switch network với `wallet_switchEthereumChain`
- Add network với `wallet_addEthereumChain`
- Handle network change events

**Networks:**
- Ethereum Mainnet
- Sepolia Testnet
- BSC Mainnet
- Polygon Mainnet

---

### Bài 5: SIWE Simple

Mở file `examples/05-siwe-simple.html` trong browser.

**Học được:**
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

### Bài 6: Full-stack App với SIWE

Chạy cả frontend và backend:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Truy cập: http://localhost:5173

**Học được:**
- Complete SIWE implementation với React
- JWT authentication flow
- Protected routes với Bearer token
- Session management với localStorage
- Auto sign-out khi account/network thay đổi
- Logout flow hoàn chỉnh

**Features:**
- ✅ Connect wallet với MetaMask
- ✅ Sign-in with Ethereum (EIP-4361)
- ✅ Nonce generation và verification
- ✅ JWT token management
- ✅ View profile (protected route demo)
- ✅ Logout và clear session
- ✅ Auto-reconnect wallet
- ✅ Handle account/network changes
- ✅ Error handling và user feedback

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
- [ ] Connect wallet thành công
- [ ] Hiển thị đúng địa chỉ
- [ ] Hiển thị đúng số dư
- [ ] Handle user reject
- [ ] Handle MetaMask not installed

**Network Switching:**
- [ ] Detect current network
- [ ] Switch network thành công
- [ ] Add custom network
- [ ] Handle network change event

**Message Signing:**
- [ ] Sign message thành công
- [ ] Verify signature đúng
- [ ] Handle user reject
- [ ] Display signature

**SIWE Authentication:**
- [ ] Generate nonce
- [ ] Create SIWE message
- [ ] Sign message
- [ ] Verify on backend
- [ ] Receive JWT token
- [ ] Access protected routes
- [ ] Logout thành công

**Event Handling:**
- [ ] accountsChanged event
- [ ] chainChanged event
- [ ] disconnect event
- [ ] Auto-reconnect

---

## 📊 Kết quả mong đợi

Sau khi hoàn thành các bài thực hành, bạn sẽ:

✅ Biết cách kết nối MetaMask với website  
✅ Hiểu rõ Provider vs Signer  
✅ Xử lý được wallet events  
✅ Implement SIWE authentication  
✅ Quản lý session với JWT  
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

## ⚠️ Lưu ý quan trọng

### Bảo mật

1. **KHÔNG BAO GIỜ** lưu private key trên frontend
2. **LUÔN** verify signature trên backend
3. **SỬ DỤNG** HTTPS trong production
4. **KHÔNG** trust data từ client
5. **VALIDATE** tất cả inputs

### Best Practices

1. **Handle errors gracefully**
   - User reject connection
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

### Lỗi: "MetaMask is not installed"
- Cài đặt MetaMask extension
- Refresh page sau khi cài

### Lỗi: "User rejected the request"
- User đã click "Cancel" trên MetaMask
- Đây là behavior bình thường
- Show message yêu cầu user thử lại

### Lỗi: "Chain ID mismatch"
- User đang ở wrong network
- Prompt user switch network
- Hoặc tự động switch với `wallet_switchEthereumChain`

### Lỗi: "Nonce already used"
- Nonce phải unique cho mỗi sign-in attempt
- Generate nonce mới cho mỗi request

### Frontend không connect được Backend
- Check backend đang chạy
- Check CORS settings
- Check port numbers

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
- [MetaMask Support](https://metamask.zendesk.com/)
- [Ethers.js Discussions](https://github.com/ethers-io/ethers.js/discussions)
- [SIWE Discord](https://discord.gg/login-xyz)

---

**Happy Learning!** 🚀

