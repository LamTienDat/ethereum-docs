# ⚡ Quick Start - SIWE Demo

Hướng dẫn nhanh để chạy demo SIWE trong 5 phút!

## 🚀 Bước 1: Cài đặt (2 phút)

### Backend

```bash
cd backend
npm install
echo 'PORT=3001
JWT_SECRET=demo_secret_key_123456
FRONTEND_URL=http://localhost:5173' > .env
```

### Frontend

```bash
cd ../frontend
npm install
echo 'VITE_API_URL=http://localhost:3001' > .env
```

## ▶️ Bước 2: Chạy (1 phút)

### Terminal 1 - Backend

```bash
cd backend
npm run dev
```

Đợi thấy: `✅ Server ready!`

### Terminal 2 - Frontend

```bash
cd frontend
npm run dev
```

Đợi thấy: `➜  Local:   http://localhost:5173/`

## 🎮 Bước 3: Test (2 phút)

### 1. Mở browser

Truy cập: **http://localhost:5173**

### 2. Kết nối MetaMask

- Click "Kết nối MetaMask"
- Approve trong MetaMask popup
- Xem thông tin wallet hiển thị

### 3. Sign-In với SIWE

- Scroll xuống phần "SIWE Authentication"
- Click "Sign-In với Ethereum"
- Ký message trong MetaMask
- Xem session info

### 4. Test Protected Route

- Click "Tải Profile"
- Xem profile data từ backend

### 5. Sign Out

- Click "Sign Out"
- Session cleared

## 🎯 Standalone Examples

Không cần backend, chỉ cần mở file HTML:

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

# Bài 5: SIWE Simple (client-only)
open 05-siwe-simple.html
```

## 📚 Tài liệu chi tiết

- [README.md](./README.md) - Tổng quan
- [SETUP.md](./SETUP.md) - Setup chi tiết & troubleshooting
- [SIWE_GUIDE.md](./SIWE_GUIDE.md) - SIWE implementation guide
- [SUMMARY.md](./SUMMARY.md) - Tổng kết kiến thức

## 🆘 Gặp vấn đề?

### Backend không chạy?

```bash
# Kiểm tra port 3001 có bị chiếm không
lsof -i :3001

# Hoặc đổi port trong .env
PORT=3002
```

### Frontend không connect được backend?

```bash
# Kiểm tra backend đang chạy
curl http://localhost:3001/health

# Kiểm tra .env
cat frontend/.env
# Phải có: VITE_API_URL=http://localhost:3001
```

### MetaMask không hiện?

- Cài đặt MetaMask: https://metamask.io/download/
- Refresh page sau khi cài

## ✅ Checklist

- [ ] Node.js >= 18 installed
- [ ] MetaMask installed
- [ ] Backend running (port 3001)
- [ ] Frontend running (port 5173)
- [ ] Can connect MetaMask
- [ ] Can sign-in with SIWE
- [ ] Can access protected routes

---

**Xong rồi!** 🎉 Giờ bạn có thể explore code và học cách implement SIWE!

Đọc [SIWE_GUIDE.md](./SIWE_GUIDE.md) để hiểu chi tiết implementation.

