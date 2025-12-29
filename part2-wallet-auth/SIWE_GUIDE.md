# 🔐 SIWE (Sign-In With Ethereum) - Hướng dẫn chi tiết

## 📖 Tổng quan

SIWE (Sign-In With Ethereum) là một chuẩn authentication (EIP-4361) cho phép người dùng đăng nhập vào ứng dụng bằng ví Ethereum mà không cần password.

### Tại sao dùng SIWE?

✅ **Không cần password**: User không phải nhớ password  
✅ **Decentralized**: Không phụ thuộc vào third-party auth providers  
✅ **Proof of ownership**: Chứng minh user sở hữu private key  
✅ **Standardized**: Theo chuẩn EIP-4361  
✅ **Secure**: Dùng cryptographic signatures  

### Use Cases

- 🎮 Gaming platforms
- 🖼️ NFT marketplaces
- 💰 DeFi applications
- 🌐 Web3 social networks
- 📱 Decentralized apps (dApps)

---

## 🔄 SIWE Flow

### High-level Flow

```
┌─────────┐                  ┌─────────┐                  ┌──────────┐
│         │                  │         │                  │          │
│  User   │                  │ Frontend│                  │ Backend  │
│         │                  │         │                  │          │
└────┬────┘                  └────┬────┘                  └────┬─────┘
     │                            │                            │
     │  1. Click "Sign In"        │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │  2. Request nonce          │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │  3. Return nonce           │
     │                            │<───────────────────────────┤
     │                            │                            │
     │                            │  4. Create SIWE message    │
     │                            │                            │
     │  5. Sign message           │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
     │  6. Return signature       │                            │
     ├───────────────────────────>│                            │
     │                            │                            │
     │                            │  7. Send message + sig     │
     │                            ├───────────────────────────>│
     │                            │                            │
     │                            │                            │  8. Verify
     │                            │                            │     signature
     │                            │                            │
     │                            │  9. Return JWT token       │
     │                            │<───────────────────────────┤
     │                            │                            │
     │  10. Authenticated!        │                            │
     │<───────────────────────────┤                            │
     │                            │                            │
```

### Detailed Steps

#### Step 1: Request Nonce

Frontend gọi API để lấy nonce:

```javascript
// GET /api/auth/nonce
const response = await fetch('http://localhost:3001/api/auth/nonce');
const { nonce } = await response.json();
// nonce = "0x1234567890abcdef"
```

**Tại sao cần nonce?**
- Prevent replay attacks
- Đảm bảo mỗi sign-in request là unique
- Nonce chỉ dùng được 1 lần và có thời gian expire

#### Step 2: Create SIWE Message

Tạo message theo format EIP-4361:

```javascript
const message = `${domain} wants you to sign in with your Ethereum account:
${address}

I accept the Terms of Service: ${origin}/tos

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
```

**Example message:**

```
localhost:5173 wants you to sign in with your Ethereum account:
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

I accept the Terms of Service: http://localhost:5173/tos

URI: http://localhost:5173
Version: 1
Chain ID: 11155111
Nonce: 0x1234567890abcdef
Issued At: 2025-01-01T00:00:00.000Z
```

#### Step 3: Sign Message

User ký message bằng private key:

```javascript
const signature = await signer.signMessage(message);
// signature = "0xabcdef..."
```

MetaMask sẽ hiển thị popup yêu cầu user confirm.

#### Step 4: Verify Signature

Backend verify signature:

```javascript
import { SiweMessage } from 'siwe';

// Parse message
const siweMessage = new SiweMessage(message);

// Verify signature
const fields = await siweMessage.verify({ signature });
// fields.data.address = "0x742d35..."
```

#### Step 5: Issue JWT Token

Nếu verify thành công, issue JWT token:

```javascript
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { address: fields.data.address, chainId: fields.data.chainId },
  JWT_SECRET,
  { expiresIn: '24h' }
);
```

#### Step 6: Use Token

Frontend lưu token và gửi kèm trong requests:

```javascript
// Save token
localStorage.setItem('siwe_token', token);

// Use token in requests
const response = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 💻 Implementation

### Frontend (React)

#### 1. Create SIWE Utils (`utils/siwe.js`)

```javascript
export function createSiweMessage(address, chainId, nonce) {
  const domain = window.location.host;
  const origin = window.location.origin;
  const issuedAt = new Date().toISOString();

  return `${domain} wants you to sign in with your Ethereum account:
${address}

I accept the Terms of Service: ${origin}/tos

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;
}

export async function requestNonce() {
  const response = await fetch(`${API_URL}/api/auth/nonce`);
  const { nonce } = await response.json();
  return nonce;
}

export async function verifySiweMessage(message, signature) {
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, signature })
  });
  return await response.json();
}
```

#### 2. Create Auth Hook (`hooks/useAuth.js`)

```javascript
export function useAuth() {
  const { account, chainId, signer } = useWallet();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const signIn = async () => {
    // 1. Request nonce
    const nonce = await requestNonce();
    
    // 2. Create message
    const message = createSiweMessage(account, chainId, nonce);
    
    // 3. Sign message
    const signature = await signer.signMessage(message);
    
    // 4. Verify with backend
    const result = await verifySiweMessage(message, signature);
    
    // 5. Save token
    localStorage.setItem('siwe_token', result.token);
    setIsAuthenticated(true);
  };

  const signOut = () => {
    localStorage.removeItem('siwe_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return { isAuthenticated, user, signIn, signOut };
}
```

#### 3. Create Auth Component (`components/SIWEAuth.jsx`)

```javascript
export function SIWEAuth() {
  const { isAuthenticated, signIn, signOut } = useAuth();

  if (!isAuthenticated) {
    return (
      <button onClick={signIn}>
        🔐 Sign-In với Ethereum
      </button>
    );
  }

  return (
    <div>
      <p>✅ Đã đăng nhập!</p>
      <button onClick={signOut}>👋 Sign Out</button>
    </div>
  );
}
```

### Backend (Node.js + Express)

#### 1. Generate Nonce Endpoint

```javascript
import { ethers } from 'ethers';

const nonces = new Map(); // In production: use Redis

app.get('/api/auth/nonce', (req, res) => {
  const nonce = ethers.hexlify(ethers.randomBytes(16));
  nonces.set(nonce, Date.now());
  
  res.json({ nonce });
});
```

#### 2. Verify Signature Endpoint

```javascript
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';

app.post('/api/auth/verify', async (req, res) => {
  const { message, signature } = req.body;

  // Parse SIWE message
  const siweMessage = new SiweMessage(message);

  // Verify nonce exists
  if (!nonces.has(siweMessage.nonce)) {
    return res.status(400).json({ error: 'Invalid nonce' });
  }

  // Verify signature
  const fields = await siweMessage.verify({ signature });

  // Delete used nonce
  nonces.delete(siweMessage.nonce);

  // Generate JWT token
  const token = jwt.sign(
    { address: fields.data.address, chainId: fields.data.chainId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, address: fields.data.address });
});
```

#### 3. Protected Route Middleware

```javascript
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Use middleware
app.get('/api/profile', verifyToken, (req, res) => {
  res.json({
    address: req.user.address,
    chainId: req.user.chainId
  });
});
```

---

## 🔒 Security Best Practices

### Nonce Management

✅ **DO:**
- Generate cryptographically secure random nonces
- Store nonces với timestamp
- Expire nonces sau 5-10 phút
- Delete nonces sau khi dùng (one-time use)
- Use Redis trong production (không dùng in-memory)

❌ **DON'T:**
- Reuse nonces
- Use predictable nonces (sequential numbers)
- Store nonces indefinitely
- Skip nonce validation

### JWT Tokens

✅ **DO:**
- Use strong, random JWT secret
- Set reasonable expiration time (1-24 hours)
- Implement refresh token mechanism
- Store tokens securely (httpOnly cookies hoặc localStorage)
- Validate tokens on every protected route

❌ **DON'T:**
- Use weak or default secrets
- Set very long expiration times
- Store tokens in plain text
- Trust client-side validation
- Expose JWT secret

### Signature Verification

✅ **DO:**
- Always verify signatures on backend
- Check nonce validity
- Validate message format
- Check domain and chain ID
- Handle errors properly

❌ **DON'T:**
- Trust client-side verification
- Skip nonce validation
- Accept expired messages
- Ignore domain validation

### HTTPS

✅ **DO:**
- Use HTTPS in production
- Enforce HTTPS redirects
- Use secure cookies
- Enable HSTS

❌ **DON'T:**
- Use HTTP in production
- Allow mixed content
- Disable SSL verification

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid or expired nonce"

**Cause:** Nonce đã được dùng hoặc expired

**Solution:**
- Request nonce mới
- Kiểm tra nonce expiration time
- Đảm bảo nonce được delete sau khi verify

### Issue 2: "Signature verification failed"

**Cause:** Message hoặc signature không đúng

**Solution:**
- Kiểm tra message format chính xác
- Đảm bảo address đúng (lowercase)
- Verify signature với đúng message
- Check chain ID match

### Issue 3: "Token expired"

**Cause:** JWT token đã hết hạn

**Solution:**
- Implement refresh token mechanism
- Prompt user to sign in again
- Check token expiration trước khi dùng

### Issue 4: "CORS error"

**Cause:** Backend không allow frontend origin

**Solution:**
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

## 📊 Testing

### Manual Testing

1. **Test Sign-In Flow:**
   - Click "Sign In"
   - Verify MetaMask popup appears
   - Sign message
   - Verify token received
   - Check localStorage has token

2. **Test Protected Routes:**
   - Sign in first
   - Call protected API
   - Verify response with user data
   - Check Authorization header sent

3. **Test Sign-Out:**
   - Click "Sign Out"
   - Verify token removed from localStorage
   - Verify can't access protected routes

4. **Test Edge Cases:**
   - Reject signature in MetaMask
   - Change account after sign-in
   - Change network after sign-in
   - Try to access protected route without token

### Automated Testing

```javascript
// Example test với Jest
describe('SIWE Authentication', () => {
  it('should generate nonce', async () => {
    const response = await fetch('/api/auth/nonce');
    const { nonce } = await response.json();
    expect(nonce).toBeDefined();
  });

  it('should verify valid signature', async () => {
    const nonce = await requestNonce();
    const message = createSiweMessage(address, chainId, nonce);
    const signature = await signer.signMessage(message);
    
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ message, signature })
    });
    
    const { token } = await response.json();
    expect(token).toBeDefined();
  });
});
```

---

## 🚀 Production Checklist

### Backend

- [ ] Use HTTPS
- [ ] Strong JWT secret (environment variable)
- [ ] Redis for nonce storage
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling (don't expose sensitive info)
- [ ] Logging and monitoring
- [ ] CORS properly configured
- [ ] Token refresh mechanism
- [ ] Graceful shutdown

### Frontend

- [ ] HTTPS
- [ ] Secure token storage
- [ ] Handle token expiration
- [ ] Error handling
- [ ] Loading states
- [ ] User feedback
- [ ] Auto sign-out on account/network change
- [ ] Environment variables for API URL

### Security

- [ ] Penetration testing
- [ ] Security audit
- [ ] Rate limiting
- [ ] DDoS protection
- [ ] Regular security updates
- [ ] Monitor for suspicious activity

---

## 📚 Resources

- [EIP-4361: Sign-In With Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [SIWE Library](https://github.com/spruceid/siwe)
- [Sign-In With Ethereum Website](https://login.xyz/)
- [JWT Best Practices](https://jwt.io/introduction)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

---

**Happy Building!** 🚀

_Tài liệu được biên soạn bởi Kaopiz Team - © 2025_

