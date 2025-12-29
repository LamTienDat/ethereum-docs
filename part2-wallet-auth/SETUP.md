# 🚀 Hướng dẫn Setup và Chạy Project

## 📋 Yêu cầu

- Node.js >= 18.0.0
- npm hoặc yarn
- MetaMask extension
- Git

## 🔧 Cài đặt

### 1. Clone hoặc navigate đến thư mục project

```bash
cd part2-wallet-auth
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env`:

```bash
# Tạo file .env từ template
cp .env.example .env
```

Hoặc tạo file `.env` với nội dung:

```env
PORT=3001
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_123456
FRONTEND_URL=http://localhost:5173
```

⚠️ **Quan trọng**: Trong production, PHẢI thay đổi `JWT_SECRET` thành một chuỗi ngẫu nhiên phức tạp!

### 3. Cài đặt Frontend

```bash
cd ../frontend
npm install
```

Tạo file `.env`:

```bash
# Tạo file .env từ template
cp .env.example .env
```

Hoặc tạo file `.env` với nội dung:

```env
VITE_API_URL=http://localhost:3001
```

## ▶️ Chạy Project

### Chạy Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Output mong đợi:

```
🚀 Server started
📍 Port: 3001
🌐 Frontend URL: http://localhost:5173
🔐 JWT Secret: your_super...

📋 Available endpoints:
   GET  /health
   GET  /api/auth/nonce
   POST /api/auth/verify
   GET  /api/auth/me (protected)
   POST /api/auth/logout (protected)
   GET  /api/profile (protected)

✅ Server ready!
```

### Chạy Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Output mong đợi:

```
  VITE v5.0.8  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Truy cập ứng dụng

Mở browser và truy cập: **http://localhost:5173**

## 📝 Các bài thực hành

### Bài 1-5: Standalone HTML Examples

Mở trực tiếp các file HTML trong browser:

```bash
cd examples

# Bài 1: Kết nối MetaMask
open 01-connect-metamask.html

# Bài 2: Provider vs Signer
open 02-provider-signer.html

# Bài 3: Sign Message
open 03-sign-message.html

# Bài 4: Network Switch
open 04-network-switch.html

# Bài 5: SIWE Simple
open 05-siwe-simple.html
```

### Bài 6: Full-stack SIWE App

Đã chạy ở trên với frontend + backend.

## 🧪 Test SIWE Flow

### 1. Kết nối MetaMask

- Click "Kết nối MetaMask"
- Approve connection trong MetaMask popup
- Xem thông tin wallet hiển thị

### 2. Sign-In với SIWE

- Scroll xuống phần "SIWE Authentication"
- Click "Sign-In với Ethereum"
- Ký message trong MetaMask popup
- Xem session info hiển thị

### 3. Test Protected Route

- Click "Tải Profile" để test protected route
- Xem profile data trả về từ backend

### 4. Sign Out

- Click "Sign Out"
- Session sẽ bị clear
- Token bị xóa khỏi localStorage

## 🔍 Kiểm tra trong DevTools

### Console Logs

Mở DevTools Console (F12) để xem logs chi tiết:

```
✅ MetaMask detected
🔄 Connecting to MetaMask...
✅ Connected: 0x742d35...
🌐 Chain ID: 11155111
🔐 Starting SIWE authentication...
📝 Step 1: Requesting nonce...
✅ Nonce received: 0x1234...
📝 Step 2: Creating SIWE message...
✅ Message created
📝 Step 3: Signing message...
✅ Message signed
📝 Step 4: Verifying with backend...
✅ Verification successful
🎉 Sign-In completed!
```

### Network Tab

Kiểm tra API calls:

1. **GET /api/auth/nonce**
   - Response: `{ nonce: "0x..." }`

2. **POST /api/auth/verify**
   - Request: `{ message: "...", signature: "0x..." }`
   - Response: `{ token: "eyJ...", address: "0x..." }`

3. **GET /api/auth/me** (với Bearer token)
   - Response: `{ address: "0x...", chainId: 11155111, ... }`

### Application Tab

Kiểm tra localStorage:

- Key: `siwe_token`
- Value: JWT token (eyJ...)

## ⚠️ Troubleshooting

### Lỗi: "MetaMask is not installed"

**Giải pháp:**
- Cài đặt MetaMask extension: https://metamask.io/download/
- Refresh page sau khi cài

### Lỗi: "User rejected the request"

**Giải pháp:**
- User đã click "Cancel" trên MetaMask
- Thử lại và click "Confirm"

### Lỗi: "Network error" / "Failed to fetch"

**Giải pháp:**
- Kiểm tra backend đang chạy: `http://localhost:3001/health`
- Kiểm tra CORS settings trong backend
- Kiểm tra `VITE_API_URL` trong frontend `.env`

### Lỗi: "Invalid or expired nonce"

**Giải pháp:**
- Nonce chỉ dùng được 1 lần
- Request nonce mới và thử lại
- Nonce tự động expire sau 5 phút

### Lỗi: "Invalid or expired token"

**Giải pháp:**
- Token expire sau 24 giờ
- Sign out và sign in lại
- Kiểm tra JWT_SECRET giống nhau giữa các lần restart server

### Frontend không connect được Backend

**Giải pháp:**

1. Kiểm tra backend đang chạy:
```bash
curl http://localhost:3001/health
```

2. Kiểm tra CORS:
```bash
# Trong backend/src/server.js
cors({
  origin: 'http://localhost:5173',  // Phải match với frontend URL
  credentials: true
})
```

3. Kiểm tra `.env` files:
```bash
# Backend .env
FRONTEND_URL=http://localhost:5173

# Frontend .env
VITE_API_URL=http://localhost:3001
```

## 📊 API Endpoints

### Public Endpoints

#### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

#### GET /api/auth/nonce
Generate nonce cho SIWE

**Response:**
```json
{
  "nonce": "0x1234567890abcdef",
  "message": "Nonce generated successfully"
}
```

#### POST /api/auth/verify
Verify SIWE message và signature

**Request:**
```json
{
  "message": "example.com wants you to sign in...",
  "signature": "0xabcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Authentication successful"
}
```

### Protected Endpoints

Cần gửi JWT token trong header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### GET /api/auth/me
Get current user info

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 11155111,
  "iat": 1704067200,
  "exp": 1704153600
}
```

#### POST /api/auth/logout
Logout user

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/profile
Example protected route

**Response:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chainId": 11155111,
  "username": "User 0x742d",
  "joinedAt": "2025-01-01T00:00:00.000Z",
  "level": 5,
  "points": 1250
}
```

## 🔐 Security Notes

### Development

✅ **OK cho development:**
- HTTP (không HTTPS)
- Simple JWT secret
- Nonce stored in memory
- CORS allow localhost

### Production

⚠️ **PHẢI có cho production:**

1. **HTTPS**: Bắt buộc phải dùng HTTPS
2. **Strong JWT Secret**: Dùng secret phức tạp, random
3. **Persistent Nonce Storage**: Dùng Redis thay vì memory
4. **Rate Limiting**: Giới hạn số requests
5. **CORS**: Chỉ allow specific domains
6. **Token Refresh**: Implement refresh token mechanism
7. **Environment Variables**: Không commit `.env` files
8. **Input Validation**: Validate tất cả inputs
9. **Error Handling**: Không expose sensitive info trong errors
10. **Logging**: Log security events

## 📚 Tài liệu tham khảo

- [SIWE Specification (EIP-4361)](https://eips.ethereum.org/EIPS/eip-4361)
- [MetaMask Docs](https://docs.metamask.io/)
- [Ethers.js v6 Docs](https://docs.ethers.org/v6/)
- [Sign-In With Ethereum](https://login.xyz/)
- [JWT Best Practices](https://jwt.io/introduction)

## 🆘 Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra logs trong Console (F12)
2. Kiểm tra Network tab trong DevTools
3. Kiểm tra backend logs trong terminal
4. Đọc phần Troubleshooting ở trên
5. Tham khảo tài liệu chính thức

---

**Happy Learning!** 🚀

_Tài liệu được biên soạn bởi Kaopiz Team - © 2025_

