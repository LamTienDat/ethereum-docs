# TÀI LIỆU ĐÀO TẠO: PHÁT TRIỂN HỆ THỐNG BLOCKCHAIN (ETHEREUM/EVM)

> **Mục tiêu**: Trang bị kiến thức nền tảng và kỹ năng tích hợp thực tế cho đội ngũ kỹ thuật.
>
> **Tech Stack**: Solidity (Smart Contract), Ethers.js (Client library), Node.js (Backend)

---

## 📖 Tài liệu tham khảo chính thức

- **Ethereum Official Docs**: https://ethereum.org/en/developers/docs/
- **Ethers.js Documentation**: https://docs.ethers.org/v6/
- **Solidity Documentation**: https://docs.soliditylang.org/
- **ERC20 Token Standard**: https://eips.ethereum.org/EIPS/eip-20
- **EIP-1193 (Provider API)**: https://eips.ethereum.org/EIPS/eip-1193
- **EIP-1559 (Gas Fee)**: https://eips.ethereum.org/EIPS/eip-1559
- **EIP-4361 (SIWE)**: https://eips.ethereum.org/EIPS/eip-4361
- **MetaMask Documentation**: https://docs.metamask.io/
- **OpenZeppelin Contracts**: https://docs.openzeppelin.com/contracts/

---

## 📚 Mục lục

1. [Phần 1: Chuyển tiền và Nghiệp vụ giao dịch (Transaction)](#phần-1-chuyển-tiền-và-nghiệp-vụ-giao-dịch-transaction)
2. [Phần 2: Ví, Ký và Xác thực (Client-side)](#phần-2-ví-ký-và-xác-thực-client-side)
3. [Phần 3: Xử lý sự kiện (Event)](#phần-3-xử-lý-sự-kiện-event)
4. [Phần 4: Tích hợp Off-chain (Backend Node.js)](#phần-4-tích-hợp-off-chain-backend-nodejs)
5. [Phần 5: Nhập môn Bảo mật và Kiểm toán](#phần-5-nhập-môn-bảo-mật-và-kiểm-toán)
6. [Phần 6: Bài tập tổng hợp](#phần-6-bài-tập-tổng-hợp)
7. [Phần 7: So sánh Ethereum vs Hyperledger Fabric](#phần-7-so-sánh-ethereum-vs-hyperledger-fabric)

---

## Phần 1: Chuyển tiền và Nghiệp vụ giao dịch (Transaction)

### 1.1. Cơ chế chuyển ETH vs ERC20

Trong hệ sinh thái Ethereum, có hai loại tài sản số hoạt động theo cơ chế hoàn toàn khác nhau:

#### 🔷 Native Token (ETH)

**ETH** là tiền tệ gốc (native currency) của mạng lưới Ethereum. Việc chuyển ETH được xử lý **trực tiếp ở cấp độ protocol** của blockchain.

**Đặc điểm:**

- Số dư ETH được lưu trữ trong **state của blockchain**, gắn liền với địa chỉ ví
- Không cần smart contract để quản lý
- Mọi giao dịch trên Ethereum đều phải trả phí gas bằng ETH
- Tốc độ xử lý nhanh hơn vì không cần thực thi code

**Ví dụ minh họa:**

```
Wallet A has 10 ETH, Wallet B has 5 ETH

A sends 1 ETH to B:
┌─────────────────────────────────────┐
│  Transaction recorded in block      │
│  - From: 0xAAA...                   │
│  - To: 0xBBB...                     │
│  - Value: 1 ETH                     │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│  Blockchain updates state:          │
│  - Wallet A: 10 - 1 = 9 ETH         │
│  - Wallet B: 5 + 1 = 6 ETH          │
└─────────────────────────────────────┘
```

**Code ví dụ (Ethers.js):**

```javascript
// Chuyển ETH từ ví của bạn sang ví khác
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"), // Chuyển 1 ETH
});

console.log("Transaction hash:", tx.hash);
await tx.wait(); // Chờ transaction được confirm
console.log("Transfer completed!");
```

#### 🔶 ERC20 Token

**ERC20** là một **chuẩn smart contract** để tạo ra các token tùy chỉnh. Thực chất, ERC20 token không phải là "tiền" theo nghĩa truyền thống, mà là **dữ liệu được quản lý bởi một smart contract**.

> 📖 **Tài liệu tham khảo**: [ERC20 Token Standard (EIP-20)](https://eips.ethereum.org/EIPS/eip-20)

**Đặc điểm:**

- Số dư của bạn không nằm trong ví, mà là một **dòng dữ liệu** trong contract
- Contract lưu trữ số dư trong một "bảng" (mapping) dạng: `địa chỉ ví → số lượng token`
- Mỗi lần chuyển token = gọi hàm `transfer()` của contract
- Cần trả gas bằng ETH để thực thi hàm contract

**Ví dụ minh họa:**

```
Smart Contract USDT at address: 0xdAC17F958D2ee523a2206206994597C13D831ec7

Inside the contract there's a "table" (mapping):
┌──────────────────────────┬──────────────┐
│  Wallet Address          │  USDT Balance│
├──────────────────────────┼──────────────┤
│  0xAAA...                │  1000        │
│  0xBBB...                │  500         │
│  0xCCC...                │  2500        │
└──────────────────────────┴──────────────┘

When A wants to send 100 USDT to B:
1. A calls function: contract.transfer(B, 100)
2. Contract checks: Does A have enough 100 USDT?
3. Contract updates table:
   - A: 1000 - 100 = 900
   - B: 500 + 100 = 600
4. Contract emits event: Transfer(A, B, 100)
```

**Code ví dụ Smart Contract ERC20 đơn giản:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleERC20 {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // Bảng lưu số dư của từng địa chỉ
    mapping(address => uint256) public balanceOf;

    // Bảng lưu quyền ủy thác (allowance)
    mapping(address => mapping(address => uint256)) public allowance;

    // Sự kiện khi có chuyển tiền
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply; // Gán toàn bộ token cho người deploy
    }

    // Hàm chuyển token
    function transfer(address _to, uint256 _value) public returns (bool success) {
        require(balanceOf[msg.sender] >= _value, "Insufficient balance");
        require(_to != address(0), "Invalid address");

        balanceOf[msg.sender] -= _value;
        balanceOf[_to] += _value;

        emit Transfer(msg.sender, _to, _value);
        return true;
    }
}
```

**Code ví dụ tương tác với ERC20 (Ethers.js):**

```javascript
// ABI của contract ERC20 (chỉ lấy các hàm cần thiết)
const ERC20_ABI = [
  // Trả về số dư của address.
  "function balanceOf(address owner) view returns (uint256)",
  // Chuyển số lượng token đến address.
  "function transfer(address to, uint256 amount) returns (bool)",
  // Cho phép spender lấy lượng token từ owner.
  "function approve(address spender, uint256 amount) returns (bool)",
  // Trả về số lượng token mà người spender có thể rút từ owner.
  "function allowance(address owner, address spender) view returns (uint256)",
];

// Địa chỉ contract USDT trên Ethereum Mainnet
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

// Kết nối với contract
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

// Kiểm tra số dư
const balance = await usdtContract.balanceOf(myAddress);
console.log("Balance:", ethers.formatUnits(balance, 6)); // USDT có 6 decimals

// Chuyển 100 USDT cho người khác
const tx = await usdtContract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6) // 100 USDT
);
await tx.wait();
console.log("Transfer completed!");
```

---

### 1.2. Bộ ba hàm quan trọng: transfer / transferFrom / approve

Đây là **3 hàm cốt lõi** của chuẩn ERC20, giúp quản lý việc chuyển token một cách linh hoạt và an toàn.

#### 🔹 Hàm `transfer(address to, uint256 amount)`

**Mục đích:** Chủ ví tự tay gửi token của mình cho người khác.

**Cách hoạt động:**

1. Người gọi hàm (`msg.sender`) muốn gửi token
2. Contract kiểm tra số dư của `msg.sender`
3. Nếu đủ, trừ tiền của `msg.sender` và cộng cho `to`
4. Phát sự kiện `Transfer`

**Ví dụ thực tế:**

- Bạn gửi 50 USDT cho bạn bè
- Bạn chuyển 100 DAI từ ví MetaMask sang ví Ledger của mình

**Code Solidity:**

```solidity
function transfer(address to, uint256 amount) public returns (bool) {
    require(balanceOf[msg.sender] >= amount, "Insufficient balance");
    require(to != address(0), "Cannot transfer to zero address");

    balanceOf[msg.sender] -= amount;
    balanceOf[to] += amount;

    emit Transfer(msg.sender, to, amount);
    return true;
}
```

**Code JavaScript (Ethers.js):**

```javascript
// Gửi 50 USDT cho bạn
const tx = await usdtContract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // Địa chỉ bạn
  ethers.parseUnits("50", 6) // 50 USDT
);
await tx.wait();
console.log("Đã gửi 50 USDT thành công!");
```

---

#### 🔹 Hàm `approve(address spender, uint256 amount)`

**Mục đích:** Cấp quyền cho một địa chỉ khác (có thể là người hoặc smart contract) được phép **tiêu tiền của bạn** trong giới hạn cho phép.

**Cách hoạt động:**

1. Bạn gọi `approve(spender, amount)`
2. Contract ghi nhận: "Địa chỉ `spender` được phép lấy tối đa `amount` token từ ví của bạn"
3. Thông tin này được lưu trong mapping `allowance[owner][spender]`

**Tại sao cần approve?**

- Các sàn DEX (Uniswap, PancakeSwap) cần quyền lấy token từ ví bạn để thực hiện giao dịch
- Các dApp (lending, staking) cần quyền để tự động rút token khi đến hạn

**Ví dụ thực tế:**

```
You want to swap 1000 USDT for ETH on Uniswap:

Step 1: Approve
- You call: USDT.approve(UniswapRouter, 1000)
- Meaning: "I allow Uniswap to take up to 1000 USDT from my wallet"

Step 2: Swap
- You call: UniswapRouter.swap(...)
- Uniswap automatically calls: USDT.transferFrom(you, Uniswap, 1000)
- Uniswap takes your 1000 USDT and sends you ETH
```

**Code Solidity:**

```solidity
function approve(address spender, uint256 amount) public returns (bool) {
    require(spender != address(0), "Cannot approve zero address");

    allowance[msg.sender][spender] = amount;

    emit Approval(msg.sender, spender, amount);
    return true;
}
```

**Code JavaScript (Ethers.js):**

```javascript
// Cho phép Uniswap Router lấy 1000 USDT từ ví bạn
const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const tx = await usdtContract.approve(
  UNISWAP_ROUTER,
  ethers.parseUnits("1000", 6) // Approve 1000 USDT
);
await tx.wait();
console.log("Đã approve thành công!");

// Kiểm tra allowance
const allowance = await usdtContract.allowance(myAddress, UNISWAP_ROUTER);
console.log("Allowance:", ethers.formatUnits(allowance, 6), "USDT");
```

**⚠️ Lưu ý bảo mật:**

- **Không nên approve số lượng quá lớn** (ví dụ: `2^256 - 1`) vì nếu contract bị hack, hacker có thể rút hết tiền của bạn
- Nên approve đúng số lượng cần dùng
- Sau khi dùng xong, nên gọi `approve(spender, 0)` để thu hồi quyền

---

#### 🔹 Hàm `transferFrom(address from, address to, uint256 amount)`

**Mục đích:** Cho phép một địa chỉ (đã được approve) **rút tiền từ ví người khác** và chuyển đi.

**Cách hoạt động:**

1. Người gọi hàm (`msg.sender`) muốn lấy token từ ví `from`
2. Contract kiểm tra: `from` đã approve cho `msg.sender` chưa?
3. Kiểm tra: Số lượng approve có đủ không?
4. Nếu hợp lệ: Trừ tiền của `from`, cộng cho `to`, giảm allowance

**Ví dụ thực tế:**

```
Scenario: You have approved Uniswap to take 1000 USDT

When you execute swap:
1. Uniswap calls: USDT.transferFrom(you, Uniswap, 1000)
2. USDT Contract checks:
   - Do you have enough 1000 USDT? ✓
   - Have you approved Uniswap >= 1000? ✓
3. Contract executes:
   - balanceOf[you] -= 1000
   - balanceOf[Uniswap] += 1000
   - allowance[you][Uniswap] -= 1000
4. Emits event Transfer(you, Uniswap, 1000)
```

**Code Solidity:**

```solidity
function transferFrom(address from, address to, uint256 amount) public returns (bool) {
    require(balanceOf[from] >= amount, "Insufficient balance");
    require(allowance[from][msg.sender] >= amount, "Allowance exceeded");
    require(to != address(0), "Cannot transfer to zero address");

    balanceOf[from] -= amount;
    balanceOf[to] += amount;
    allowance[from][msg.sender] -= amount;

    emit Transfer(from, to, amount);
    return true;
}
```

**Code JavaScript (Ethers.js) - Ví dụ Smart Contract DEX:**

```solidity
// Contract DEX của bạn sử dụng transferFrom để lấy token từ user
// File: DEX.sol (đơn giản hóa)

contract SimpleDEX {
    IERC20 public usdtToken;

    constructor(address _usdtAddress) {
        usdtToken = IERC20(_usdtAddress);
    }

    // User phải approve trước khi gọi hàm này
    function deposit(uint256 amount) external {
        // Lấy USDT từ ví user và chuyển vào contract này
        usdtToken.transferFrom(msg.sender, address(this), amount);

        // Logic xử lý tiếp (cập nhật số dư user trong DEX...)
    }
}
```

**Sơ đồ tổng hợp:**

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW                                 │
└─────────────────────────────────────────────────────────────┘

User A                    Smart Contract                 User B / DEX
  │                              │                              │
  │  1. approve(DEX, 1000)       │                              │
  │─────────────────────────────>│                              │
  │                              │  allowance[A][DEX] = 1000    │
  │                              │                              │
  │                              │  2. transferFrom(A, DEX, 1000)│
  │                              │<─────────────────────────────│
  │                              │                              │
  │                              │  Check:                      │
  │                              │  - balanceOf[A] >= 1000? ✓   │
  │                              │  - allowance[A][DEX] >= 1000?✓│
  │                              │                              │
  │                              │  Execute:                    │
  │                              │  - balanceOf[A] -= 1000      │
  │                              │  - balanceOf[DEX] += 1000    │
  │                              │  - allowance[A][DEX] -= 1000 │
  │                              │                              │
  │  ✓ Transfer successful       │                              │
  │<─────────────────────────────│                              │
```

#### 📝 Tóm tắt bộ ba hàm

| Hàm              | Ai gọi?            | Làm gì?                                   | Ví dụ thực tế                      |
| ---------------- | ------------------ | ----------------------------------------- | ---------------------------------- |
| **transfer**     | Chủ ví             | Tự tay gửi token cho người khác           | Gửi tiền cho bạn bè                |
| **approve**      | Chủ ví             | Cấp quyền cho địa chỉ khác được lấy token | Approve cho Uniswap để swap        |
| **transferFrom** | Người được approve | Lấy token từ ví người khác (đã approve)   | Uniswap tự động rút token khi swap |

---

### 1.3. Các khái niệm cốt lõi: Nonce, Gas, Confirmations

#### 🔢 Nonce (Number Only Used Once)

**Định nghĩa:** Nonce là **số thứ tự** của giao dịch từ một địa chỉ ví, bắt đầu từ 0 và tăng dần.

> 📖 **Tài liệu tham khảo**: [Ethereum Transactions - Nonce](https://ethereum.org/en/developers/docs/transactions/#nonce)

**Tại sao cần Nonce?**

1. **Chống tấn công Replay Attack:**

   - Nếu không có nonce, hacker có thể sao chép một giao dịch hợp lệ và phát lại nhiều lần
   - Ví dụ: Bạn gửi 1 ETH cho bạn bè. Nếu không có nonce, hacker có thể copy transaction đó và làm bạn mất thêm nhiều ETH

2. **Đảm bảo thứ tự thực hiện:**
   - Giao dịch nonce 0 phải xong thì nonce 1 mới được xử lý
   - Nếu nonce 1 đến trước nonce 0, nó sẽ bị pending cho đến khi nonce 0 hoàn thành

**Ví dụ minh họa:**

```
Wallet A sends 3 transactions:

Transaction 1: nonce = 0, send 1 ETH to B
Transaction 2: nonce = 1, send 2 ETH to C
Transaction 3: nonce = 2, send 3 ETH to D

If Transaction 1 is stuck (low gas):
→ Transaction 2 and 3 will be pending, cannot execute
→ Must wait for Transaction 1 to complete or be cancelled

If you want to "skip" Transaction 1:
→ Resend Transaction with nonce = 0 but higher gas
→ Old transaction will be replaced
```

**Code ví dụ (Ethers.js):**

```javascript
// Lấy nonce hiện tại của ví
const nonce = await provider.getTransactionCount(myAddress);
console.log("Current nonce:", nonce);

// Gửi transaction với nonce cụ thể
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  nonce: nonce, // Chỉ định nonce
});

// Gửi nhiều transaction song song (nonce tăng dần)
const tx1 = await signer.sendTransaction({
  to: addressB,
  value: ethers.parseEther("1.0"),
  nonce: nonce,
});

const tx2 = await signer.sendTransaction({
  to: addressC,
  value: ethers.parseEther("2.0"),
  nonce: nonce + 1, // Phải tăng thủ công
});

const tx3 = await signer.sendTransaction({
  to: addressD,
  value: ethers.parseEther("3.0"),
  nonce: nonce + 2,
});
```

**⚠️ Lỗi thường gặp:**

```javascript
// ❌ SAI: Gửi 2 transaction cùng lúc mà không chỉ định nonce
const tx1 = await signer.sendTransaction({
  to: addressB,
  value: ethers.parseEther("1.0"),
});
const tx2 = await signer.sendTransaction({
  to: addressC,
  value: ethers.parseEther("2.0"),
});
// → Cả 2 transaction sẽ có cùng nonce → Transaction sau sẽ thay thế transaction trước

// ✅ ĐÚNG: Chỉ định nonce rõ ràng
const nonce = await provider.getTransactionCount(myAddress);
const tx1 = await signer.sendTransaction({
  to: addressB,
  value: ethers.parseEther("1.0"),
  nonce,
});
const tx2 = await signer.sendTransaction({
  to: addressC,
  value: ethers.parseEther("2.0"),
  nonce: nonce + 1,
});
```

---

#### ⛽ Gas (Phí giao dịch)

**Định nghĩa:** Gas là **đơn vị đo lường công việc** mà mạng lưới Ethereum phải thực hiện để xử lý giao dịch của bạn.

> 📖 **Tài liệu tham khảo**:
>
> - [Gas and Fees](https://ethereum.org/en/developers/docs/gas/)
> - [EIP-1559: Fee Market](https://eips.ethereum.org/EIPS/eip-1559)

**Công thức tính phí:**

```
Transaction Fee = Gas Used × Gas Price

Where:
- Gas Used: Actual gas consumed (depends on transaction complexity)
- Gas Price: Price you're willing to pay per gas unit (unit: Gwei)

1 Gwei = 0.000000001 ETH = 10^-9 ETH
```

**Ví dụ cụ thể:**

```
ETH Transfer Transaction:
- Gas Used: 21,000 gas (fixed)
- Gas Price: 50 Gwei

Transaction Fee = 21,000 × 50 = 1,050,000 Gwei
                = 0.00105 ETH
                ≈ $2.1 (if ETH = $2000)

ERC20 Token Transfer Transaction:
- Gas Used: 65,000 gas (more complex)
- Gas Price: 50 Gwei

Transaction Fee = 65,000 × 50 = 3,250,000 Gwei
                = 0.00325 ETH
                ≈ $6.5
```

**Các loại Gas:**

1. **Gas Limit:** Số gas tối đa bạn sẵn sàng trả

   - Nếu đặt quá thấp → Transaction fail nhưng vẫn mất phí
   - Nếu đặt quá cao → Chỉ mất đúng số gas thực tế dùng

2. **Gas Price:** Giá bạn trả cho mỗi đơn vị gas

   - Cao → Transaction được xử lý nhanh (ưu tiên)
   - Thấp → Transaction chậm hoặc bị stuck

3. **Base Fee + Priority Fee (EIP-1559):**

   - **Base Fee:** Phí cơ bản, tự động điều chỉnh theo tải mạng (bị đốt - burn)
   - **Priority Fee (Tip):** Tiền tip cho miner/validator để ưu tiên transaction

   > 📖 **Đọc thêm**: [Understanding EIP-1559](https://ethereum.org/en/developers/docs/gas/#eip-1559)

**Code ví dụ (Ethers.js):**

```javascript
// Lấy gas price hiện tại
const feeData = await provider.getFeeData();
console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");

// Gửi transaction với gas price tùy chỉnh
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  gasLimit: 21000, // Giới hạn gas
  gasPrice: ethers.parseUnits("50", "gwei"), // 50 Gwei
});

// Sử dụng EIP-1559 (maxFeePerGas + maxPriorityFeePerGas)
const tx2 = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  maxFeePerGas: ethers.parseUnits("100", "gwei"), // Tối đa 100 Gwei
  maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"), // Tip 2 Gwei
});

// Ước tính gas cho một transaction
const estimatedGas = await signer.estimateGas({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
});
console.log("Estimated Gas:", estimatedGas.toString());

// Ước tính gas cho việc gọi hàm contract
const estimatedGasForTransfer = await usdtContract.transfer.estimateGas(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
);
console.log(
  "Estimated Gas for ERC20 transfer:",
  estimatedGasForTransfer.toString()
);
```

#### 🤖 Xử lý Gas tự động (Không chỉ định Gas Limit và Gas Price)

Trong hầu hết các trường hợp, **bạn không cần chỉ định gas limit và gas price thủ công**. Ethers.js (và các thư viện khác) sẽ tự động xử lý cho bạn.

> 📖 **Tài liệu tham khảo**: [Ethers.js - Gas Price](https://docs.ethers.org/v6/api/providers/#Provider-getFeeData)

**Cơ chế hoạt động:**

```javascript
// ✅ Cách đơn giản nhất - Để thư viện tự động xử lý
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  // Không cần chỉ định gasLimit, gasPrice, maxFeePerGas...
});

// Ethers.js sẽ tự động:
// 1. Gọi eth_estimateGas để tính gas limit
// 2. Gọi eth_gasPrice hoặc eth_feeHistory để lấy gas price phù hợp
// 3. Thêm buffer ~20% cho gas limit để đảm bảo transaction không fail
```

**Quy trình tự động:**

```
┌─────────────────────────────────────────────────────────────┐
│         ETHERS.JS AUTOMATIC GAS HANDLING PROCESS            │
└─────────────────────────────────────────────────────────────┘

Step 1: Estimate Gas Limit
├─ Ethers.js calls: provider.estimateGas(transaction)
├─ RPC node simulates transaction execution
├─ Returns: Required gas (e.g.: 21,000)
└─ Ethers.js adds buffer: 21,000 × 1.2 = 25,200

Step 2: Get Gas Price
├─ For Legacy networks (before EIP-1559):
│  └─ Call: provider.getGasPrice()
│     └─ Returns: Current gas price (e.g.: 50 Gwei)
│
└─ For EIP-1559 networks (Ethereum, Polygon...):
   └─ Call: provider.getFeeData()
      ├─ maxFeePerGas: Base fee × 2 + Priority fee
      └─ maxPriorityFeePerGas: Usually 1-2 Gwei

Step 3: Send Transaction
└─ Transaction is sent with calculated gas parameters
```

**Ví dụ chi tiết:**

```javascript
// ============================================
// CÁCH 1: Để thư viện tự động xử lý (KHUYẾN NGHỊ)
// ============================================
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
});

console.log("Transaction sent:", tx.hash);
console.log("Gas Limit (auto):", tx.gasLimit.toString());
console.log(
  "Gas Price (auto):",
  ethers.formatUnits(tx.gasPrice || tx.maxFeePerGas, "gwei"),
  "Gwei"
);

// Output ví dụ:
// Gas Limit (auto): 25200 (21000 + 20% buffer)
// Gas Price (auto): 45.5 Gwei (tự động lấy từ mạng)

// ============================================
// CÁCH 2: Chỉ định một phần, phần còn lại tự động
// ============================================

// Chỉ định gas price, để gas limit tự động
const tx2 = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  gasPrice: ethers.parseUnits("100", "gwei"), // Chỉ định gas price cao để ưu tiên
  // gasLimit sẽ được tự động ước tính
});

// Chỉ định gas limit, để gas price tự động
const tx3 = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  gasLimit: 30000, // Chỉ định gas limit cụ thể
  // gasPrice sẽ được tự động lấy từ mạng
});

// ============================================
// CÁCH 3: Xem trước gas sẽ được sử dụng
// ============================================
const txRequest = {
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
};

// Ước tính gas limit
const estimatedGas = await signer.estimateGas(txRequest);
console.log("Estimated Gas:", estimatedGas.toString());

// Lấy fee data hiện tại
const feeData = await provider.getFeeData();
console.log(
  "Current Gas Price:",
  ethers.formatUnits(feeData.gasPrice, "gwei"),
  "Gwei"
);
console.log(
  "Max Fee Per Gas:",
  ethers.formatUnits(feeData.maxFeePerGas, "gwei"),
  "Gwei"
);
console.log(
  "Max Priority Fee:",
  ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei"),
  "Gwei"
);

// Tính toán chi phí dự kiến
const estimatedCost = estimatedGas * feeData.gasPrice;
console.log("Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");

// Sau đó gửi transaction (vẫn để tự động)
const tx4 = await signer.sendTransaction(txRequest);
```

**Khi nào nên chỉ định gas thủ công?**

| Tình huống               | Giải pháp                                  | Lý do                                                |
| ------------------------ | ------------------------------------------ | ---------------------------------------------------- |
| **Transaction bị stuck** | Tăng `gasPrice` hoặc `maxFeePerGas`        | Ưu tiên transaction để xử lý nhanh hơn               |
| **Gas estimation sai**   | Chỉ định `gasLimit` cao hơn                | Một số contract phức tạp, estimation không chính xác |
| **Muốn tiết kiệm phí**   | Giảm `maxPriorityFeePerGas` xuống 0-1 Gwei | Chấp nhận chờ lâu hơn để tiết kiệm tiền              |
| **Mạng quá tải**         | Tăng `maxFeePerGas` lên 2-3x               | Đảm bảo transaction được xử lý                       |
| **Backend tự động**      | Chỉ định cố định `gasLimit`                | Tránh estimation mỗi lần (tốn thời gian)             |

**Ví dụ xử lý lỗi khi gas estimation thất bại:**

```javascript
async function sendTransactionWithFallback(signer, txRequest) {
  try {
    // Thử gửi với gas tự động
    const tx = await signer.sendTransaction(txRequest);
    console.log("✓ Transaction sent with auto gas:", tx.hash);
    return tx;
  } catch (error) {
    if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      console.log("⚠ Gas estimation failed, using manual gas limit...");

      // Fallback: Chỉ định gas limit thủ công
      const tx = await signer.sendTransaction({
        ...txRequest,
        gasLimit: 500000, // Đặt gas limit cao để đảm bảo
      });

      console.log("✓ Transaction sent with manual gas:", tx.hash);
      return tx;
    }

    throw error; // Ném lỗi khác lên trên
  }
}

// Sử dụng
const tx = await sendTransactionWithFallback(signer, {
  to: contractAddress,
  data: contractInterface.encodeFunctionData("complexFunction", [
    param1,
    param2,
  ]),
});
```

**Best Practices:**

1. **Môi trường Development/Testing:**

   ```javascript
   // Để tự động hoàn toàn - Dễ debug
   const tx = await signer.sendTransaction({ to, value });
   ```

2. **Môi trường Production (Frontend):**

   ```javascript
   // Hiển thị ước tính cho user trước khi gửi
   const estimatedGas = await signer.estimateGas({ to, value });
   const feeData = await provider.getFeeData();
   const estimatedCost = estimatedGas * feeData.gasPrice;

   // Hiển thị: "Estimated fee: 0.0015 ETH"
   // User xác nhận -> Gửi transaction (vẫn để tự động)
   const tx = await signer.sendTransaction({ to, value });
   ```

3. **Môi trường Production (Backend):**

   ```javascript
   // Chỉ định gas price cao hơn để đảm bảo xử lý nhanh
   const feeData = await provider.getFeeData();

   const tx = await signer.sendTransaction({
     to,
     value,
     maxFeePerGas: (feeData.maxFeePerGas * 120n) / 100n, // Tăng 20%
     maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"), // Tip cố định
   });
   ```

**Xử lý với Smart Contract:**

```javascript
// Gọi hàm contract - Gas tự động
const tx = await contract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
  // Không cần chỉ định gas
);

// Nếu muốn override gas
const tx2 = await contract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6),
  {
    gasLimit: 100000, // Override gas limit
    maxFeePerGas: ethers.parseUnits("100", "gwei"), // Override max fee
  }
);

// Ước tính gas trước khi gọi
const estimatedGas = await contract.transfer.estimateGas(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
);
console.log("Estimated gas for transfer:", estimatedGas.toString());
```

**📊 Bảng tham khảo Gas Used:**

| Loại giao dịch        | Gas Used (trung bình) |
| --------------------- | --------------------- |
| Chuyển ETH            | 21,000                |
| Chuyển ERC20 Token    | 50,000 - 80,000       |
| Approve ERC20         | 45,000 - 50,000       |
| Swap trên Uniswap     | 150,000 - 200,000     |
| Mint NFT              | 80,000 - 150,000      |
| Deploy Smart Contract | 500,000 - 2,000,000+  |

---

#### ✅ Confirmations (Số xác nhận)

**Định nghĩa:** Confirmations là **số lượng block được sinh ra sau block chứa giao dịch của bạn**.

> 📖 **Tài liệu tham khảo**: [Transaction Finality](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#finality)

**Tại sao cần Confirmations?**

Blockchain có thể bị **Re-org (Reorganization)** - tức là chuỗi block bị "đảo chiều" do có chuỗi dài hơn xuất hiện. Điều này có thể khiến giao dịch của bạn bị hủy bỏ.

**Ví dụ minh họa:**

```
Scenario: You send 10 ETH to an exchange to buy Bitcoin

Block 1000: Your transaction is included
           (0 confirmations - VERY RISKY)

Block 1001: New block is created
           (1 confirmation - STILL RISKY)

Block 1002: New block is created
           (2 confirmations)

...

Block 1012: New block is created
           (12 confirmations - SAFE)

If block 1000 gets re-org with only 1-2 confirmations:
→ Your transaction may disappear
→ Exchange already credited your account
→ You lose money!

If you wait for 12 confirmations:
→ Re-org probability ≈ 0
→ Absolutely safe
```

**Code ví dụ (Ethers.js):**

```javascript
// Gửi transaction
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("10.0"),
});

console.log("Transaction hash:", tx.hash);
console.log("Transaction sent! Waiting for confirmations...");

// Chờ 1 confirmation (mặc định)
const receipt = await tx.wait();
console.log("Transaction confirmed in block:", receipt.blockNumber);

// Chờ 12 confirmations (an toàn hơn)
const receipt12 = await tx.wait(12);
console.log("Transaction confirmed with 12 blocks!");

// Theo dõi số confirmations theo thời gian thực
async function waitForConfirmations(txHash, requiredConfirmations) {
  console.log(`Waiting for ${requiredConfirmations} confirmations...`);

  while (true) {
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt) {
      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      console.log(`Confirmations: ${confirmations}/${requiredConfirmations}`);

      if (confirmations >= requiredConfirmations) {
        console.log("✓ Transaction fully confirmed!");
        return receipt;
      }
    }

    // Chờ 3 giây rồi kiểm tra lại
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

// Sử dụng
await waitForConfirmations(tx.hash, 12);
```

**Backend Best Practice (Node.js):**

```javascript
// File: transactionMonitor.js
const { ethers } = require("ethers");

class TransactionMonitor {
  constructor(provider, requiredConfirmations = 12) {
    this.provider = provider;
    this.requiredConfirmations = requiredConfirmations;
  }

  async monitorDeposit(txHash, userId, amount) {
    console.log(`[User ${userId}] Monitoring deposit: ${txHash}`);

    try {
      // Chờ transaction được mine
      const receipt = await this.provider.waitForTransaction(txHash);

      if (receipt.status === 0) {
        console.log(`[User ${userId}] ❌ Transaction failed!`);
        await this.updateDatabase(userId, txHash, "FAILED");
        return false;
      }

      console.log(
        `[User ${userId}] Transaction mined in block ${receipt.blockNumber}`
      );

      // Chờ đủ confirmations
      await this.waitForConfirmations(txHash, this.requiredConfirmations);

      console.log(`[User ${userId}] ✓ Deposit confirmed! Updating balance...`);

      // Cập nhật database
      await this.updateDatabase(userId, txHash, "CONFIRMED", amount);

      // Gửi email thông báo
      await this.sendNotification(userId, amount);

      return true;
    } catch (error) {
      console.error(`[User ${userId}] Error monitoring transaction:`, error);
      await this.updateDatabase(userId, txHash, "ERROR");
      return false;
    }
  }

  async waitForConfirmations(txHash, required) {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    const targetBlock = receipt.blockNumber + required - 1;

    while (true) {
      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber + 1;

      console.log(`Confirmations: ${confirmations}/${required}`);

      if (currentBlock >= targetBlock) {
        return true;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  async updateDatabase(userId, txHash, status, amount = null) {
    // Giả lập cập nhật database
    console.log(`Updating DB: User ${userId}, TX ${txHash}, Status ${status}`);
    // await db.query("UPDATE deposits SET status = ? WHERE tx_hash = ?", [status, txHash]);
  }

  async sendNotification(userId, amount) {
    console.log(
      `Sending notification to user ${userId}: Deposit ${amount} ETH confirmed`
    );
    // await emailService.send(userId, "Deposit Confirmed", ...);
  }
}

// Sử dụng
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const monitor = new TransactionMonitor(provider, 12);

// Khi user gửi tiền vào sàn
app.post("/api/deposit/notify", async (req, res) => {
  const { userId, txHash, amount } = req.body;

  // Chạy monitor trong background
  monitor.monitorDeposit(txHash, userId, amount);

  res.json({ message: "Deposit is being monitored" });
});
```

---

### 📝 Tổng kết Phần 1

**Những điều quan trọng cần nhớ:**

1. **ETH vs ERC20:**

   - ETH = Native token, chuyển nhanh, phí thấp
   - ERC20 = Smart contract, chuyển chậm, phí cao hơn

2. **Bộ ba hàm ERC20:**

   - `transfer()`: Tự gửi tiền
   - `approve()`: Cấp quyền
   - `transferFrom()`: Người được cấp quyền rút tiền

3. **Nonce:**

   - Số thứ tự giao dịch
   - Phải tuần tự: 0 → 1 → 2 → ...
   - Chống replay attack

4. **Gas:**

   - Phí = Gas Used × Gas Price
   - Chuyển ETH: ~21,000 gas
   - Chuyển ERC20: ~50,000-80,000 gas

5. **Confirmations:**

   - Chờ 12+ confirmations cho giao dịch quan trọng
   - Tránh re-org attack
   - Backend phải monitor confirmations trước khi cập nhật database

6. **Gas tự động:**
   - Ethers.js tự động ước tính gas limit và gas price
   - Chỉ cần chỉ định thủ công khi cần thiết (transaction stuck, gas estimation sai...)
   - Best practice: Để tự động trong development, chỉ định thủ công trong production khi cần ưu tiên

---

## Phần 2: Ví, Ký và Xác thực (Client-side)

### 2.1. Kết nối MetaMask (EIP-1193)

**MetaMask** là ví Ethereum phổ biến nhất, hoạt động như một **extension trình duyệt**. Nó đóng vai trò là **cầu nối** giữa website của bạn và blockchain thông qua object `window.ethereum`.

> 📖 **Tài liệu tham khảo**:
>
> - [MetaMask Documentation](https://docs.metamask.io/)
> - [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)

#### 🔌 EIP-1193: Ethereum Provider JavaScript API

**EIP-1193** là chuẩn giao tiếp giữa dApp và ví. MetaMask inject một object `window.ethereum` vào trang web, cho phép bạn:

- Yêu cầu kết nối ví
- Gửi transaction
- Ký message
- Đọc dữ liệu blockchain

**Kiểm tra MetaMask có được cài đặt không:**

```javascript
// Cách 1: Kiểm tra đơn giản
if (typeof window.ethereum !== "undefined") {
  console.log("✓ MetaMask is installed!");
} else {
  console.log("❌ MetaMask is NOT installed");
  alert("Please install MetaMask!");
}

// Cách 2: Kiểm tra chi tiết hơn
function checkMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    // Kiểm tra có phải MetaMask không (có thể là ví khác)
    if (window.ethereum.isMetaMask) {
      console.log("✓ MetaMask detected");
      return true;
    } else {
      console.log("⚠ Another wallet detected:", window.ethereum);
      return true; // Vẫn có thể dùng được
    }
  } else {
    console.log("❌ No Ethereum wallet detected");
    return false;
  }
}

// Cách 3: Kiểm tra nhiều ví (MetaMask, Coinbase Wallet, Trust Wallet...)
function detectWallets() {
  const wallets = [];

  if (window.ethereum) {
    if (window.ethereum.isMetaMask) wallets.push("MetaMask");
    if (window.ethereum.isCoinbaseWallet) wallets.push("Coinbase Wallet");
    if (window.ethereum.isTrust) wallets.push("Trust Wallet");
  }

  if (wallets.length === 0) {
    console.log("❌ No wallet detected");
  } else {
    console.log("✓ Detected wallets:", wallets.join(", "));
  }

  return wallets;
}
```

#### 🔗 Kết nối ví (Request Accounts)

**Quy trình kết nối:**

```
User clicks "Connect Wallet"
         ↓
Website calls: ethereum.request({ method: 'eth_requestAccounts' })
         ↓
MetaMask displays popup asking user confirmation
         ↓
User clicks "Connect" on MetaMask
         ↓
MetaMask returns wallet address list: ['0xABC...']
         ↓
Website saves address and displays "Connected" UI
```

**Code ví dụ cơ bản:**

```javascript
// Hàm kết nối ví đơn giản
async function connectWallet() {
  try {
    // Kiểm tra MetaMask
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!");
      window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    // Yêu cầu kết nối
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const userAddress = accounts[0];
    console.log("✓ Connected:", userAddress);

    return userAddress;
  } catch (error) {
    if (error.code === 4001) {
      // User rejected the request
      console.log("❌ User rejected connection");
      alert("You rejected the connection request");
    } else {
      console.error("Error connecting:", error);
      alert("Failed to connect wallet");
    }
    return null;
  }
}

// Sử dụng
const address = await connectWallet();
if (address) {
  document.getElementById("wallet-address").innerText = address;
}
```

**Code ví dụ nâng cao (với Ethers.js):**

```javascript
import { ethers } from "ethers";

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
  }

  // Kết nối ví
  async connect() {
    try {
      // Kiểm tra MetaMask
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      // Tạo provider từ window.ethereum
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // Yêu cầu kết nối
      await this.provider.send("eth_requestAccounts", []);

      // Lấy signer (để gửi transaction)
      this.signer = await this.provider.getSigner();

      // Lấy địa chỉ ví
      this.address = await this.signer.getAddress();

      // Lấy chain ID (1 = Ethereum Mainnet, 56 = BSC, 137 = Polygon...)
      const network = await this.provider.getNetwork();
      this.chainId = Number(network.chainId);

      console.log("✓ Connected:", this.address);
      console.log("✓ Chain ID:", this.chainId);

      return {
        address: this.address,
        chainId: this.chainId,
      };
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  }

  // Ngắt kết nối (chỉ ở phía UI, không thực sự disconnect khỏi MetaMask)
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    console.log("✓ Disconnected");
  }

  // Kiểm tra đã kết nối chưa
  isConnected() {
    return this.address !== null;
  }

  // Lấy số dư ETH
  async getBalance() {
    if (!this.address) throw new Error("Not connected");

    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  // Chuyển ETH
  async sendETH(to, amount) {
    if (!this.signer) throw new Error("Not connected");

    const tx = await this.signer.sendTransaction({
      to: to,
      value: ethers.parseEther(amount),
    });

    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    return receipt;
  }
}

// Sử dụng
const wallet = new WalletManager();

// Kết nối
const connectButton = document.getElementById("connect-btn");
connectButton.addEventListener("click", async () => {
  try {
    const { address, chainId } = await wallet.connect();
    document.getElementById("address").innerText = address;
    document.getElementById("chain-id").innerText = chainId;
    connectButton.innerText = "Connected";
  } catch (error) {
    alert("Failed to connect: " + error.message);
  }
});

// Hiển thị số dư
const balanceButton = document.getElementById("balance-btn");
balanceButton.addEventListener("click", async () => {
  try {
    const balance = await wallet.getBalance();
    document.getElementById("balance").innerText = balance + " ETH";
  } catch (error) {
    alert("Failed to get balance: " + error.message);
  }
});
```

#### 🔄 Lắng nghe sự kiện thay đổi

MetaMask có thể thay đổi trong quá trình sử dụng:

- User chuyển sang tài khoản khác
- User chuyển sang mạng khác (Ethereum → BSC)
- User ngắt kết nối

**Code lắng nghe sự kiện:**

```javascript
// ⚠️ QUAN TRỌNG: Lưu reference đến handler functions để có thể remove sau này
// Nếu không lưu reference, sẽ không thể remove listener cụ thể

// Handler cho accountsChanged
const handleAccountsChanged = (accounts) => {
  if (accounts.length === 0) {
    // User disconnected
    console.log("❌ User disconnected");
    wallet.disconnect();
    document.getElementById("address").innerText = "Not connected";
  } else {
    // User switched account
    const newAddress = accounts[0];
    console.log("🔄 Account changed:", newAddress);
    wallet.address = newAddress;
    document.getElementById("address").innerText = newAddress;

    // Reload lại dữ liệu
    loadUserData(newAddress);
  }
};

// Handler cho chainChanged
const handleChainChanged = (chainIdHex) => {
  const chainId = parseInt(chainIdHex, 16);
  console.log("🔄 Chain changed:", chainId);

  // Best practice: Reload trang khi đổi mạng
  window.location.reload();
};

// Handler cho disconnect
const handleDisconnect = (error) => {
  console.log("❌ MetaMask disconnected:", error);
  wallet.disconnect();
  alert("MetaMask disconnected. Please reconnect.");
};

// Đăng ký listeners
window.ethereum.on("accountsChanged", handleAccountsChanged);
window.ethereum.on("chainChanged", handleChainChanged);
window.ethereum.on("disconnect", handleDisconnect);

// Cleanup khi component unmount (React/Vue)
// removeListener() chỉ xóa listener cụ thể của component này
function cleanup() {
  if (window.ethereum) {
    window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    window.ethereum.removeListener("chainChanged", handleChainChanged);
    window.ethereum.removeListener("disconnect", handleDisconnect);
  }
}
```

#### 🌐 Chuyển mạng (Switch Chain)

Đôi khi bạn cần yêu cầu user chuyển sang mạng cụ thể (ví dụ: dApp chỉ hoạt động trên BSC).

> 📖 **Tài liệu tham khảo**: [MetaMask - Add/Switch Network](https://docs.metamask.io/wallet/how-to/add-network/)

**Code chuyển mạng:**

```javascript
// Chain IDs phổ biến
const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
};

// Thông tin mạng
const NETWORKS = {
  56: {
    chainId: "0x38", // 56 in hex
    chainName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com/"],
  },
  137: {
    chainId: "0x89", // 137 in hex
    chainName: "Polygon Mainnet",
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
    rpcUrls: ["https://polygon-rpc.com/"],
    blockExplorerUrls: ["https://polygonscan.com/"],
  },
};

// Hàm chuyển mạng
async function switchNetwork(targetChainId) {
  try {
    // Thử chuyển sang mạng đã có trong MetaMask
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });

    console.log("✓ Switched to chain:", targetChainId);
    return true;
  } catch (error) {
    // Nếu mạng chưa được thêm vào MetaMask
    if (error.code === 4902) {
      try {
        // Thêm mạng mới
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [NETWORKS[targetChainId]],
        });

        console.log("✓ Added and switched to chain:", targetChainId);
        return true;
      } catch (addError) {
        console.error("Failed to add network:", addError);
        throw addError;
      }
    } else if (error.code === 4001) {
      // User rejected
      console.log("❌ User rejected network switch");
      return false;
    } else {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }
}

// Sử dụng
async function ensureBSCNetwork() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  const currentChainId = Number(network.chainId);

  if (currentChainId !== CHAIN_IDS.BSC_MAINNET) {
    alert("Please switch to BSC network");
    const switched = await switchNetwork(CHAIN_IDS.BSC_MAINNET);

    if (!switched) {
      throw new Error("User must switch to BSC network");
    }
  }

  console.log("✓ On correct network (BSC)");
}

// Gọi trước khi thực hiện transaction
await ensureBSCNetwork();
```

#### 🎨 UI Component hoàn chỉnh (React)

```jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

function WalletConnect() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Kiểm tra đã kết nối trước đó chưa
  useEffect(() => {
    checkIfWalletIsConnected();

    // Lắng nghe sự kiện
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Kiểm tra đã kết nối trước đó
  async function checkIfWalletIsConnected() {
    try {
      if (typeof window.ethereum === "undefined") return;

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAddress(address);

        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));

        await updateBalance(provider, address);
      }
    } catch (error) {
      console.error("Error checking wallet:", error);
    }
  }

  // Kết nối ví
  async function connectWallet() {
    try {
      setIsConnecting(true);

      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        window.open("https://metamask.io/download/", "_blank");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setAddress(address);

      const network = await provider.getNetwork();
      setChainId(Number(network.chainId));

      await updateBalance(provider, address);
    } catch (error) {
      console.error("Connection error:", error);
      alert("Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  }

  // Ngắt kết nối
  function disconnectWallet() {
    setAddress(null);
    setBalance(null);
    setChainId(null);
  }

  // Cập nhật số dư
  async function updateBalance(provider, address) {
    const balance = await provider.getBalance(address);
    setBalance(ethers.formatEther(balance));
  }

  // Xử lý khi đổi tài khoản
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAddress(accounts[0]);
      checkIfWalletIsConnected();
    }
  }

  // Xử lý khi đổi mạng
  function handleChainChanged() {
    window.location.reload();
  }

  // Format địa chỉ: 0x1234...5678
  function formatAddress(addr) {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  // Tên mạng
  function getChainName(id) {
    const names = {
      1: "Ethereum",
      56: "BSC",
      137: "Polygon",
      11155111: "Sepolia",
    };
    return names[id] || `Chain ${id}`;
  }

  return (
    <div className="wallet-connect">
      {!address ? (
        <button onClick={connectWallet} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        <div className="wallet-info">
          <div className="address">
            <strong>Address:</strong> {formatAddress(address)}
          </div>
          <div className="balance">
            <strong>Balance:</strong>{" "}
            {balance ? `${balance} ETH` : "Loading..."}
          </div>
          <div className="network">
            <strong>Network:</strong> {getChainName(chainId)}
          </div>
          <button onClick={disconnectWallet}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
```

### 2.2. Provider vs Signer (Thư viện Ethers.js)

Trong Ethers.js, có 2 khái niệm quan trọng: **Provider** và **Signer**.

> 📖 **Tài liệu tham khảo**:
>
> - [Ethers.js - Providers](https://docs.ethers.org/v6/api/providers/)
> - [Ethers.js - Signers](https://docs.ethers.org/v6/api/providers/#Signer)

#### 📖 Provider (Chỉ đọc)

**Provider** là đối tượng **chỉ đọc** (read-only), dùng để:

- Lấy thông tin blockchain (block number, gas price...)
- Đọc số dư ví
- Gọi hàm `view`/`pure` của smart contract (không cần gas)
- Lấy transaction receipt

**Không cần user xác nhận** khi dùng Provider.

**Các loại Provider:**

```javascript
import { ethers } from "ethers";

// 1. BrowserProvider - Kết nối qua MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);

// 2. JsonRpcProvider - Kết nối qua RPC URL (Backend)
const provider = new ethers.JsonRpcProvider(
  "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
);

// 3. AlchemyProvider - Kết nối qua Alchemy
const provider = new ethers.AlchemyProvider("mainnet", "YOUR_API_KEY");

// 4. InfuraProvider - Kết nối qua Infura
const provider = new ethers.InfuraProvider("mainnet", "YOUR_API_KEY");
```

**Ví dụ sử dụng Provider:**

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);

// Lấy block number hiện tại
const blockNumber = await provider.getBlockNumber();
console.log("Current block:", blockNumber);

// Lấy gas price
const feeData = await provider.getFeeData();
console.log("Gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");

// Lấy số dư của một địa chỉ
const balance = await provider.getBalance(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
);
console.log("Balance:", ethers.formatEther(balance), "ETH");

// Lấy thông tin transaction
const tx = await provider.getTransaction(
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
);
console.log("Transaction:", tx);

// Lấy thông tin block
const block = await provider.getBlock(blockNumber);
console.log("Block:", block);

// Đọc smart contract (view function)
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
const usdtContract = new ethers.Contract(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ERC20_ABI,
  provider // Chỉ cần provider để đọc
);

const balance = await usdtContract.balanceOf(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
);
console.log("USDT Balance:", ethers.formatUnits(balance, 6));
```

#### ✍️ Signer (Có quyền ghi)

**Signer** là đối tượng **có quyền ghi** (write), dùng để:

- Gửi transaction (chuyển ETH, chuyển token...)
- Gọi hàm thay đổi state của smart contract
- Ký message

**Cần user xác nhận** (click "Confirm" trên MetaMask) khi dùng Signer.

**Lấy Signer từ Provider:**

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Lấy địa chỉ của signer
const address = await signer.getAddress();
console.log("Signer address:", address);
```

**Ví dụ sử dụng Signer:**

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 1. Gửi ETH
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
});
console.log("Transaction sent:", tx.hash);
await tx.wait();
console.log("Transaction confirmed!");

// 2. Gọi hàm smart contract (write function)
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];
const usdtContract = new ethers.Contract(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ERC20_ABI,
  signer // Cần signer để ghi
);

const tx2 = await usdtContract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
);
console.log("Transfer transaction:", tx2.hash);
await tx2.wait();
console.log("Transfer confirmed!");

// 3. Ký message
const message = "Hello, Ethereum!";
const signature = await signer.signMessage(message);
console.log("Signature:", signature);
```

#### 🔄 Chuyển đổi giữa Provider và Signer

```javascript
// Contract với Provider (chỉ đọc)
const contractReadOnly = new ethers.Contract(address, abi, provider);
const balance = await contractReadOnly.balanceOf(userAddress);

// Contract với Signer (có thể ghi)
const contractWithSigner = new ethers.Contract(address, abi, signer);
const tx = await contractWithSigner.transfer(toAddress, amount);

// Hoặc chuyển đổi từ contract có sẵn
const contractWithSigner = contractReadOnly.connect(signer);
```

#### 📊 So sánh Provider vs Signer

| Tiêu chí              | Provider                           | Signer                              |
| --------------------- | ---------------------------------- | ----------------------------------- |
| **Quyền**             | Chỉ đọc (read-only)                | Đọc + Ghi (read-write)              |
| **Cần xác nhận user** | Không                              | Có (MetaMask popup)                 |
| **Use case**          | Đọc dữ liệu, gọi view function     | Gửi transaction, gọi write function |
| **Ví dụ**             | Xem số dư, đọc contract            | Chuyển tiền, mint NFT               |
| **Tạo từ**            | RPC URL, Alchemy, Infura, MetaMask | Provider (qua `getSigner()`)        |
| **Phí gas**           | Không tốn                          | Tốn gas                             |

---

### 2.3. SIWE (Sign-In With Ethereum)

**SIWE** (Sign-In With Ethereum) là chuẩn đăng nhập bằng ví Ethereum, thay thế cho username/password truyền thống.

> 📖 **Tài liệu tham khảo**:
>
> - [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
> - [SIWE Official Documentation](https://docs.login.xyz/)
> - [SIWE NPM Package](https://www.npmjs.com/package/siwe)

#### 🔐 Tại sao dùng SIWE?

**Ưu điểm:**

- ✅ Không cần đăng ký tài khoản (email, password)
- ✅ Không lo bị lộ password
- ✅ Xác thực bằng chữ ký số (cryptographic signature)
- ✅ User kiểm soát hoàn toàn danh tính của mình

**Nhược điểm:**

- ❌ User phải cài ví (MetaMask...)
- ❌ Nếu mất private key = mất tài khoản
- ❌ Không thân thiện với người dùng không tech

#### 🔄 Quy trình SIWE

```
┌─────────────────────────────────────────────────────────────┐
│                    SIWE WORKFLOW                            │
└─────────────────────────────────────────────────────────────┘

Frontend                        Backend                    Blockchain
    │                              │                              │
    │  1. User clicks "Sign In"    │                              │
    │──────────────────────────────>│                              │
    │                              │                              │
    │  2. Request nonce            │                              │
    │──────────────────────────────>│                              │
    │                              │                              │
    │  3. Return nonce (random)    │                              │
    │<──────────────────────────────│                              │
    │                              │                              │
    │  4. Create message           │                              │
    │     "Sign in to MyApp        │                              │
    │      Nonce: abc123"          │                              │
    │                              │                              │
    │  5. Sign message             │                              │
    │──────────────────────────────────────────────────────────>│
    │                              │                              │
    │  6. Return signature         │                              │
    │<──────────────────────────────────────────────────────────│
    │                              │                              │
    │  7. Send signature to backend│                              │
    │──────────────────────────────>│                              │
    │                              │                              │
    │                              │  8. Verify signature         │
    │                              │     (recover address)        │
    │                              │                              │
    │  9. Return JWT token         │                              │
    │<──────────────────────────────│                              │
    │                              │                              │
    │  10. Save token, redirect    │                              │
    │                              │                              │
```

#### 💻 Code ví dụ Frontend

```javascript
// File: frontend/auth.js
import { ethers } from "ethers";

class SIWEAuth {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
    this.token = localStorage.getItem("auth_token");
  }

  // Đăng nhập
  async signIn() {
    try {
      // 1. Kết nối ví
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Signing in with address:", address);

      // 2. Lấy nonce từ backend
      const nonceResponse = await fetch(`${this.backendUrl}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const { nonce } = await nonceResponse.json();
      console.log("Received nonce:", nonce);

      // 3. Tạo message theo chuẩn SIWE
      const message = this.createSIWEMessage(address, nonce);
      console.log("Message to sign:", message);

      // 4. Ký message
      const signature = await signer.signMessage(message);
      console.log("Signature:", signature);

      // 5. Gửi signature lên backend để verify
      const verifyResponse = await fetch(`${this.backendUrl}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          message,
          signature,
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error("Verification failed");
      }

      const { token, user } = await verifyResponse.json();

      // 6. Lưu token
      this.token = token;
      localStorage.setItem("auth_token", token);

      console.log("✓ Signed in successfully:", user);
      return user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // Tạo message theo chuẩn SIWE (EIP-4361)
  createSIWEMessage(address, nonce) {
    const domain = window.location.host;
    const origin = window.location.origin;
    const statement = "Sign in to MyApp";

    // Format chuẩn SIWE
    return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;
  }

  // Đăng xuất
  signOut() {
    this.token = null;
    localStorage.removeItem("auth_token");
    console.log("✓ Signed out");
  }

  // Kiểm tra đã đăng nhập chưa
  isAuthenticated() {
    return this.token !== null;
  }

  // Lấy token để gọi API
  getAuthHeader() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

// Sử dụng
const auth = new SIWEAuth("http://localhost:3000");

// Đăng nhập
document.getElementById("signin-btn").addEventListener("click", async () => {
  try {
    const user = await auth.signIn();
    alert(`Welcome, ${user.address}!`);
    window.location.href = "/dashboard";
  } catch (error) {
    alert("Sign in failed: " + error.message);
  }
});

// Đăng xuất
document.getElementById("signout-btn").addEventListener("click", () => {
  auth.signOut();
  window.location.href = "/";
});

// Gọi API với token
async function getUserProfile() {
  const response = await fetch("http://localhost:3000/api/profile", {
    headers: auth.getAuthHeader(),
  });
  const profile = await response.json();
  return profile;
}
```

#### 🖥️ Code ví dụ Backend (Node.js + Express)

```javascript
// File: backend/server.js
const express = require("express");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Database giả lập (trong thực tế dùng MongoDB, PostgreSQL...)
const users = new Map(); // address -> user data
const nonces = new Map(); // address -> nonce

// 1. Endpoint lấy nonce
app.post("/auth/nonce", (req, res) => {
  const { address } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  // Tạo nonce ngẫu nhiên
  const nonce = crypto.randomBytes(16).toString("hex");

  // Lưu nonce (expire sau 5 phút)
  nonces.set(address.toLowerCase(), {
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  console.log(`Generated nonce for ${address}: ${nonce}`);

  res.json({ nonce });
});

// 2. Endpoint verify signature
app.post("/auth/verify", async (req, res) => {
  try {
    const { address, message, signature } = req.body;

    // Kiểm tra input
    if (!address || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const addressLower = address.toLowerCase();

    // Kiểm tra nonce
    const nonceData = nonces.get(addressLower);
    if (!nonceData) {
      return res.status(400).json({ error: "Nonce not found" });
    }

    if (Date.now() > nonceData.expiresAt) {
      nonces.delete(addressLower);
      return res.status(400).json({ error: "Nonce expired" });
    }

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== addressLower) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Xóa nonce đã dùng
    nonces.delete(addressLower);

    // Tạo hoặc cập nhật user
    let user = users.get(addressLower);
    if (!user) {
      user = {
        address: addressLower,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      users.set(addressLower, user);
      console.log(`New user registered: ${addressLower}`);
    } else {
      user.lastLogin = new Date().toISOString();
      console.log(`User logged in: ${addressLower}`);
    }

    // Tạo JWT token
    const token = jwt.sign({ address: addressLower }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        address: user.address,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// 3. Middleware xác thực JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
}

// 4. API protected (cần đăng nhập)
app.get("/api/profile", authenticateToken, (req, res) => {
  const user = users.get(req.user.address);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({
    address: user.address,
    createdAt: user.createdAt,
    lastLogin: user.lastLogin,
  });
});

// 5. API public (không cần đăng nhập)
app.get("/api/stats", (req, res) => {
  res.json({
    totalUsers: users.size,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 📦 Sử dụng thư viện SIWE chính thức

Thay vì tự implement, bạn có thể dùng thư viện chính thức:

```bash
npm install siwe
```

> 📖 **Tài liệu tham khảo**: [SIWE Library Documentation](https://docs.login.xyz/libraries/typescript)

**Backend với thư viện SIWE:**

```javascript
const express = require("express");
const { SiweMessage } = require("siwe");
const session = require("express-session");

const app = express();
app.use(express.json());
app.use(
  session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true nếu dùng HTTPS
  })
);

// 1. Lấy nonce
app.get("/auth/nonce", (req, res) => {
  req.session.nonce = crypto.randomBytes(16).toString("hex");
  res.json({ nonce: req.session.nonce });
});

// 2. Verify
app.post("/auth/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;

    // Parse message theo chuẩn SIWE
    const siweMessage = new SiweMessage(message);

    // Verify signature và nonce
    const fields = await siweMessage.verify({
      signature,
      nonce: req.session.nonce,
    });

    // Lưu user vào session
    req.session.user = {
      address: fields.data.address,
    };

    res.json({ success: true, address: fields.data.address });
  } catch (error) {
    console.error("Verification failed:", error);
    res.status(401).json({ error: "Verification failed" });
  }
});

// 3. Logout
app.post("/auth/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// 4. Protected route
app.get("/api/profile", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json(req.session.user);
});
```

---

### 📝 Tổng kết Phần 2

**Những điều quan trọng cần nhớ:**

1. **Kết nối MetaMask:**

   - Kiểm tra `window.ethereum` có tồn tại không
   - Dùng `eth_requestAccounts` để yêu cầu kết nối
   - Lắng nghe sự kiện `accountsChanged`, `chainChanged`
   - Có thể chuyển mạng bằng `wallet_switchEthereumChain`

2. **Provider vs Signer:**

   - **Provider**: Chỉ đọc, không cần xác nhận user
   - **Signer**: Có thể ghi, cần xác nhận user (MetaMask popup)
   - Provider dùng để đọc dữ liệu, Signer dùng để gửi transaction

3. **SIWE (Sign-In With Ethereum):**

   - Đăng nhập bằng ví thay vì username/password
   - Quy trình: Lấy nonce → Ký message → Verify signature → Cấp JWT
   - Backend verify bằng `ethers.verifyMessage()`
   - Có thể dùng thư viện `siwe` chính thức

4. **Best Practices:**
   - Luôn kiểm tra MetaMask có được cài đặt không
   - Xử lý lỗi khi user từ chối kết nối
   - Reload trang khi user đổi mạng
   - Lưu token vào localStorage (hoặc cookie)
   - Verify signature ở backend, không tin tưởng frontend

---

---

## Phần 3: Xử lý sự kiện (Event)

Events (sự kiện) là cơ chế quan trọng trong smart contract, cho phép contract **ghi lại** các hoạt động quan trọng và **thông báo** cho các ứng dụng bên ngoài.

> 📖 **Tài liệu tham khảo**:
>
> - [Solidity Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
> - [Ethers.js - Contract Events](https://docs.ethers.org/v6/api/contract/#ContractEvent)

### 3.1. Sự kiện Transfer trong ERC20

#### 📢 Tại sao cần Events?

**Events** giải quyết 3 vấn đề chính:

1. **Logging**: Ghi lại lịch sử hoạt động của contract (không thể sửa đổi)
2. **Notification**: Thông báo cho frontend khi có thay đổi
3. **Tiết kiệm gas**: Lưu trữ data trong events rẻ hơn nhiều so với storage

**So sánh chi phí:**

```
Lưu 1 uint256 vào storage:     ~20,000 gas
Lưu 1 uint256 vào event:        ~375 gas
→ Rẻ hơn 50 lần!
```

#### 🔔 Event Transfer trong ERC20

Event `Transfer` là event quan trọng nhất trong chuẩn ERC20, được phát ra mỗi khi có chuyển token.

**Định nghĩa trong Solidity:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20 {
    // Event Transfer với 3 tham số
    // indexed: Cho phép filter theo tham số này
    event Transfer(
        address indexed from,    // Người gửi
        address indexed to,      // Người nhận
        uint256 value            // Số lượng
    );

    // Event Approval
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    mapping(address => uint256) public balanceOf;

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;

        // Phát sự kiện Transfer
        emit Transfer(msg.sender, to, amount);

        return true;
    }

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;

        // Khi mint, from = address(0)
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;

        // Khi burn, to = address(0)
        emit Transfer(msg.sender, address(0), amount);
    }
}
```

#### 🔍 Tham số `indexed`

Tham số được đánh dấu `indexed` có thể được **filter** khi query events.

**Quy tắc:**

- Tối đa **3 tham số indexed** trong 1 event
- Tham số `indexed` được lưu trong **topics** (dễ search)
- Tham số không `indexed` được lưu trong **data** (khó search hơn)

**Ví dụ:**

```solidity
event Transfer(
    address indexed from,    // Topic 1: Có thể filter
    address indexed to,      // Topic 2: Có thể filter
    uint256 value            // Data: Không thể filter trực tiếp
);

// Có thể query:
// - Tất cả giao dịch FROM địa chỉ A
// - Tất cả giao dịch TO địa chỉ B
// - Tất cả giao dịch FROM A TO B
// Không thể query trực tiếp: Tất cả giao dịch có value > 1000
```

#### 📊 Cấu trúc Event Log

Khi event được phát ra, nó được lưu trong **transaction receipt** với cấu trúc:

```javascript
{
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // Contract address
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Event signature (Transfer)
    "0x000000000000000000000000a1b2c3d4e5f6...", // from (indexed)
    "0x000000000000000000000000f6e5d4c3b2a1..." // to (indexed)
  ],
  data: "0x0000000000000000000000000000000000000000000000000de0b6b3a7640000", // value (100 tokens)
  blockNumber: 12345678,
  transactionHash: "0xabc123...",
  logIndex: 0
}
```

---

### 3.2. Lấy sự kiện quá khứ (Past Events)

Bạn có thể query các events đã xảy ra trong quá khứ để xây dựng lịch sử giao dịch.

#### 📜 Query Past Events với Ethers.js

**Ví dụ 1: Lấy tất cả giao dịch Transfer**

```javascript
import { ethers } from "ethers";

// Kết nối với contract
const provider = new ethers.JsonRpcProvider(
  "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
);

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address) view returns (uint256)",
];

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

// Lấy tất cả Transfer events trong 1000 blocks gần nhất
const currentBlock = await provider.getBlockNumber();
const fromBlock = currentBlock - 1000;

const events = await contract.queryFilter(
  contract.filters.Transfer(), // Filter: tất cả Transfer events
  fromBlock,
  currentBlock
);

console.log(`Found ${events.length} Transfer events`);

// Xử lý từng event
events.forEach((event) => {
  console.log({
    from: event.args.from,
    to: event.args.to,
    value: ethers.formatUnits(event.args.value, 6), // USDT có 6 decimals
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
  });
});
```

**Ví dụ 2: Lấy giao dịch GỬI ĐẾN một địa chỉ cụ thể**

```javascript
const USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Filter: Chỉ lấy events mà TO = USER_ADDRESS
const filter = contract.filters.Transfer(null, USER_ADDRESS);

const events = await contract.queryFilter(filter, fromBlock, currentBlock);

console.log(`User ${USER_ADDRESS} received ${events.length} transfers`);

let totalReceived = 0n;
events.forEach((event) => {
  const amount = event.args.value;
  totalReceived += amount;

  console.log({
    from: event.args.from,
    amount: ethers.formatUnits(amount, 6),
    txHash: event.transactionHash,
  });
});

console.log("Total received:", ethers.formatUnits(totalReceived, 6), "USDT");
```

**Ví dụ 3: Lấy giao dịch GỬI ĐI từ một địa chỉ cụ thể**

```javascript
const USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Filter: Chỉ lấy events mà FROM = USER_ADDRESS
const filter = contract.filters.Transfer(USER_ADDRESS, null);

const events = await contract.queryFilter(filter, fromBlock, currentBlock);

console.log(`User ${USER_ADDRESS} sent ${events.length} transfers`);

let totalSent = 0n;
events.forEach((event) => {
  const amount = event.args.value;
  totalSent += amount;

  console.log({
    to: event.args.to,
    amount: ethers.formatUnits(amount, 6),
    txHash: event.transactionHash,
  });
});

console.log("Total sent:", ethers.formatUnits(totalSent, 6), "USDT");
```

**Ví dụ 4: Lấy giao dịch giữa 2 địa chỉ cụ thể**

```javascript
const ADDRESS_A = "0xAAA...";
const ADDRESS_B = "0xBBB...";

// Filter: FROM = A AND TO = B
const filter = contract.filters.Transfer(ADDRESS_A, ADDRESS_B);

const events = await contract.queryFilter(filter, fromBlock, currentBlock);

console.log(`Found ${events.length} transfers from A to B`);
```

#### 🔧 Xây dựng Transaction History

**Ví dụ: Tạo lịch sử giao dịch đầy đủ cho một user**

```javascript
async function getTransactionHistory(
  userAddress,
  contractAddress,
  fromBlock,
  toBlock
) {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

  const ERC20_ABI = [
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ];

  const contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

  // Lấy thông tin token
  const decimals = await contract.decimals();
  const symbol = await contract.symbol();

  // Lấy events gửi đi
  const sentFilter = contract.filters.Transfer(userAddress, null);
  const sentEvents = await contract.queryFilter(sentFilter, fromBlock, toBlock);

  // Lấy events nhận vào
  const receivedFilter = contract.filters.Transfer(null, userAddress);
  const receivedEvents = await contract.queryFilter(
    receivedFilter,
    fromBlock,
    toBlock
  );

  // Gộp và sắp xếp theo block number
  const allEvents = [...sentEvents, ...receivedEvents].sort(
    (a, b) => a.blockNumber - b.blockNumber
  );

  // Format kết quả
  const history = await Promise.all(
    allEvents.map(async (event) => {
      const block = await provider.getBlock(event.blockNumber);
      const isSent =
        event.args.from.toLowerCase() === userAddress.toLowerCase();

      return {
        type: isSent ? "SENT" : "RECEIVED",
        from: event.args.from,
        to: event.args.to,
        amount: ethers.formatUnits(event.args.value, decimals),
        symbol: symbol,
        blockNumber: event.blockNumber,
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        transactionHash: event.transactionHash,
      };
    })
  );

  return history;
}

// Sử dụng
const history = await getTransactionHistory(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  18000000, // From block
  18001000 // To block
);

console.log("Transaction History:");
console.table(history);
```

#### ⚠️ Lưu ý khi query Past Events

**1. Giới hạn block range:**

```javascript
// ❌ SAI: Range quá lớn sẽ bị lỗi
const events = await contract.queryFilter(filter, 0, currentBlock);
// Error: query returned more than 10000 results

// ✅ ĐÚNG: Chia nhỏ thành nhiều chunks
async function queryEventsInChunks(
  contract,
  filter,
  fromBlock,
  toBlock,
  chunkSize = 5000
) {
  const allEvents = [];

  for (let start = fromBlock; start <= toBlock; start += chunkSize) {
    const end = Math.min(start + chunkSize - 1, toBlock);

    console.log(`Querying blocks ${start} to ${end}...`);
    const events = await contract.queryFilter(filter, start, end);
    allEvents.push(...events);

    // Delay để tránh rate limit
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allEvents;
}

// Sử dụng
const events = await queryEventsInChunks(
  contract,
  contract.filters.Transfer(userAddress, null),
  18000000,
  18100000
);
```

**2. Rate limiting:**

```javascript
// Nếu query nhiều lần, cần implement retry logic
async function queryWithRetry(
  contract,
  filter,
  fromBlock,
  toBlock,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await contract.queryFilter(filter, fromBlock, toBlock);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

### 3.3. Đăng ký theo thời gian thực (Event Listeners)

Thay vì query events quá khứ, bạn có thể **lắng nghe events real-time** để cập nhật UI ngay lập tức.

#### 🎧 Lắng nghe Events với Ethers.js

**Ví dụ 1: Lắng nghe tất cả Transfer events**

```javascript
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

// Lắng nghe tất cả Transfer events
contract.on("Transfer", (from, to, value, event) => {
  console.log("🔔 New Transfer detected!");
  console.log({
    from: from,
    to: to,
    value: ethers.formatUnits(value, 6),
    blockNumber: event.log.blockNumber,
    transactionHash: event.log.transactionHash,
  });

  // Cập nhật UI
  updateUI(from, to, value);
});

console.log("✓ Listening for Transfer events...");
```

**Ví dụ 2: Lắng nghe Transfer đến địa chỉ cụ thể**

```javascript
const USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Filter: Chỉ lắng nghe events mà TO = USER_ADDRESS
const filter = contract.filters.Transfer(null, USER_ADDRESS);

contract.on(filter, (from, to, value, event) => {
  console.log("💰 You received tokens!");
  console.log({
    from: from,
    amount: ethers.formatUnits(value, 6),
    txHash: event.log.transactionHash,
  });

  // Hiển thị notification
  showNotification(
    `Received ${ethers.formatUnits(value, 6)} USDT from ${from}`
  );

  // Cập nhật số dư
  updateBalance();
});
```

**Ví dụ 3: Lắng nghe nhiều events**

```javascript
// Lắng nghe cả Transfer và Approval
contract.on("Transfer", (from, to, value, event) => {
  console.log("Transfer:", { from, to, value: ethers.formatUnits(value, 6) });
});

contract.on("Approval", (owner, spender, value, event) => {
  console.log("Approval:", {
    owner,
    spender,
    value: ethers.formatUnits(value, 6),
  });
});
```

#### 🛑 Dừng lắng nghe Events

```javascript
// Cách 1: Dừng lắng nghe một event cụ thể
const listener = (from, to, value, event) => {
  console.log("Transfer:", { from, to, value });
};

contract.on("Transfer", listener);

// Sau đó dừng
contract.off("Transfer", listener);

// Cách 2: Dừng tất cả listeners của một event
contract.removeAllListeners("Transfer");

// Cách 3: Dừng tất cả listeners của contract
contract.removeAllListeners();
```

#### 🎨 Ví dụ thực tế: Real-time Transaction Monitor (React)

```jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

function TransactionMonitor({ contractAddress, userAddress }) {
  const [transactions, setTransactions] = useState([]);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    let contract;

    async function setupListener() {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        const ERC20_ABI = [
          "event Transfer(address indexed from, address indexed to, uint256 value)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
        ];

        contract = new ethers.Contract(contractAddress, ERC20_ABI, provider);

        const symbol = await contract.symbol();
        const decimals = await contract.decimals();

        // Lắng nghe Transfer events đến user
        const filter = contract.filters.Transfer(null, userAddress);

        contract.on(filter, (from, to, value, event) => {
          const newTx = {
            id: event.log.transactionHash,
            from: from,
            to: to,
            amount: ethers.formatUnits(value, decimals),
            symbol: symbol,
            timestamp: new Date().toISOString(),
            txHash: event.log.transactionHash,
          };

          setTransactions((prev) => [newTx, ...prev]);

          // Show browser notification
          if (Notification.permission === "granted") {
            new Notification("Received Tokens!", {
              body: `You received ${newTx.amount} ${symbol}`,
            });
          }
        });

        setIsListening(true);
        console.log("✓ Listening for incoming transfers...");
      } catch (error) {
        console.error("Error setting up listener:", error);
      }
    }

    setupListener();

    // Cleanup khi component unmount
    return () => {
      if (contract) {
        contract.removeAllListeners();
        console.log("✓ Stopped listening");
      }
    };
  }, [contractAddress, userAddress]);

  return (
    <div className="transaction-monitor">
      <h2>Real-time Transaction Monitor</h2>

      <div className="status">
        {isListening ? (
          <span className="listening">🟢 Listening...</span>
        ) : (
          <span className="not-listening">🔴 Not listening</span>
        )}
      </div>

      <div className="transactions">
        {transactions.length === 0 ? (
          <p>No transactions yet. Waiting for incoming transfers...</p>
        ) : (
          <ul>
            {transactions.map((tx) => (
              <li key={tx.id} className="transaction-item">
                <div className="tx-info">
                  <strong>
                    +{tx.amount} {tx.symbol}
                  </strong>
                  <span>from {tx.from.substring(0, 10)}...</span>
                </div>
                <div className="tx-meta">
                  <span>{new Date(tx.timestamp).toLocaleTimeString()}</span>
                  <a
                    href={`https://etherscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Etherscan
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TransactionMonitor;
```

#### 🎯 Best Practices cho Event Listeners

**1. Cleanup khi component unmount (React/Vue):**

```javascript
useEffect(() => {
  const contract = new ethers.Contract(address, abi, provider);

  const listener = (from, to, value) => {
    console.log("Transfer:", { from, to, value });
  };

  contract.on("Transfer", listener);

  // Cleanup
  return () => {
    contract.off("Transfer", listener);
  };
}, []);
```

**2. Xử lý lỗi:**

```javascript
contract.on("Transfer", (from, to, value, event) => {
  try {
    // Xử lý event
    updateUI(from, to, value);
  } catch (error) {
    console.error("Error handling Transfer event:", error);
    // Không throw error để không crash listener
  }
});
```

**3. Debounce cho nhiều events:**

```javascript
let debounceTimer;

contract.on("Transfer", (from, to, value, event) => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    // Xử lý sau 500ms không có event mới
    updateUI();
  }, 500);
});
```

---

### 3.4. Custom Events trong Smart Contract

Bạn có thể tạo custom events cho các hoạt động đặc biệt trong contract.

#### 📝 Ví dụ: NFT Marketplace

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract NFTMarketplace {
    // Custom events
    event ItemListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 timestamp
    );

    event ItemSold(
        uint256 indexed tokenId,
        address indexed seller,
        address indexed buyer,
        uint256 price,
        uint256 timestamp
    );

    event ItemCancelled(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 timestamp
    );

    event PriceUpdated(
        uint256 indexed tokenId,
        uint256 oldPrice,
        uint256 newPrice,
        uint256 timestamp
    );

    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    function listItem(uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");

        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            active: true
        });

        emit ItemListed(tokenId, msg.sender, price, block.timestamp);
    }

    function buyItem(uint256 tokenId) external payable {
        Listing memory listing = listings[tokenId];
        require(listing.active, "Item not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        listings[tokenId].active = false;

        // Transfer payment to seller
        payable(listing.seller).transfer(listing.price);

        // Refund excess payment
        if (msg.value > listing.price) {
            payable(msg.sender).transfer(msg.value - listing.price);
        }

        emit ItemSold(
            tokenId,
            listing.seller,
            msg.sender,
            listing.price,
            block.timestamp
        );
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Item not listed");

        listings[tokenId].active = false;

        emit ItemCancelled(tokenId, msg.sender, block.timestamp);
    }

    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        Listing storage listing = listings[tokenId];
        require(listing.seller == msg.sender, "Not the seller");
        require(listing.active, "Item not listed");
        require(newPrice > 0, "Price must be greater than 0");

        uint256 oldPrice = listing.price;
        listing.price = newPrice;

        emit PriceUpdated(tokenId, oldPrice, newPrice, block.timestamp);
    }
}
```

#### 🎧 Lắng nghe Custom Events

```javascript
const MARKETPLACE_ABI = [
  "event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price, uint256 timestamp)",
  "event ItemSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price, uint256 timestamp)",
  "event ItemCancelled(uint256 indexed tokenId, address indexed seller, uint256 timestamp)",
  "event PriceUpdated(uint256 indexed tokenId, uint256 oldPrice, uint256 newPrice, uint256 timestamp)",
];

const marketplace = new ethers.Contract(
  MARKETPLACE_ADDRESS,
  MARKETPLACE_ABI,
  provider
);

// Lắng nghe ItemListed
marketplace.on("ItemListed", (tokenId, seller, price, timestamp, event) => {
  console.log("🆕 New item listed!");
  console.log({
    tokenId: tokenId.toString(),
    seller: seller,
    price: ethers.formatEther(price),
    timestamp: new Date(Number(timestamp) * 1000).toISOString(),
  });

  // Cập nhật UI: Thêm item vào danh sách
  addItemToList(tokenId, seller, price);
});

// Lắng nghe ItemSold
marketplace.on(
  "ItemSold",
  (tokenId, seller, buyer, price, timestamp, event) => {
    console.log("💰 Item sold!");
    console.log({
      tokenId: tokenId.toString(),
      seller: seller,
      buyer: buyer,
      price: ethers.formatEther(price),
    });

    // Cập nhật UI: Xóa item khỏi danh sách
    removeItemFromList(tokenId);

    // Hiển thị notification
    showNotification(
      `NFT #${tokenId} sold for ${ethers.formatEther(price)} ETH`
    );
  }
);

// Lắng nghe PriceUpdated
marketplace.on(
  "PriceUpdated",
  (tokenId, oldPrice, newPrice, timestamp, event) => {
    console.log("💲 Price updated!");
    console.log({
      tokenId: tokenId.toString(),
      oldPrice: ethers.formatEther(oldPrice),
      newPrice: ethers.formatEther(newPrice),
    });

    // Cập nhật UI: Cập nhật giá
    updateItemPrice(tokenId, newPrice);
  }
);
```

---

### 📝 Tổng kết Phần 3

**Những điều quan trọng cần nhớ:**

1. **Events là gì:**

   - Cơ chế logging trong smart contract
   - Rẻ hơn nhiều so với lưu vào storage
   - Không thể sửa đổi sau khi đã ghi
   - Có thể query và lắng nghe real-time

2. **Tham số `indexed`:**

   - Tối đa 3 tham số indexed
   - Cho phép filter khi query
   - Lưu trong topics (dễ search)

3. **Query Past Events:**

   - Dùng `queryFilter()` để lấy events quá khứ
   - Cần chia nhỏ block range (tránh query quá nhiều)
   - Implement retry logic cho rate limiting
   - Có thể xây dựng transaction history

4. **Event Listeners:**

   - Dùng `contract.on()` để lắng nghe real-time
   - Nhớ cleanup với `contract.off()` hoặc `removeAllListeners()`
   - Xử lý lỗi trong listener để tránh crash
   - Có thể filter events cụ thể

5. **Best Practices:**
   - Luôn emit events cho các hoạt động quan trọng
   - Sử dụng indexed cho các tham số cần filter
   - Cleanup listeners khi không dùng nữa
   - Implement error handling trong listeners
   - Debounce nếu có quá nhiều events

---

---

## Phần 4: Tích hợp Off-chain (Backend Node.js)

Backend đóng vai trò quan trọng trong hệ thống blockchain, xử lý các tác vụ không thể thực hiện trên frontend như:

- Tự động gửi transaction
- Monitor events và cập nhật database
- Xử lý webhook
- Quản lý private keys an toàn

> 📖 **Tài liệu tham khảo**:
>
> - [Ethers.js - Wallets](https://docs.ethers.org/v6/api/wallet/)
> - [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### 4.1. Ký bằng Private Key (Backend Wallet)

Trên backend, không có MetaMask, ta phải tạo wallet từ private key.

#### 🔐 Tạo Wallet từ Private Key

**⚠️ LƯU Ý BẢO MẬT:**

- **KHÔNG BAO GIỜ** commit private key lên Git
- Lưu private key trong file `.env`
- Sử dụng `.gitignore` để loại trừ `.env`
- Trong production, dùng secret management service (AWS Secrets Manager, HashiCorp Vault...)

**Ví dụ cơ bản:**

```javascript
// File: backend/wallet.js
require("dotenv").config();
const { ethers } = require("ethers");

// 1. Kết nối qua RPC Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// 2. Tạo wallet từ private key
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log("Wallet address:", wallet.address);

// 3. Kiểm tra số dư
async function checkBalance() {
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
}

checkBalance();
```

**File `.env`:**

```bash
# RPC Provider
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Wallet Private Key (KHÔNG COMMIT FILE NÀY!)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret123
```

**File `.gitignore`:**

```
# Environment variables
.env
.env.local
.env.production

# Node modules
node_modules/

# Logs
*.log
```

#### 💰 Gửi ETH từ Backend

```javascript
// File: backend/sendETH.js
require("dotenv").config();
const { ethers } = require("ethers");

async function sendETH(toAddress, amountInEther) {
  try {
    // 1. Setup wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Sending from:", wallet.address);
    console.log("Sending to:", toAddress);
    console.log("Amount:", amountInEther, "ETH");

    // 2. Kiểm tra số dư
    const balance = await provider.getBalance(wallet.address);
    const amount = ethers.parseEther(amountInEther);

    if (balance < amount) {
      throw new Error("Insufficient balance");
    }

    // 3. Gửi transaction
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amount,
    });

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    // 4. Chờ confirmation
    const receipt = await tx.wait();

    console.log("✓ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    return receipt;
  } catch (error) {
    console.error("Error sending ETH:", error);
    throw error;
  }
}

// Sử dụng
sendETH("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "0.1");
```

#### 🪙 Gửi ERC20 Token từ Backend

```javascript
// File: backend/sendToken.js
require("dotenv").config();
const { ethers } = require("ethers");

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

async function sendToken(tokenAddress, toAddress, amount) {
  try {
    // 1. Setup wallet
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // 2. Kết nối với token contract
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    // 3. Lấy thông tin token
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();

    console.log(`Sending ${amount} ${symbol}...`);
    console.log("From:", wallet.address);
    console.log("To:", toAddress);

    // 4. Kiểm tra số dư
    const balance = await tokenContract.balanceOf(wallet.address);
    const amountInWei = ethers.parseUnits(amount, decimals);

    if (balance < amountInWei) {
      throw new Error(`Insufficient ${symbol} balance`);
    }

    // 5. Gửi token
    const tx = await tokenContract.transfer(toAddress, amountInWei);

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();

    console.log("✓ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());

    return receipt;
  } catch (error) {
    console.error("Error sending token:", error);
    throw error;
  }
}

// Sử dụng
sendToken(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "100" // 100 USDT
);
```

#### 🏭 Wallet Manager Class (Production-ready)

```javascript
// File: backend/WalletManager.js
require("dotenv").config();
const { ethers } = require("ethers");

class WalletManager {
  constructor(rpcUrl, privateKey) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.address = this.wallet.address;
  }

  // Lấy số dư ETH
  async getBalance() {
    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  // Lấy số dư token
  async getTokenBalance(tokenAddress) {
    const ERC20_ABI = [
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    const contract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      this.provider
    );

    const [balance, decimals, symbol] = await Promise.all([
      contract.balanceOf(this.address),
      contract.decimals(),
      contract.symbol(),
    ]);

    return {
      balance: ethers.formatUnits(balance, decimals),
      symbol: symbol,
      raw: balance,
    };
  }

  // Gửi ETH
  async sendETH(to, amountInEther, options = {}) {
    const amount = ethers.parseEther(amountInEther);

    // Kiểm tra số dư
    const balance = await this.provider.getBalance(this.address);
    if (balance < amount) {
      throw new Error("Insufficient ETH balance");
    }

    // Gửi transaction
    const tx = await this.wallet.sendTransaction({
      to: to,
      value: amount,
      ...options, // gasLimit, gasPrice, etc.
    });

    console.log(`[ETH Transfer] TX: ${tx.hash}`);

    // Chờ confirmation
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? "SUCCESS" : "FAILED",
    };
  }

  // Gửi ERC20 token
  async sendToken(tokenAddress, to, amount, options = {}) {
    const ERC20_ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);

    // Lấy thông tin token
    const [decimals, symbol, balance] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.balanceOf(this.address),
    ]);

    const amountInWei = ethers.parseUnits(amount, decimals);

    // Kiểm tra số dư
    if (balance < amountInWei) {
      throw new Error(`Insufficient ${symbol} balance`);
    }

    // Gửi transaction
    const tx = await contract.transfer(to, amountInWei, options);

    console.log(`[${symbol} Transfer] TX: ${tx.hash}`);

    // Chờ confirmation
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? "SUCCESS" : "FAILED",
      token: symbol,
      amount: amount,
    };
  }

  // Ước tính gas cho transaction
  async estimateGas(to, value, data = "0x") {
    const gasEstimate = await this.provider.estimateGas({
      from: this.address,
      to: to,
      value: value,
      data: data,
    });

    const feeData = await this.provider.getFeeData();

    return {
      gasLimit: gasEstimate.toString(),
      gasPrice: ethers.formatUnits(feeData.gasPrice, "gwei") + " Gwei",
      estimatedCost:
        ethers.formatEther(gasEstimate * feeData.gasPrice) + " ETH",
    };
  }

  // Lấy transaction history
  async getTransactionHistory(startBlock, endBlock) {
    const history = await this.provider.getHistory(
      this.address,
      startBlock,
      endBlock
    );
    return history;
  }
}

// Export
module.exports = WalletManager;

// Sử dụng
const walletManager = new WalletManager(
  process.env.RPC_URL,
  process.env.PRIVATE_KEY
);

// Kiểm tra số dư
walletManager.getBalance().then((balance) => {
  console.log("ETH Balance:", balance);
});

// Gửi ETH
walletManager
  .sendETH("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "0.1")
  .then((result) => {
    console.log("Transfer result:", result);
  })
  .catch((error) => {
    console.error("Transfer failed:", error);
  });
```

---

### 4.2. Sử dụng RPC Provider

RPC Provider là cầu nối giữa ứng dụng và blockchain. Có nhiều loại provider khác nhau.

#### 🌐 Các loại RPC Provider

**1. Public RPC (Miễn phí nhưng không ổn định):**

```javascript
// Ethereum Mainnet - Public RPC
const provider = new ethers.JsonRpcProvider(
  "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
);

// BSC Mainnet - Public RPC
const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org");

// Polygon Mainnet - Public RPC
const provider = new ethers.JsonRpcProvider("https://polygon-rpc.com");
```

**2. Alchemy (Khuyến nghị cho Production):**

```javascript
require("dotenv").config();
const { ethers } = require("ethers");

// Alchemy Provider
const provider = new ethers.AlchemyProvider(
  "mainnet", // hoặc "sepolia", "polygon", "arbitrum"
  process.env.ALCHEMY_API_KEY
);

// Hoặc dùng JsonRpcProvider với URL đầy đủ
const provider = new ethers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
);
```

**3. Infura:**

```javascript
const provider = new ethers.InfuraProvider(
  "mainnet",
  process.env.INFURA_API_KEY
);

// Hoặc
const provider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
);
```

**4. QuickNode:**

```javascript
const provider = new ethers.JsonRpcProvider(process.env.QUICKNODE_URL);
// URL format: https://your-endpoint.quiknode.pro/YOUR_API_KEY/
```

#### 🔄 Fallback Provider (Tăng độ tin cậy)

Sử dụng nhiều provider để tự động chuyển đổi khi một provider gặp lỗi:

```javascript
const { ethers } = require("ethers");

// Tạo FallbackProvider với nhiều providers
const providers = [
  new ethers.AlchemyProvider("mainnet", process.env.ALCHEMY_API_KEY),
  new ethers.InfuraProvider("mainnet", process.env.INFURA_API_KEY),
  new ethers.JsonRpcProvider(
    "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
  ),
];

const fallbackProvider = new ethers.FallbackProvider(providers);

// Sử dụng như provider bình thường
const blockNumber = await fallbackProvider.getBlockNumber();
console.log("Current block:", blockNumber);
```

#### 🔁 Retry Logic cho RPC Calls

```javascript
// File: backend/utils/rpcHelper.js
async function callWithRetry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);

      if (i === maxRetries - 1) {
        throw error; // Throw lỗi nếu hết số lần retry
      }

      // Exponential backoff: 1s, 2s, 4s...
      const waitTime = delay * Math.pow(2, i);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// Sử dụng
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Lấy block number với retry
const blockNumber = await callWithRetry(async () => {
  return await provider.getBlockNumber();
});

console.log("Block number:", blockNumber);

// Gửi transaction với retry
const tx = await callWithRetry(async () => {
  return await wallet.sendTransaction({
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value: ethers.parseEther("0.1"),
  });
});

console.log("Transaction sent:", tx.hash);
```

---

### 📝 Tổng kết Phần 4

**Những điều quan trọng cần nhớ:**

1. **Backend Wallet:**

   - Tạo wallet từ private key
   - Lưu private key trong `.env` (KHÔNG commit lên Git)
   - Sử dụng WalletManager class để quản lý
   - Implement error handling và retry logic

2. **RPC Provider:**

   - Sử dụng Alchemy/Infura cho production
   - Implement FallbackProvider cho độ tin cậy cao
   - Monitor performance và latency
   - Retry logic với exponential backoff

3. **Best Practices:**
   - Luôn validate input
   - Implement retry logic
   - Rate limiting cho RPC calls

---

## Phần 5: Nhập môn Bảo mật và Kiểm toán

Bảo mật là yếu tố quan trọng nhất trong smart contract. Một lỗi nhỏ có thể dẫn đến mất hàng triệu đô la.

> 📖 **Tài liệu tham khảo**:
>
> - [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
> - [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/security)
> - [SWC Registry](https://swcregistry.io/) - Danh sách các lỗ hổng phổ biến

### 5.1. Reentrancy Attack (Tấn công tái nhập)

**Reentrancy** là lỗ hổng nguy hiểm nhất trong smart contract, đã gây ra vụ hack The DAO năm 2016 với thiệt hại 60 triệu USD.

#### 🔴 Lỗ hổng Reentrancy

**Cách hoạt động:**

```
1. User gọi hàm withdraw() của Contract A
2. Contract A chuyển ETH cho User (Contract B của hacker)
3. Contract B nhận ETH, fallback function được kích hoạt
4. Contract B gọi lại withdraw() của Contract A (REENTRANCY!)
5. Contract A chưa kịp cập nhật balance, kiểm tra vẫn đủ tiền
6. Contract A lại chuyển ETH cho Contract B
7. Lặp lại cho đến khi Contract A hết tiền
```

**Code có lỗ hổng:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ❌ CONTRACT CÓ LỖ HỔNG - KHÔNG SỬ DỤNG!
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // ❌ HÀM CÓ LỖ HỔNG REENTRANCY
    function withdraw() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // ❌ SAI: Chuyển tiền TRƯỚC KHI cập nhật balance
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        // Dòng này chưa được thực thi khi bị reentrancy
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}
```

**Contract tấn công:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw() external;
}

// Contract của hacker
contract Attacker {
    IVulnerableBank public bank;
    uint256 public attackCount;

    constructor(address _bankAddress) {
        bank = IVulnerableBank(_bankAddress);
    }

    // Bắt đầu tấn công
    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ETH");

        // Deposit vào bank
        bank.deposit{value: msg.value}();

        // Bắt đầu rút tiền (sẽ trigger reentrancy)
        bank.withdraw();
    }

    // Fallback function - được gọi khi nhận ETH
    receive() external payable {
        attackCount++;

        // Gọi lại withdraw() nếu bank còn tiền
        if (address(bank).balance >= 1 ether) {
            bank.withdraw();
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

#### ✅ Cách phòng tránh Reentrancy

**1. Checks-Effects-Interactions Pattern:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ✅ CÁCH 1: Checks-Effects-Interactions Pattern
contract SafeBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 balance = balances[msg.sender];

        // 1. CHECKS: Kiểm tra điều kiện
        require(balance > 0, "Insufficient balance");

        // 2. EFFECTS: Cập nhật state TRƯỚC KHI chuyển tiền
        balances[msg.sender] = 0;

        // 3. INTERACTIONS: Tương tác với external contract
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

**2. ReentrancyGuard của OpenZeppelin:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ✅ CÁCH 2: Sử dụng ReentrancyGuard
contract SafeBankWithGuard is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // nonReentrant modifier ngăn chặn reentrancy
    function withdraw() public nonReentrant {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

#### 🧪 Test Reentrancy Attack

```javascript
// File: test/reentrancy.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy Attack", function () {
  let vulnerableBank, safeBank, attacker;
  let owner, user1, hacker;

  beforeEach(async function () {
    [owner, user1, hacker] = await ethers.getSigners();

    // Deploy vulnerable bank
    const VulnerableBank = await ethers.getContractFactory("VulnerableBank");
    vulnerableBank = await VulnerableBank.deploy();

    // Deploy safe bank
    const SafeBank = await ethers.getContractFactory("SafeBank");
    safeBank = await SafeBank.deploy();

    // Deposit vào vulnerable bank
    await vulnerableBank
      .connect(user1)
      .deposit({ value: ethers.parseEther("10") });
  });

  it("Should be vulnerable to reentrancy attack", async function () {
    // Deploy attacker contract
    const Attacker = await ethers.getContractFactory("Attacker");
    attacker = await Attacker.deploy(await vulnerableBank.getAddress());

    const bankBalanceBefore = await ethers.provider.getBalance(
      await vulnerableBank.getAddress()
    );
    console.log("Bank balance before:", ethers.formatEther(bankBalanceBefore));

    // Attacker deposits 1 ETH và tấn công
    await attacker.connect(hacker).attack({ value: ethers.parseEther("1") });

    const bankBalanceAfter = await ethers.provider.getBalance(
      await vulnerableBank.getAddress()
    );
    const attackerBalance = await attacker.getBalance();

    console.log("Bank balance after:", ethers.formatEther(bankBalanceAfter));
    console.log("Attacker balance:", ethers.formatEther(attackerBalance));
    console.log("Attack count:", await attacker.attackCount());

    // Bank đã bị rút cạn
    expect(bankBalanceAfter).to.equal(0);
    expect(attackerBalance).to.be.gt(ethers.parseEther("1"));
  });

  it("Should be safe from reentrancy attack", async function () {
    // Deposit vào safe bank
    await safeBank.connect(user1).deposit({ value: ethers.parseEther("10") });

    // Deploy attacker contract targeting safe bank
    const Attacker = await ethers.getContractFactory("Attacker");
    attacker = await Attacker.deploy(await safeBank.getAddress());

    // Tấn công sẽ THẤT BẠI
    await expect(
      attacker.connect(hacker).attack({ value: ethers.parseEther("1") })
    ).to.be.reverted;
  });
});
```

#### 🔍 Phân tích chi tiết Reentrancy

**Tại sao Reentrancy nguy hiểm?**

1. **State chưa được cập nhật:** Contract chuyển tiền trước khi cập nhật balance
2. **External call trigger code:** `call()` có thể trigger code của contract khác
3. **Recursive calls:** Attacker gọi lại hàm withdraw nhiều lần
4. **Gas limit:** Chỉ dừng khi hết gas hoặc contract hết tiền

**Timeline của cuộc tấn công:**

```
Block 1:
  Attacker.attack() gọi Bank.deposit(1 ETH)
  → Bank.balances[Attacker] = 1 ETH

Block 2:
  Attacker.attack() gọi Bank.withdraw()

  Lần 1:
    ├─ Bank kiểm tra: balances[Attacker] = 1 ETH ✓
    ├─ Bank gửi 1 ETH cho Attacker
    ├─ Attacker.receive() được trigger
    │   └─ Attacker gọi lại Bank.withdraw() (REENTRANCY!)
    │
    │   Lần 2 (nested):
    │     ├─ Bank kiểm tra: balances[Attacker] = 1 ETH ✓ (chưa cập nhật!)
    │     ├─ Bank gửi 1 ETH cho Attacker
    │     ├─ Attacker.receive() được trigger
    │     │   └─ Attacker gọi lại Bank.withdraw()
    │     │
    │     │   Lần 3 (nested):
    │     │     ├─ Bank kiểm tra: balances[Attacker] = 1 ETH ✓
    │     │     ├─ Bank gửi 1 ETH cho Attacker
    │     │     └─ ... (lặp lại cho đến khi Bank hết tiền)
    │     │
    │     └─ Bank.balances[Attacker] = 0 (quá muộn!)
    │
    └─ Bank.balances[Attacker] = 0 (quá muộn!)
```

**Các dạng Reentrancy:**

1. **Single-Function Reentrancy:** Gọi lại cùng 1 hàm
2. **Cross-Function Reentrancy:** Gọi hàm khác trong cùng contract
3. **Cross-Contract Reentrancy:** Gọi hàm của contract khác

**Ví dụ Cross-Function Reentrancy:**

```solidity
// ❌ LỖ HỔNG: Cross-Function Reentrancy
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function withdraw() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");

        // Chuyển tiền trước
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success);

        // Cập nhật sau (SAI!)
        balances[msg.sender] = 0;
    }

    // Hàm khác cũng có thể bị exploit
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Attacker có thể gọi withdraw() từ đây
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**Best Practices để tránh Reentrancy:**

1. ✅ **Checks-Effects-Interactions Pattern** (Khuyến nghị nhất)
2. ✅ **ReentrancyGuard** từ OpenZeppelin
3. ✅ **Pull over Push:** Để user tự rút thay vì tự động gửi
4. ✅ **Mutex locks:** Sử dụng state variable để lock
5. ✅ **Gas limits:** Dùng `transfer()` hoặc `send()` thay vì `call()`

**Pull over Push Pattern:**

```solidity
// ✅ AN TOÀN: Pull Payment Pattern
contract SafeBank {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public pendingWithdrawals;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // Bước 1: Request withdrawal
    function requestWithdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Cập nhật state trước
        balances[msg.sender] -= amount;
        pendingWithdrawals[msg.sender] += amount;
    }

    // Bước 2: User tự rút (pull)
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");

        // Cập nhật state trước
        pendingWithdrawals[msg.sender] = 0;

        // Chuyển tiền sau
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

**Các vụ hack nổi tiếng do Reentrancy:**

1. **The DAO (2016):** $60 triệu USD - Dẫn đến Ethereum hard fork
2. **Lendf.Me (2020):** $25 triệu USD
3. **Cream Finance (2021):** $130 triệu USD

---

### 5.2. Access Control (Phân quyền)

Không phải ai cũng được gọi các hàm nhạy cảm. Cần có cơ chế phân quyền rõ ràng.

#### 🔐 Ownable Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is Ownable {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    // Constructor tự động set deployer làm owner
    constructor() Ownable(msg.sender) {}

    // Chỉ owner mới được mint token
    function mint(address to, uint256 amount) public onlyOwner {
        balances[to] += amount;
        totalSupply += amount;
    }

    // Chỉ owner mới được burn token
    function burn(address from, uint256 amount) public onlyOwner {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
    }

    // Chỉ owner mới được chuyển quyền sở hữu
    // Hàm transferOwnership() đã có sẵn từ Ownable
}
```

#### 🎭 Role-Based Access Control (RBAC)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdvancedToken is AccessControl {
    // Định nghĩa các roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    bool public paused;

    constructor() {
        // Deployer là admin mặc định
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Admin có thể cấp các roles khác
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // Chỉ MINTER_ROLE mới được mint
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(!paused, "Contract is paused");
        balances[to] += amount;
        totalSupply += amount;
    }

    // Chỉ BURNER_ROLE mới được burn
    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        require(!paused, "Contract is paused");
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
    }

    // Chỉ PAUSER_ROLE mới được pause/unpause
    function pause() public onlyRole(PAUSER_ROLE) {
        paused = true;
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        paused = false;
    }

    // Admin có thể cấp role cho địa chỉ khác
    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    // Admin có thể thu hồi role
    function revokeMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }
}
```

#### 🔒 Custom Access Control

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CustomAccessControl {
    address public owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public moderators;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender] || msg.sender == owner, "Not admin");
        _;
    }

    modifier onlyModerator() {
        require(
            moderators[msg.sender] || admins[msg.sender] || msg.sender == owner,
            "Not moderator"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // Owner functions
    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    function addAdmin(address account) public onlyOwner {
        admins[account] = true;
    }

    function removeAdmin(address account) public onlyOwner {
        admins[account] = false;
    }

    // Admin functions
    function addModerator(address account) public onlyAdmin {
        moderators[account] = true;
    }

    function removeModerator(address account) public onlyAdmin {
        moderators[account] = false;
    }

    // Moderator functions
    function moderateContent(uint256 contentId) public onlyModerator {
        // Moderate logic
    }
}
```

#### 🔍 Phân tích chi tiết Access Control

**Tại sao Access Control quan trọng?**

1. **Bảo vệ hàm nhạy cảm:** Mint, burn, pause, upgrade
2. **Phân quyền rõ ràng:** Ai được làm gì
3. **Giảm rủi ro:** Ngăn chặn unauthorized access
4. **Compliance:** Đáp ứng yêu cầu pháp lý

**So sánh các pattern Access Control:**

| Pattern           | Use Case                     | Ưu điểm                | Nhược điểm                           |
| ----------------- | ---------------------------- | ---------------------- | ------------------------------------ |
| **Ownable**       | Simple contracts, 1 admin    | Đơn giản, gas rẻ       | Chỉ 1 owner, single point of failure |
| **AccessControl** | Complex systems, nhiều roles | Linh hoạt, mở rộng tốt | Phức tạp hơn, gas đắt hơn            |
| **Custom**        | Specific requirements        | Tùy chỉnh hoàn toàn    | Phải tự implement, dễ lỗi            |

**Ví dụ thực tế: DeFi Protocol với Multi-Role:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DeFiProtocol is AccessControl, Pausable {
    // Định nghĩa roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant TREASURY_ROLE = keccak256("TREASURY_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    uint256 public fee = 100; // 1% = 100 basis points
    address public treasury;

    // Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;

        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Admin có thể grant/revoke tất cả roles
        _setRoleAdmin(OPERATOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(TREASURY_ROLE, ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(UPGRADER_ROLE, ADMIN_ROLE);
    }

    // === ADMIN FUNCTIONS ===

    function setFee(uint256 newFee) external onlyRole(ADMIN_ROLE) {
        require(newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = fee;
        fee = newFee;
        emit FeeUpdated(oldFee, newFee);
    }

    function setTreasury(address newTreasury) external onlyRole(ADMIN_ROLE) {
        require(newTreasury != address(0), "Invalid address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    // === OPERATOR FUNCTIONS ===

    function mint(address to, uint256 amount) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(to != address(0), "Invalid address");
        balances[to] += amount;
        totalSupply += amount;
    }

    function burn(address from, uint256 amount) external onlyRole(OPERATOR_ROLE) whenNotPaused {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
    }

    // === TREASURY FUNCTIONS ===

    function withdrawFees() external onlyRole(TREASURY_ROLE) {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");

        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // === PAUSER FUNCTIONS ===

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // === PUBLIC FUNCTIONS ===

    function transfer(address to, uint256 amount) external whenNotPaused {
        require(to != address(0), "Invalid address");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Tính phí
        uint256 feeAmount = (amount * fee) / 10000;
        uint256 transferAmount = amount - feeAmount;

        balances[msg.sender] -= amount;
        balances[to] += transferAmount;
        balances[treasury] += feeAmount;
    }

    // === VIEW FUNCTIONS ===

    function hasRole(bytes32 role, address account) public view override returns (bool) {
        return super.hasRole(role, account);
    }

    function getRoleAdmin(bytes32 role) public view override returns (bytes32) {
        return super.getRoleAdmin(role);
    }
}
```

**Test Access Control:**

```javascript
// File: test/access-control.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Access Control", function () {
  let protocol;
  let owner, admin, operator, treasury, pauser, user;

  beforeEach(async function () {
    [owner, admin, operator, treasury, pauser, user] =
      await ethers.getSigners();

    const DeFiProtocol = await ethers.getContractFactory("DeFiProtocol");
    protocol = await DeFiProtocol.deploy(treasury.address);

    // Grant roles
    const ADMIN_ROLE = await protocol.ADMIN_ROLE();
    const OPERATOR_ROLE = await protocol.OPERATOR_ROLE();
    const PAUSER_ROLE = await protocol.PAUSER_ROLE();

    await protocol.grantRole(OPERATOR_ROLE, operator.address);
    await protocol.grantRole(PAUSER_ROLE, pauser.address);
  });

  describe("Role Management", function () {
    it("Should grant and revoke roles correctly", async function () {
      const OPERATOR_ROLE = await protocol.OPERATOR_ROLE();

      // Check role
      expect(await protocol.hasRole(OPERATOR_ROLE, operator.address)).to.be
        .true;

      // Revoke role
      await protocol.revokeRole(OPERATOR_ROLE, operator.address);
      expect(await protocol.hasRole(OPERATOR_ROLE, operator.address)).to.be
        .false;
    });

    it("Should prevent unauthorized access", async function () {
      // User không có OPERATOR_ROLE không thể mint
      await expect(
        protocol.connect(user).mint(user.address, 1000)
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("Operator Functions", function () {
    it("Should allow operator to mint", async function () {
      await protocol.connect(operator).mint(user.address, 1000);
      expect(await protocol.balances(user.address)).to.equal(1000);
    });

    it("Should allow operator to burn", async function () {
      await protocol.connect(operator).mint(user.address, 1000);
      await protocol.connect(operator).burn(user.address, 500);
      expect(await protocol.balances(user.address)).to.equal(500);
    });
  });

  describe("Pauser Functions", function () {
    it("Should allow pauser to pause", async function () {
      await protocol.connect(pauser).pause();
      expect(await protocol.paused()).to.be.true;

      // Mint bị block khi paused
      await expect(
        protocol.connect(operator).mint(user.address, 1000)
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update fee", async function () {
      await protocol.setFee(200); // 2%
      expect(await protocol.fee()).to.equal(200);
    });

    it("Should prevent setting fee too high", async function () {
      await expect(
        protocol.setFee(1001) // > 10%
      ).to.be.revertedWith("Fee too high");
    });
  });
});
```

**Best Practices cho Access Control:**

1. ✅ **Principle of Least Privilege:** Chỉ cấp quyền tối thiểu cần thiết
2. ✅ **Role Separation:** Tách biệt roles rõ ràng (admin ≠ operator)
3. ✅ **Multi-sig cho Admin:** Dùng Gnosis Safe cho admin role
4. ✅ **Timelock cho Critical Functions:** Delay khi thay đổi quan trọng
5. ✅ **Event Logging:** Log tất cả thay đổi quyền
6. ✅ **Emergency Roles:** Có role riêng cho emergency (pause)
7. ✅ **Role Hierarchy:** Admin > Operator > User
8. ✅ **Revoke Unused Roles:** Thu hồi roles không dùng

**Common Mistakes:**

```solidity
// ❌ SAI: Không check address(0)
function transferOwnership(address newOwner) public onlyOwner {
    owner = newOwner; // Có thể set owner = address(0)!
}

// ✅ ĐÚNG: Check address(0)
function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0), "Invalid address");
    owner = newOwner;
}

// ❌ SAI: Không emit event
function addAdmin(address account) public onlyOwner {
    admins[account] = true;
}

// ✅ ĐÚNG: Emit event
function addAdmin(address account) public onlyOwner {
    admins[account] = true;
    emit AdminAdded(account, msg.sender);
}

// ❌ SAI: Hardcode addresses
address public admin = 0x123...;

// ✅ ĐÚNG: Set trong constructor
constructor(address _admin) {
    require(_admin != address(0), "Invalid admin");
    admin = _admin;
}
```

**Timelock Pattern cho Admin Functions:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TimelockAdmin {
    address public owner;
    address public pendingOwner;
    uint256 public transferDelay = 2 days;
    uint256 public transferRequestTime;

    event OwnershipTransferRequested(address indexed from, address indexed to, uint256 executeTime);
    event OwnershipTransferred(address indexed from, address indexed to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Bước 1: Request transfer (phải đợi 2 ngày)
    function requestOwnershipTransfer(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        pendingOwner = newOwner;
        transferRequestTime = block.timestamp;

        emit OwnershipTransferRequested(owner, newOwner, block.timestamp + transferDelay);
    }

    // Bước 2: Execute transfer (sau 2 ngày)
    function executeOwnershipTransfer() external {
        require(pendingOwner != address(0), "No pending transfer");
        require(block.timestamp >= transferRequestTime + transferDelay, "Too early");
        require(msg.sender == pendingOwner, "Not pending owner");

        address oldOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        transferRequestTime = 0;

        emit OwnershipTransferred(oldOwner, owner);
    }

    // Cancel transfer
    function cancelOwnershipTransfer() external onlyOwner {
        pendingOwner = address(0);
        transferRequestTime = 0;
    }
}
```

---

### 5.3. Pausable (Cơ chế tạm dừng)

Khi phát hiện lỗi hoặc bị tấn công, cần có khả năng "đóng băng" contract ngay lập tức.

#### ⏸️ Pausable Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PausableToken is Pausable, Ownable {
    mapping(address => uint256) public balances;

    constructor() Ownable(msg.sender) {}

    // Chỉ owner mới được pause
    function pause() public onlyOwner {
        _pause();
    }

    // Chỉ owner mới được unpause
    function unpause() public onlyOwner {
        _unpause();
    }

    // Transfer bị block khi paused
    function transfer(address to, uint256 amount) public whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    // Mint vẫn hoạt động khi paused (emergency mint)
    function emergencyMint(address to, uint256 amount) public onlyOwner {
        balances[to] += amount;
    }
}
```

#### 🚨 Circuit Breaker Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CircuitBreaker {
    address public owner;
    bool public stopped;

    // Withdrawal limits
    uint256 public dailyLimit = 100 ether;
    uint256 public withdrawnToday;
    uint256 public lastWithdrawDay;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier stopInEmergency() {
        require(!stopped, "Contract is stopped");
        _;
    }

    modifier onlyInEmergency() {
        require(stopped, "Not in emergency");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Kích hoạt circuit breaker
    function toggleCircuitBreaker() public onlyOwner {
        stopped = !stopped;
    }

    // Hàm bình thường - bị block khi emergency
    function withdraw(uint256 amount) public stopInEmergency {
        // Reset daily counter nếu sang ngày mới
        if (block.timestamp / 1 days > lastWithdrawDay) {
            withdrawnToday = 0;
            lastWithdrawDay = block.timestamp / 1 days;
        }

        // Kiểm tra daily limit
        require(withdrawnToday + amount <= dailyLimit, "Daily limit exceeded");

        withdrawnToday += amount;

        // Withdraw logic...
    }

    // Hàm emergency - chỉ hoạt động khi stopped
    function emergencyWithdraw() public onlyInEmergency {
        // Emergency withdraw logic...
    }
}
```

#### 🔍 Phân tích chi tiết Pausable Pattern

**Tại sao cần Pausable?**

1. **Emergency Response:** Dừng contract khi phát hiện lỗi/tấn công
2. **Maintenance:** Tạm dừng khi upgrade
3. **Compliance:** Đáp ứng yêu cầu pháp lý (freeze assets)
4. **Damage Control:** Giảm thiểu thiệt hại khi có sự cố

**Các loại Pause:**

1. **Full Pause:** Dừng tất cả functions
2. **Partial Pause:** Chỉ dừng một số functions nhất định
3. **Selective Pause:** Dừng theo role hoặc address
4. **Automatic Pause:** Tự động pause khi phát hiện anomaly

**Ví dụ Advanced Pausable:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdvancedPausable is Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");

    // Pause reasons
    enum PauseReason {
        None,
        Maintenance,
        SecurityIssue,
        Upgrade,
        Regulatory,
        Emergency
    }

    PauseReason public currentPauseReason;
    uint256 public pausedAt;
    uint256 public minPauseDuration = 1 hours;

    // Selective pause
    mapping(address => bool) public userPaused;
    mapping(bytes4 => bool) public functionPaused; // function selector => paused

    // Events
    event Paused(address account, PauseReason reason);
    event Unpaused(address account);
    event UserPaused(address user, address by);
    event UserUnpaused(address user, address by);
    event FunctionPaused(bytes4 selector, address by);
    event FunctionUnpaused(bytes4 selector, address by);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UNPAUSER_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
    }

    // === PAUSE FUNCTIONS ===

    function pause(PauseReason reason) external onlyRole(PAUSER_ROLE) {
        _pause();
        currentPauseReason = reason;
        pausedAt = block.timestamp;
        emit Paused(msg.sender, reason);
    }

    function unpause() external onlyRole(UNPAUSER_ROLE) {
        require(
            block.timestamp >= pausedAt + minPauseDuration,
            "Min pause duration not met"
        );
        _unpause();
        currentPauseReason = PauseReason.None;
        pausedAt = 0;
        emit Unpaused(msg.sender);
    }

    // Emergency pause - không cần chờ min duration
    function emergencyPause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
        currentPauseReason = PauseReason.Emergency;
        pausedAt = block.timestamp;
        emit Paused(msg.sender, PauseReason.Emergency);
    }

    // Emergency unpause
    function emergencyUnpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
        currentPauseReason = PauseReason.None;
        pausedAt = 0;
        emit Unpaused(msg.sender);
    }

    // === SELECTIVE PAUSE ===

    function pauseUser(address user) external onlyRole(PAUSER_ROLE) {
        require(!userPaused[user], "User already paused");
        userPaused[user] = true;
        emit UserPaused(user, msg.sender);
    }

    function unpauseUser(address user) external onlyRole(UNPAUSER_ROLE) {
        require(userPaused[user], "User not paused");
        userPaused[user] = false;
        emit UserUnpaused(user, msg.sender);
    }

    function pauseFunction(bytes4 selector) external onlyRole(PAUSER_ROLE) {
        require(!functionPaused[selector], "Function already paused");
        functionPaused[selector] = true;
        emit FunctionPaused(selector, msg.sender);
    }

    function unpauseFunction(bytes4 selector) external onlyRole(UNPAUSER_ROLE) {
        require(functionPaused[selector], "Function not paused");
        functionPaused[selector] = false;
        emit FunctionUnpaused(selector, msg.sender);
    }

    // === MODIFIERS ===

    modifier whenUserNotPaused(address user) {
        require(!userPaused[user], "User is paused");
        _;
    }

    modifier whenFunctionNotPaused() {
        require(!functionPaused[msg.sig], "Function is paused");
        _;
    }

    // === EXAMPLE FUNCTIONS ===

    mapping(address => uint256) public balances;

    // Bị pause khi contract pause
    function transfer(address to, uint256 amount)
        external
        whenNotPaused
        whenUserNotPaused(msg.sender)
        whenFunctionNotPaused
    {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    // Không bị pause (emergency function)
    function emergencyWithdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");
        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // View functions không bị pause
    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }
}
```

**Automatic Circuit Breaker với Anomaly Detection:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AutoCircuitBreaker is Pausable, Ownable {
    // Thresholds
    uint256 public maxWithdrawPerTx = 100 ether;
    uint256 public maxWithdrawPerHour = 1000 ether;
    uint256 public maxFailedTxPerHour = 10;

    // Tracking
    uint256 public withdrawnThisHour;
    uint256 public failedTxThisHour;
    uint256 public currentHour;

    // Events
    event AnomalyDetected(string reason, uint256 value);
    event AutoPaused(string reason);

    constructor() Ownable(msg.sender) {
        currentHour = block.timestamp / 1 hours;
    }

    function withdraw(uint256 amount) external whenNotPaused {
        // Reset counters nếu sang giờ mới
        uint256 hour = block.timestamp / 1 hours;
        if (hour > currentHour) {
            withdrawnThisHour = 0;
            failedTxThisHour = 0;
            currentHour = hour;
        }

        // Check anomalies
        if (amount > maxWithdrawPerTx) {
            emit AnomalyDetected("Large withdrawal", amount);
            _autoPause("Large withdrawal detected");
            revert("Paused due to anomaly");
        }

        if (withdrawnThisHour + amount > maxWithdrawPerHour) {
            emit AnomalyDetected("Hourly limit exceeded", withdrawnThisHour + amount);
            _autoPause("Hourly withdrawal limit exceeded");
            revert("Paused due to anomaly");
        }

        withdrawnThisHour += amount;

        // Withdraw logic...
        bool success = _executeWithdraw(msg.sender, amount);

        if (!success) {
            failedTxThisHour++;

            if (failedTxThisHour >= maxFailedTxPerHour) {
                emit AnomalyDetected("Too many failed transactions", failedTxThisHour);
                _autoPause("Too many failed transactions");
            }

            revert("Withdrawal failed");
        }
    }

    function _autoPause(string memory reason) internal {
        _pause();
        emit AutoPaused(reason);
    }

    function _executeWithdraw(address to, uint256 amount) internal returns (bool) {
        // Withdrawal logic
        return true;
    }

    // Manual controls
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function updateThresholds(
        uint256 _maxWithdrawPerTx,
        uint256 _maxWithdrawPerHour,
        uint256 _maxFailedTxPerHour
    ) external onlyOwner {
        maxWithdrawPerTx = _maxWithdrawPerTx;
        maxWithdrawPerHour = _maxWithdrawPerHour;
        maxFailedTxPerHour = _maxFailedTxPerHour;
    }
}
```

**Test Pausable:**

```javascript
// File: test/pausable.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pausable Pattern", function () {
  let contract;
  let owner, pauser, user;

  beforeEach(async function () {
    [owner, pauser, user] = await ethers.getSigners();

    const AdvancedPausable = await ethers.getContractFactory(
      "AdvancedPausable"
    );
    contract = await AdvancedPausable.deploy();

    const PAUSER_ROLE = await contract.PAUSER_ROLE();
    await contract.grantRole(PAUSER_ROLE, pauser.address);

    // Setup balances
    await contract
      .connect(owner)
      .emergencyWithdraw({ value: ethers.parseEther("10") });
  });

  describe("Full Pause", function () {
    it("Should pause all pausable functions", async function () {
      await contract.connect(pauser).pause(1); // Maintenance

      expect(await contract.paused()).to.be.true;

      await expect(
        contract.connect(user).transfer(owner.address, 100)
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow unpause after min duration", async function () {
      await contract.connect(pauser).pause(1);

      // Không thể unpause ngay
      await expect(contract.connect(pauser).unpause()).to.be.revertedWith(
        "Min pause duration not met"
      );

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      // Giờ có thể unpause
      await contract.connect(pauser).unpause();
      expect(await contract.paused()).to.be.false;
    });
  });

  describe("Selective Pause", function () {
    it("Should pause specific user", async function () {
      await contract.connect(pauser).pauseUser(user.address);

      expect(await contract.userPaused(user.address)).to.be.true;

      await expect(
        contract.connect(user).transfer(owner.address, 100)
      ).to.be.revertedWith("User is paused");
    });

    it("Should pause specific function", async function () {
      const transferSelector =
        contract.interface.getFunction("transfer").selector;

      await contract.connect(pauser).pauseFunction(transferSelector);

      await expect(
        contract.connect(user).transfer(owner.address, 100)
      ).to.be.revertedWith("Function is paused");
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency pause without min duration", async function () {
      const EMERGENCY_ROLE = await contract.EMERGENCY_ROLE();
      await contract.grantRole(EMERGENCY_ROLE, owner.address);

      await contract.emergencyPause();
      expect(await contract.paused()).to.be.true;

      // Có thể unpause ngay
      await contract.emergencyUnpause();
      expect(await contract.paused()).to.be.false;
    });

    it("Should allow emergency withdraw even when paused", async function () {
      await contract.connect(pauser).pause(1);

      // Emergency withdraw vẫn hoạt động
      await expect(contract.connect(user).emergencyWithdraw()).to.not.be
        .reverted;
    });
  });
});
```

**Best Practices cho Pausable:**

1. ✅ **Separate Pause/Unpause Roles:** Pauser ≠ Unpauser
2. ✅ **Min Pause Duration:** Tránh pause/unpause liên tục
3. ✅ **Emergency Functions:** Một số functions không bị pause
4. ✅ **Pause Reasons:** Log lý do pause
5. ✅ **Automatic Pause:** Tự động pause khi phát hiện anomaly
6. ✅ **Selective Pause:** Pause theo user/function thay vì toàn bộ
7. ✅ **Multi-sig cho Unpause:** Cần nhiều người approve
8. ✅ **Notification:** Thông báo users khi pause

**Khi nào nên Pause?**

- 🚨 Phát hiện lỗ hổng bảo mật
- 🚨 Bị tấn công đang diễn ra
- 🚨 Phát hiện bug critical
- 🚨 Anomaly trong transaction patterns
- 🔧 Maintenance/upgrade
- ⚖️ Yêu cầu pháp lý

**Khi nào KHÔNG nên Pause?**

- ❌ Để manipulate market
- ❌ Để prevent legitimate transactions
- ❌ Vì lý do cá nhân
- ❌ Không có lý do rõ ràng

---

### 5.4. Integer Overflow/Underflow

Trước Solidity 0.8.0, phép toán số nguyên có thể bị overflow/underflow mà không báo lỗi.

#### ⚠️ Lỗ hổng Overflow/Underflow (Solidity < 0.8.0)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0; // Version cũ

// ❌ CÓ LỖ HỔNG với Solidity < 0.8.0
contract VulnerableCounter {
    uint8 public count = 255;

    function increment() public {
        count++; // Overflow: 255 + 1 = 0 (không báo lỗi!)
    }

    function decrement() public {
        count--; // Underflow: 0 - 1 = 255 (không báo lỗi!)
    }
}
```

#### ✅ Giải pháp

**1. Sử dụng Solidity >= 0.8.0 (Tự động check):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ✅ AN TOÀN với Solidity >= 0.8.0
contract SafeCounter {
    uint8 public count = 255;

    function increment() public {
        count++; // Tự động revert nếu overflow
    }

    function decrement() public {
        count--; // Tự động revert nếu underflow
    }
}
```

**2. Sử dụng SafeMath (Solidity < 0.8.0):**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SafeCounterOld {
    using SafeMath for uint256;

    uint256 public count;

    function increment() public {
        count = count.add(1); // Revert nếu overflow
    }

    function decrement() public {
        count = count.sub(1); // Revert nếu underflow
    }
}
```

---

### 5.5. Front-Running Attack

Front-running xảy ra khi attacker xem transaction pending và gửi transaction với gas price cao hơn để được xử lý trước.

#### 🏃 Ví dụ Front-Running

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ❌ DỄ BỊ FRONT-RUNNING
contract VulnerableAuction {
    address public highestBidder;
    uint256 public highestBid;

    function bid() public payable {
        require(msg.value > highestBid, "Bid too low");

        // Hoàn tiền cho bidder cũ
        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid);
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
    }
}

// Attacker có thể:
// 1. Xem transaction bid của victim trong mempool
// 2. Gửi transaction bid với gas price cao hơn
// 3. Transaction của attacker được xử lý trước
// 4. Victim bị outbid
```

#### ✅ Giải pháp: Commit-Reveal Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SecureAuction {
    struct Bid {
        bytes32 commitment;
        uint256 deposit;
        bool revealed;
    }

    mapping(address => Bid) public bids;
    address public highestBidder;
    uint256 public highestBid;

    uint256 public commitPhaseEnd;
    uint256 public revealPhaseEnd;

    constructor(uint256 commitDuration, uint256 revealDuration) {
        commitPhaseEnd = block.timestamp + commitDuration;
        revealPhaseEnd = commitPhaseEnd + revealDuration;
    }

    // Phase 1: Commit (gửi hash của bid)
    function commitBid(bytes32 commitment) public payable {
        require(block.timestamp < commitPhaseEnd, "Commit phase ended");
        require(bids[msg.sender].commitment == bytes32(0), "Already committed");

        bids[msg.sender] = Bid({
            commitment: commitment,
            deposit: msg.value,
            revealed: false
        });
    }

    // Phase 2: Reveal (tiết lộ bid thực)
    function revealBid(uint256 amount, bytes32 secret) public {
        require(block.timestamp >= commitPhaseEnd, "Commit phase not ended");
        require(block.timestamp < revealPhaseEnd, "Reveal phase ended");

        Bid storage bid = bids[msg.sender];
        require(!bid.revealed, "Already revealed");

        // Verify commitment
        bytes32 commitment = keccak256(abi.encodePacked(amount, secret));
        require(commitment == bid.commitment, "Invalid reveal");

        bid.revealed = true;

        // Check if highest bid
        if (amount > highestBid && bid.deposit >= amount) {
            highestBidder = msg.sender;
            highestBid = amount;
        }
    }

    // Phase 3: Withdraw (rút tiền)
    function withdraw() public {
        require(block.timestamp >= revealPhaseEnd, "Auction not ended");

        Bid storage bid = bids[msg.sender];
        require(bid.deposit > 0, "No deposit");

        uint256 refund;
        if (msg.sender == highestBidder) {
            // Winner nhận lại phần thừa
            refund = bid.deposit - highestBid;
        } else {
            // Loser nhận lại toàn bộ
            refund = bid.deposit;
        }

        bid.deposit = 0;
        payable(msg.sender).transfer(refund);
    }
}
```

---

### 5.6. Các lỗ hổng phổ biến khác

#### 🔓 Unprotected Functions

```solidity
// ❌ SAI: Hàm nhạy cảm không có access control
contract Vulnerable {
    address public owner;

    function setOwner(address newOwner) public {
        owner = newOwner; // Ai cũng có thể đổi owner!
    }
}

// ✅ ĐÚNG: Thêm access control
contract Safe {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setOwner(address newOwner) public onlyOwner {
        owner = newOwner;
    }
}
```

#### 💸 Unchecked External Calls

```solidity
// ❌ SAI: Không check kết quả của external call
contract Vulnerable {
    function sendEther(address payable recipient) public payable {
        recipient.send(msg.value); // Không check return value!
    }
}

// ✅ ĐÚNG: Check kết quả
contract Safe {
    function sendEther(address payable recipient) public payable {
        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "Transfer failed");
    }
}
```

#### 🎲 Weak Randomness

```solidity
// ❌ SAI: Sử dụng block data làm random (có thể predict)
contract VulnerableRandom {
    function random() public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
    }
}

// ✅ ĐÚNG: Sử dụng Chainlink VRF
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract SafeRandom is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;

    function getRandomNumber() public returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness;
    }
}
```

---

### 📝 Tổng kết Phần 5

**Những điều quan trọng cần nhớ:**

1. **Reentrancy:**

   - Lỗ hổng nguy hiểm nhất
   - Sử dụng Checks-Effects-Interactions pattern
   - Dùng ReentrancyGuard của OpenZeppelin
   - Cập nhật state TRƯỚC KHI gọi external contract

2. **Access Control:**

   - Sử dụng Ownable cho quyền đơn giản
   - Sử dụng AccessControl (RBAC) cho quyền phức tạp
   - Luôn protect các hàm nhạy cảm
   - Test kỹ access control logic

3. **Pausable:**

   - Implement emergency stop mechanism
   - Chỉ owner/admin mới được pause
   - Cân nhắc kỹ hàm nào cần pause
   - Test pause/unpause logic

4. **Integer Overflow/Underflow:**

   - Sử dụng Solidity >= 0.8.0 (tự động check)
   - Hoặc dùng SafeMath cho version cũ
   - Cẩn thận với unchecked blocks

5. **Front-Running:**

   - Sử dụng Commit-Reveal pattern
   - Implement time-locks
   - Cân nhắc sử dụng private transactions

6. **Best Practices:**
   - Luôn validate input
   - Check return values của external calls
   - Không dùng block data làm random
   - Audit code trước khi deploy
   - Sử dụng OpenZeppelin contracts
   - Test coverage > 90%
   - Bug bounty program

---

## Phần 6: Bài tập tổng hợp

Trong phần này, chúng ta sẽ xây dựng một ứng dụng hoàn chỉnh từ đầu đến cuối, bao gồm:

1. **Tạo Smart Contract ERC20**
2. **Deploy lên testnet**
3. **Xây dựng Frontend để tương tác**
4. **Test chuyển tiền**

---

### 6.1. Tạo Smart Contract ERC20

#### 📋 Yêu cầu

Tạo một token có tên **TLCoin (TLC)** với các tính năng:

- Tuân thủ chuẩn ERC20
- Có thể mint (chỉ owner)
- Có thể burn (bất kỳ ai)
- Có thể pause/unpause (chỉ owner)
- Có event logging đầy đủ

#### 🔧 Bước 1: Setup môi trường

**Cài đặt Hardhat:**

```bash
mkdir tl-token
cd tl-token
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Chọn: **Create a JavaScript project**

**Cài đặt OpenZeppelin:**

```bash
npm install @openzeppelin/contracts
```

#### 📝 Bước 2: Viết Smart Contract

Tạo file `contracts/TLCoin.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TLCoin
 * @dev ERC20 Token với tính năng mint, burn và pause
 */
contract TLCoin is ERC20, ERC20Burnable, Ownable, Pausable {
    // Events
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 1 tỷ token
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10 ** 18; // 100 triệu token

    /**
     * @dev Constructor
     * @param initialOwner Địa chỉ owner ban đầu
     */
    constructor(
        address initialOwner
    ) ERC20("TLCoin", "TLC") Ownable(initialOwner) {
        // Mint initial supply cho owner
        _mint(initialOwner, INITIAL_SUPPLY);
        emit TokensMinted(initialOwner, INITIAL_SUPPLY, block.timestamp);
    }

    /**
     * @dev Mint token mới (chỉ owner)
     * @param to Địa chỉ nhận token
     * @param amount Số lượng token
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount, block.timestamp);
    }

    /**
     * @dev Burn token (bất kỳ ai có thể burn token của mình)
     * @param amount Số lượng token cần burn
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Burn token từ địa chỉ khác (cần approve trước)
     * @param account Địa chỉ cần burn token
     * @param amount Số lượng token
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount, block.timestamp);
    }

    /**
     * @dev Pause contract (chỉ owner)
     */
    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Unpause contract (chỉ owner)
     */
    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Override _update để thêm pausable logic
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Lấy thông tin chi tiết của token
     */
    function getTokenInfo()
        public
        view
        returns (
            string memory tokenName,
            string memory tokenSymbol,
            uint8 tokenDecimals,
            uint256 tokenTotalSupply,
            uint256 tokenMaxSupply,
            bool isPaused
        )
    {
        return (
            name(),
            symbol(),
            decimals(),
            totalSupply(),
            MAX_SUPPLY,
            paused()
        );
    }
}
```

#### 🔍 Giải thích code:

**1. Kế thừa từ OpenZeppelin:**

```solidity
contract TLCoin is ERC20, ERC20Burnable, Ownable, Pausable
```

- `ERC20`: Cung cấp các hàm cơ bản (transfer, approve, transferFrom)
- `ERC20Burnable`: Thêm hàm burn và burnFrom
- `Ownable`: Quản lý owner
- `Pausable`: Cho phép pause/unpause contract

**2. Constants:**

```solidity
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;
```

- `MAX_SUPPLY`: Giới hạn tổng supply (1 tỷ token)
- `INITIAL_SUPPLY`: Supply ban đầu (100 triệu token)
- Nhân với `10**18` vì ERC20 mặc định có 18 decimals

**3. Constructor:**

```solidity
constructor(address initialOwner)
    ERC20("TLCoin", "TLC")
    Ownable(initialOwner)
```

- Khởi tạo token với tên "TLCoin" và symbol "TLC"
- Set owner ban đầu
- Mint initial supply cho owner

**4. Hàm mint:**

```solidity
function mint(address to, uint256 amount) public onlyOwner {
    require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
    _mint(to, amount);
}
```

- Chỉ owner mới được gọi (`onlyOwner`)
- Kiểm tra không vượt quá MAX_SUPPLY
- Emit event sau khi mint

**5. Override \_update:**

```solidity
function _update(address from, address to, uint256 value)
    internal
    override
    whenNotPaused
{
    super._update(from, to, value);
}
```

- Thêm `whenNotPaused` để block transfer khi contract bị pause
- `_update` là hàm internal được gọi mỗi khi có transfer

#### 🧪 Bước 3: Viết Test

Tạo file `test/TLCoin.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TLCoin", function () {
  let tlCoin;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const TLCoin = await ethers.getContractFactory("TLCoin");
    tlCoin = await TLCoin.deploy(owner.address);
    await tlCoin.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await tlCoin.owner()).to.equal(owner.address);
    });

    it("Should assign the initial supply to the owner", async function () {
      const ownerBalance = await tlCoin.balanceOf(owner.address);
      const initialSupply = ethers.parseEther("100000000"); // 100M
      expect(ownerBalance).to.equal(initialSupply);
    });

    it("Should have correct token info", async function () {
      expect(await tlCoin.name()).to.equal("TLCoin");
      expect(await tlCoin.symbol()).to.equal("TLC");
      expect(await tlCoin.decimals()).to.equal(18);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await tlCoin.mint(addr1.address, mintAmount);

      expect(await tlCoin.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should fail if non-owner tries to mint", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(
        tlCoin.connect(addr1).mint(addr2.address, mintAmount)
      ).to.be.revertedWithCustomError(tlCoin, "OwnableUnauthorizedAccount");
    });

    it("Should not exceed max supply", async function () {
      const maxSupply = ethers.parseEther("1000000000"); // 1B
      const currentSupply = await tlCoin.totalSupply();
      const exceedAmount = maxSupply - currentSupply + ethers.parseEther("1");

      await expect(tlCoin.mint(addr1.address, exceedAmount)).to.be.revertedWith(
        "Exceeds max supply"
      );
    });

    it("Should emit TokensMinted event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await expect(tlCoin.mint(addr1.address, mintAmount))
        .to.emit(tlCoin, "TokensMinted")
        .withArgs(
          addr1.address,
          mintAmount,
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1)
        );
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await tlCoin.mint(addr1.address, mintAmount);

      const burnAmount = ethers.parseEther("500");
      await tlCoin.connect(addr1).burn(burnAmount);

      expect(await tlCoin.balanceOf(addr1.address)).to.equal(
        mintAmount - burnAmount
      );
    });

    it("Should emit TokensBurned event", async function () {
      const mintAmount = ethers.parseEther("1000");
      await tlCoin.mint(addr1.address, mintAmount);

      const burnAmount = ethers.parseEther("500");
      await expect(tlCoin.connect(addr1).burn(burnAmount)).to.emit(
        tlCoin,
        "TokensBurned"
      );
    });
  });

  describe("Transfer", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.parseEther("1000");
      await tlCoin.transfer(addr1.address, transferAmount);

      expect(await tlCoin.balanceOf(addr1.address)).to.equal(transferAmount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialBalance = await tlCoin.balanceOf(addr1.address);
      await expect(
        tlCoin.connect(addr1).transfer(owner.address, ethers.parseEther("1"))
      ).to.be.revertedWithCustomError(tlCoin, "ERC20InsufficientBalance");
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await tlCoin.pause();
      expect(await tlCoin.paused()).to.equal(true);
    });

    it("Should block transfers when paused", async function () {
      await tlCoin.pause();

      await expect(
        tlCoin.transfer(addr1.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(tlCoin, "EnforcedPause");
    });

    it("Should allow owner to unpause", async function () {
      await tlCoin.pause();
      await tlCoin.unpause();
      expect(await tlCoin.paused()).to.equal(false);
    });

    it("Should allow transfers after unpause", async function () {
      await tlCoin.pause();
      await tlCoin.unpause();

      const transferAmount = ethers.parseEther("100");
      await expect(tlCoin.transfer(addr1.address, transferAmount)).to.not.be
        .reverted;
    });
  });
});
```

**Chạy test:**

```bash
npx hardhat test
```

Kết quả mong đợi:

```
  TLCoin
    Deployment
      ✔ Should set the right owner
      ✔ Should assign the initial supply to the owner
      ✔ Should have correct token info
    Minting
      ✔ Should allow owner to mint tokens
      ✔ Should fail if non-owner tries to mint
      ✔ Should not exceed max supply
      ✔ Should emit TokensMinted event
    Burning
      ✔ Should allow users to burn their tokens
      ✔ Should emit TokensBurned event
    Transfer
      ✔ Should transfer tokens between accounts
      ✔ Should fail if sender doesn't have enough tokens
    Pausable
      ✔ Should allow owner to pause
      ✔ Should block transfers when paused
      ✔ Should allow owner to unpause
      ✔ Should allow transfers after unpause

  15 passing (2s)
```

#### 🚀 Bước 4: Deploy lên Testnet

**1. Cấu hình hardhat.config.js:**

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },

  networks: {
    // Localhost network (for testing)
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Sepolia Testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
    },

    // BSC Testnet
    bscTestnet: {
      url:
        process.env.BSC_TESTNET_RPC_URL ||
        "https://data-seed-prebsc-1-s1.binance.org:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 97,
      gasPrice: 10000000000, // 10 Gwei
    },
  },

  // Etherscan verification (V2 API)
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
    customChains: [
      {
        network: "sepolia",
        chainId: 11155111,
        urls: {
          apiURL: "https://api-sepolia.etherscan.io/api",
          browserURL: "https://sepolia.etherscan.io",
        },
      },
    ],
  },

  // Sourcify verification (optional)
  sourcify: {
    enabled: false,
  },

  // Gas reporter (optional)
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },

  // Paths
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  // Mocha timeout
  mocha: {
    timeout: 40000,
  },
};
```

**2. Tạo file `.env`:**

```bash
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

**⚠️ Quan trọng:** Thêm `.env` vào `.gitignore`:

```bash
echo ".env" >> .gitignore
```

**3. Tạo script deploy:**

Tạo file `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying TLCoin...");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const TLCoin = await ethers.getContractFactory("TLCoin");
  const tlCoin = await TLCoin.deploy(deployer.address);

  await tlCoin.waitForDeployment();

  const contractAddress = await tlCoin.getAddress();
  console.log("✅ TLCoin deployed to:", contractAddress);

  // Get token info
  const tokenInfo = await tlCoin.getTokenInfo();
  console.log("\n📊 Token Information:");
  console.log("   Name:", tokenInfo.tokenName);
  console.log("   Symbol:", tokenInfo.tokenSymbol);
  console.log("   Decimals:", tokenInfo.tokenDecimals);
  console.log(
    "   Total Supply:",
    ethers.formatEther(tokenInfo.tokenTotalSupply),
    "TLC"
  );
  console.log(
    "   Max Supply:",
    ethers.formatEther(tokenInfo.tokenMaxSupply),
    "TLC"
  );
  console.log("   Is Paused:", tokenInfo.isPaused);

  // Wait for block confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await tlCoin.deploymentTransaction().wait(5);

  // Verify contract on Etherscan
  console.log("\n🔍 Verifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [deployer.address],
    });
    console.log("✅ Contract verified!");
  } catch (error) {
    console.log("❌ Verification failed:", error.message);
  }

  console.log("\n🎉 Deployment completed!");
  console.log("\n📋 Summary:");
  console.log("   Contract Address:", contractAddress);
  console.log("   Network:", hre.network.name);
  console.log("   Owner:", deployer.address);
  console.log("\n🔗 View on Explorer:");
  if (hre.network.name === "sepolia") {
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
  } else if (hre.network.name === "bscTestnet") {
    console.log(`   https://testnet.bscscan.com/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

**4. Deploy:**

```bash
# Deploy lên Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Hoặc deploy lên BSC Testnet
npx hardhat run scripts/deploy.js --network bscTestnet
```

**5. Lấy testnet token:**

- **Sepolia ETH:** https://sepoliafaucet.com/
- **BSC Testnet BNB:** https://testnet.bnbchain.org/faucet-smart

---

### 6.2. Xây dựng Frontend

Giờ chúng ta sẽ tạo một giao diện web để tương tác với TLCoin.

#### 🎨 Bước 1: Setup React App

```bash
npx create-react-app tl-dapp
cd tl-dapp
npm install ethers
```

#### 📁 Bước 2: Cấu trúc thư mục

```
tl-dapp/
├── src/
│   ├── components/
│   │   ├── WalletConnect.jsx
│   │   ├── TokenInfo.jsx
│   │   ├── TransferForm.jsx
│   │   └── TransactionHistory.jsx
│   ├── contracts/
│   │   └── TLCoin.json  (Copy from artifacts)
│   ├── App.js
│   └── App.css
```

#### 📝 Bước 3: Copy Contract ABI

```bash
# Copy ABI từ Hardhat project
cp ../tl-token/artifacts/contracts/TLCoin.sol/TLCoin.json src/contracts/
```

#### 💻 Bước 4: Viết Components

**1. WalletConnect.jsx:**

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./WalletConnect.css";

function WalletConnect({ onConnect, onDisconnect, currentWallet }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      checkConnection();

      // Listen for account changes
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener(
            "accountsChanged",
            handleAccountsChanged
          );
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, []);

  const checkConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const network = await provider.getNetwork();

        setAccount(address);
        setChainId(Number(network.chainId));

        onConnect({
          account: address,
          signer: signer,
          provider: provider,
          chainId: Number(network.chainId),
        });
      }
    } catch (err) {
      console.error("Error checking connection:", err);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null);
      setChainId(null);
      onDisconnect();
    } else {
      // Account changed
      window.location.reload();
    }
  };

  const handleChainChanged = () => {
    // Reload page when chain changes
    window.location.reload();
  };

  const connectWallet = async () => {
    setError("");

    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    try {
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();
      const networkChainId = Number(network.chainId);

      setAccount(address);
      setChainId(networkChainId);

      // Check if on correct network (Sepolia = 11155111)
      if (networkChainId !== 11155111) {
        setError("⚠️ Please switch to Sepolia Testnet");
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }], // Sepolia chainId in hex
          });
        } catch (switchError) {
          console.error("Error switching network:", switchError);
        }
      }

      onConnect({
        account: address,
        signer: signer,
        provider: provider,
        chainId: networkChainId,
      });
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError(err.message || "Failed to connect wallet");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    setError("");
    onDisconnect();
  };

  const getNetworkName = (chainId) => {
    const networks = {
      1: "Ethereum Mainnet",
      11155111: "Sepolia Testnet",
      97: "BSC Testnet",
      31337: "Localhost",
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  return (
    <div className="wallet-connect">
      {!account ? (
        <div className="connect-section">
          <button onClick={connectWallet} className="connect-btn">
            🦊 Connect Wallet
          </button>
          {error && <div className="error-message">{error}</div>}
        </div>
      ) : (
        <div className="wallet-info">
          <div className="info-row">
            <div className="account-info">
              <span className="label">Account:</span>
              <span className="address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
            <div className="network-info">
              <span className="label">Network:</span>
              <span
                className={`network ${
                  chainId === 11155111 ? "correct" : "wrong"
                }`}
              >
                {getNetworkName(chainId)}
              </span>
            </div>
          </div>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
          {chainId !== 11155111 && (
            <div className="warning">⚠️ Please switch to Sepolia Testnet</div>
          )}
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
```

**2. TokenInfo.jsx:**

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./TokenInfo.css";

// ABI tối thiểu để đọc thông tin token
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function MAX_SUPPLY() view returns (uint256)",
  "function paused() view returns (bool)",
  "function getTokenInfo() view returns (string, string, uint8, uint256, uint256, bool)",
];

function TokenInfo({ wallet, contractAddress }) {
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (wallet && contractAddress) {
      loadTokenInfo();
    }
  }, [wallet, contractAddress]);

  const loadTokenInfo = async () => {
    setLoading(true);
    setError("");

    try {
      const contract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        wallet.provider
      );

      // Load token info
      const [name, symbol, decimals, totalSupply, maxSupply, isPaused] =
        await contract.getTokenInfo();

      // Load user balance
      const balance = await contract.balanceOf(wallet.account);

      setTokenData({
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        maxSupply: ethers.formatUnits(maxSupply, decimals),
        userBalance: ethers.formatUnits(balance, decimals),
        isPaused,
      });
    } catch (err) {
      console.error("Error loading token info:", err);
      setError("Failed to load token information");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="token-info">
        <h2>📊 Token Information</h2>
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="token-info">
        <h2>📊 Token Information</h2>
        <div className="error-message">{error}</div>
        <button onClick={loadTokenInfo} className="refresh-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!tokenData) {
    return null;
  }

  return (
    <div className="token-info">
      <div className="header">
        <h2>📊 Token Information</h2>
        <button onClick={loadTokenInfo} className="refresh-btn" title="Refresh">
          🔄
        </button>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <div className="label">Token Name</div>
          <div className="value">{tokenData.name}</div>
        </div>

        <div className="info-card">
          <div className="label">Symbol</div>
          <div className="value">{tokenData.symbol}</div>
        </div>

        <div className="info-card">
          <div className="label">Decimals</div>
          <div className="value">
            {parseFloat(tokenData.decimals).toLocaleString()}
          </div>
        </div>

        <div className="info-card highlight">
          <div className="label">Your Balance</div>
          <div className="value big">
            {parseFloat(tokenData.userBalance).toLocaleString()}{" "}
            {tokenData.symbol}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Total Supply</div>
          <div className="value">
            {parseFloat(tokenData.totalSupply).toLocaleString()}{" "}
            {tokenData.symbol}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Max Supply</div>
          <div className="value">
            {parseFloat(tokenData.maxSupply).toLocaleString()}{" "}
            {tokenData.symbol}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Contract Status</div>
          <div className={`value ${tokenData.isPaused ? "paused" : "active"}`}>
            {tokenData.isPaused ? "⏸️ Paused" : "✅ Active"}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Supply Percentage</div>
          <div className="value">
            {(
              (parseFloat(tokenData.totalSupply) /
                parseFloat(tokenData.maxSupply)) *
              100
            ).toFixed(2)}
            %
          </div>
        </div>
      </div>
    </div>
  );
}

export default TokenInfo;
```

**3. TransferForm.jsx:**

```javascript
import { useState } from "react";
import { ethers } from "ethers";
import "./TransferForm.css";

const TOKEN_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

function TransferForm({ wallet, contractAddress, onTransferComplete }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Validation
      if (!ethers.isAddress(recipient)) {
        throw new Error("Invalid recipient address");
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error("Invalid amount");
      }

      // Create contract instance with signer
      const contract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        wallet.signer
      );

      // Get decimals
      const decimals = await contract.decimals();

      // Convert amount to wei
      const amountWei = ethers.parseUnits(amount, decimals);

      // Check balance
      const balance = await contract.balanceOf(wallet.account);
      if (balance < amountWei) {
        throw new Error("Insufficient balance");
      }

      console.log("Sending transaction...");
      console.log("To:", recipient);
      console.log("Amount:", amount);

      // Send transaction
      const tx = await contract.transfer(recipient, amountWei);

      setSuccess(`Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`);
      console.log("Transaction hash:", tx.hash);

      // Wait for confirmation
      console.log("Waiting for confirmation...");
      const receipt = await tx.wait();

      console.log("Transaction confirmed!", receipt);
      setSuccess(
        `✅ Transfer successful! ${amount} TLC sent to ${recipient.slice(
          0,
          6
        )}...${recipient.slice(-4)}`
      );

      // Reset form
      setRecipient("");
      setAmount("");

      // Notify parent to refresh
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (err) {
      console.error("Transfer error:", err);

      // Handle specific errors
      if (err.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user");
      } else if (err.message.includes("insufficient funds")) {
        setError("Insufficient ETH for gas fee");
      } else if (err.message.includes("Pausable: paused")) {
        setError("Contract is paused");
      } else {
        setError(err.reason || err.message || "Transfer failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-form">
      <h2>💸 Transfer TLC</h2>
      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label>Recipient Address:</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label>Amount (TLC):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.000000000000000001"
            min="0"
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "⏳ Sending..." : "🚀 Send Transfer"}
        </button>
      </form>

      {error && <div className="error-message">❌ {error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
}

export default TransferForm;
```

**4. TransactionHistory.jsx:**

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./TransactionHistory.css";

const TOKEN_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function decimals() view returns (uint8)",
];

function TransactionHistory({ wallet, contractAddress }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (wallet && contractAddress) {
      loadTransactions();
    }
  }, [wallet, contractAddress]);

  const loadTransactions = async () => {
    setLoading(true);
    setError("");

    try {
      const contract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        wallet.provider
      );

      // Get decimals
      const decimals = await contract.decimals();

      // Get current block
      const currentBlock = await wallet.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10000 blocks

      console.log(`Querying events from block ${fromBlock} to ${currentBlock}`);

      // Get Transfer events
      const filterFrom = contract.filters.Transfer(wallet.account, null);
      const filterTo = contract.filters.Transfer(null, wallet.account);

      const [eventsFrom, eventsTo] = await Promise.all([
        contract.queryFilter(filterFrom, fromBlock, currentBlock),
        contract.queryFilter(filterTo, fromBlock, currentBlock),
      ]);

      console.log("Events from:", eventsFrom.length);
      console.log("Events to:", eventsTo.length);

      // Combine and sort events
      const allEvents = [...eventsFrom, ...eventsTo]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 20); // Show last 20 transactions

      // Format transactions
      const formattedTxs = await Promise.all(
        allEvents.map(async (event) => {
          try {
            const block = await event.getBlock();
            return {
              hash: event.transactionHash,
              from: event.args.from,
              to: event.args.to,
              value: ethers.formatUnits(event.args.value, decimals),
              timestamp: new Date(block.timestamp * 1000).toLocaleString(),
              blockNumber: event.blockNumber,
              type:
                event.args.from.toLowerCase() === wallet.account.toLowerCase()
                  ? "sent"
                  : "received",
            };
          } catch (err) {
            console.error("Error formatting tx:", err);
            return null;
          }
        })
      );

      setTransactions(formattedTxs.filter((tx) => tx !== null));
    } catch (err) {
      console.error("Error loading transactions:", err);
      setError("Failed to load transaction history");
    } finally {
      setLoading(false);
    }
  };

  const getExplorerUrl = (txHash) => {
    if (wallet.chainId === 11155111) {
      return `https://sepolia.etherscan.io/tx/${txHash}`;
    } else if (wallet.chainId === 97) {
      return `https://testnet.bscscan.com/tx/${txHash}`;
    }
    return "#";
  };

  return (
    <div className="transaction-history">
      <div className="header">
        <h2>📜 Transaction History</h2>
        <button
          onClick={loadTransactions}
          disabled={loading}
          className="refresh-btn"
          title="Refresh"
        >
          {loading ? "⏳" : "🔄"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={loadTransactions} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {loading && transactions.length === 0 ? (
        <div className="loading">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <p className="no-transactions">No transactions found</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx, index) => (
            <div
              key={`${tx.hash}-${index}`}
              className={`transaction-item ${tx.type}`}
            >
              <div className="tx-header">
                <span className={`tx-type ${tx.type}`}>
                  {tx.type === "sent" ? "📤 Sent" : "📥 Received"}
                </span>
                <span className="tx-amount">
                  {parseFloat(tx.value).toFixed(4)} TLC
                </span>
              </div>
              <div className="tx-details">
                <div className="tx-address">
                  <span className="label">
                    {tx.type === "sent" ? "To:" : "From:"}
                  </span>
                  <span className="address">
                    {tx.type === "sent"
                      ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`
                      : `${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                  </span>
                </div>
                <div className="tx-time">{tx.timestamp}</div>
                <div className="tx-block">Block: {tx.blockNumber}</div>
                <a
                  href={getExplorerUrl(tx.hash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tx-link"
                >
                  View on Explorer ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
```

**5. App.js:**

```javascript
import { useState } from "react";
import "./App.css";
import WalletConnect from "./components/WalletConnect";
import TokenInfo from "./components/TokenInfo";
import TransferForm from "./components/TransferForm";
import TransactionHistory from "./components/TransactionHistory";

// ⚠️ IMPORTANT: Thay YOUR_CONTRACT_ADDRESS bằng địa chỉ contract thực tế
// Lấy từ deployment: 0xE4e0429D16f174E36D966806569aD800eD6F5B12
const CONTRACT_ADDRESS = "0xE4e0429D16f174E36D966806569aD800eD6F5B12";

function App() {
  const [wallet, setWallet] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnect = (walletData) => {
    setWallet(walletData);
    console.log("Wallet connected:", walletData);
  };

  const handleDisconnect = () => {
    setWallet(null);
    console.log("Wallet disconnected");
  };

  const handleTransferComplete = () => {
    // Refresh token info and transaction history
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🪙 TLCoin DApp</h1>
        <p>Decentralized Token Transfer Application</p>
      </header>

      <main className="App-main">
        <WalletConnect
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          currentWallet={wallet}
        />

        {wallet ? (
          <>
            <TokenInfo
              wallet={wallet}
              contractAddress={CONTRACT_ADDRESS}
              key={`token-${refreshKey}`}
            />

            <TransferForm
              wallet={wallet}
              contractAddress={CONTRACT_ADDRESS}
              onTransferComplete={handleTransferComplete}
            />

            <TransactionHistory
              wallet={wallet}
              contractAddress={CONTRACT_ADDRESS}
              key={`history-${refreshKey}`}
            />
          </>
        ) : (
          <div className="connect-prompt">
            <p>👆 Please connect your wallet to continue</p>
            <div className="instructions">
              <h3>📝 Instructions:</h3>
              <ol>
                <li>Install MetaMask extension</li>
                <li>Switch to Sepolia Testnet</li>
                <li>
                  Get testnet ETH from{" "}
                  <a
                    href="https://sepoliafaucet.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    faucet
                  </a>
                </li>
                <li>Click "Connect Wallet" button above</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p className="contract-info">
          Contract:{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
```

**6. App.css:**

```css
.App {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.App-header {
  text-align: center;
  color: white;
  margin-bottom: 2rem;
  padding: 2rem 0;
}

.App-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.App-header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.App-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.connect-prompt {
  background: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.connect-prompt > p {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 2rem;
}

.instructions {
  max-width: 600px;
  margin: 0 auto;
  text-align: left;
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
}

.instructions h3 {
  color: #333;
  margin-bottom: 1rem;
}

.instructions ol {
  padding-left: 1.5rem;
}

.instructions li {
  color: #555;
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

.instructions a {
  color: #646cff;
  text-decoration: underline;
}

.App-footer {
  text-align: center;
  color: white;
  padding: 2rem 0;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.App-footer p {
  margin: 0.5rem 0;
  opacity: 0.9;
}

.contract-info {
  font-size: 0.9rem;
  font-family: monospace;
}

.contract-info a {
  color: white;
  text-decoration: underline;
}

.contract-info a:hover {
  opacity: 0.8;
}

@media (max-width: 768px) {
  .App {
    padding: 10px;
  }

  .App-header h1 {
    font-size: 2rem;
  }

  .App-header p {
    font-size: 1rem;
  }

  .connect-prompt {
    padding: 2rem 1rem;
  }

  .instructions {
    padding: 1.5rem;
  }
}

/* Wallet Connect */
.wallet-connect {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.connect-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.connect-btn {
  width: 100%;
  max-width: 300px;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  background: #646cff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.connect-btn:hover {
  background: #535bf2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.account-info,
.network-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-weight: bold;
  color: #666;
}

.address {
  font-family: "Courier New", monospace;
  background: #f0f0f0;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  color: #333;
}

.network {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
}

.network.correct {
  background: #d4edda;
  color: #155724;
}

.network.wrong {
  background: #f8d7da;
  color: #721c24;
}

.disconnect-btn {
  padding: 0.75rem 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.disconnect-btn:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .info-row {
    flex-direction: column;
    align-items: stretch;
  }

  .account-info,
  .network-info {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Token Info */
.token-info {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.token-info .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.token-info h2 {
  color: #333;
  margin: 0;
}

.refresh-btn {
  padding: 0.5rem 1rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.refresh-btn:hover {
  background: #5a6268;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-card {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #dee2e6;
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.info-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-left: 4px solid #4c5fd5;
}

.info-card.highlight .label,
.info-card.highlight .value {
  color: white;
}

.info-card .label {
  font-size: 0.875rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.info-card .value {
  font-size: 1.25rem;
  color: #333;
  font-weight: bold;
}

.info-card .value.big {
  font-size: 1.5rem;
}

.info-card .value.active {
  color: #28a745;
}

.info-card .value.paused {
  color: #dc3545;
}

@media (max-width: 768px) {
  .token-info {
    padding: 1.5rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* Transfer Form */
.transfer-form {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.transfer-form h2 {
  color: #333;
  margin-bottom: 1.5rem;
}

.transfer-form form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
  color: #495057;
}

.form-group input {
  padding: 0.875rem;
  font-size: 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  border-color: #646cff;
  outline: none;
}

.form-group input:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}

.submit-btn {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 600;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

@media (max-width: 768px) {
  .transfer-form {
    padding: 1.5rem;
  }
}

/* Transaction History */
.transaction-history {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.transaction-history .header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.transaction-history h2 {
  color: #333;
  margin: 0;
}

.no-transactions {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.transaction-item {
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #dee2e6;
  transition: transform 0.2s, box-shadow 0.2s;
}

.transaction-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.transaction-item.sent {
  border-left-color: #dc3545;
}

.transaction-item.received {
  border-left-color: #28a745;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.tx-type {
  font-weight: 600;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
}

.tx-type.sent {
  background: #f8d7da;
  color: #721c24;
}

.tx-type.received {
  background: #d4edda;
  color: #155724;
}

.tx-amount {
  font-size: 1.125rem;
  font-weight: bold;
  color: #333;
  font-family: "Courier New", monospace;
}

.tx-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6c757d;
}

.tx-address {
  display: flex;
  gap: 0.5rem;
}

.tx-address .address {
  font-family: "Courier New", monospace;
  color: #333;
}

.tx-time,
.tx-block {
  color: #6c757d;
}

.tx-link {
  color: #646cff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.tx-link:hover {
  color: #535bf2;
  text-decoration: underline;
}

.retry-btn {
  margin-left: 1rem;
  padding: 0.5rem 1rem;
  background: #646cff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}

.retry-btn:hover {
  background: #535bf2;
}

@media (max-width: 768px) {
  .transaction-history {
    padding: 1.5rem;
  }

  .tx-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .tx-details {
    font-size: 0.8125rem;
  }
}

/* Loading */
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.connect-prompt {
  background: white;
  padding: 60px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.connect-prompt p {
  font-size: 1.2rem;
  color: #666;
}

/* Responsive */
@media (max-width: 768px) {
  .App-header h1 {
    font-size: 2rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .wallet-info {
    flex-direction: column;
    align-items: stretch;
  }

  .disconnect-btn {
    width: 100%;
  }
}
```

#### 🚀 Bước 5: Chạy ứng dụng

**1. Cập nhật CONTRACT_ADDRESS trong App.js:**

```javascript
const CONTRACT_ADDRESS = "0x..."; // Địa chỉ contract sau khi deploy
```

**2. Start development server:**

```bash
npm start
```

**3. Mở trình duyệt:**

```
http://localhost:3000
```

#### 🎯 Bước 6: Test chuyển tiền

**1. Connect MetaMask:**

- Click "Connect Wallet"
- Chọn account trong MetaMask
- Approve connection

**2. Kiểm tra thông tin token:**

- Xem balance hiện tại
- Xem total supply
- Xem token status

**3. Thực hiện transfer:**

- Nhập địa chỉ người nhận
- Nhập số lượng TLC
- Click "Send Transfer"
- Confirm transaction trong MetaMask
- Đợi transaction confirmed

**4. Xem lịch sử giao dịch:**

- Scroll xuống Transaction History
- Xem các giao dịch đã thực hiện
- Click "View on Explorer" để xem chi tiết

---

### 📊 6.3. Checklist hoàn thành

**Smart Contract:**

- ✅ Tạo ERC20 token với OpenZeppelin
- ✅ Implement mint, burn, pause functions
- ✅ Viết test cases đầy đủ
- ✅ Deploy lên testnet
- ✅ Verify contract trên Explorer

**Frontend:**

- ✅ Setup React app
- ✅ Kết nối MetaMask
- ✅ Hiển thị thông tin token
- ✅ Form chuyển tiền
- ✅ Xử lý errors và loading states
- ✅ Hiển thị lịch sử giao dịch
- ✅ Responsive design

**Testing:**

- ✅ Test connect/disconnect wallet
- ✅ Test transfer thành công
- ✅ Test transfer với số dư không đủ
- ✅ Test transfer với địa chỉ không hợp lệ
- ✅ Test pause/unpause
- ✅ Test event listeners

---

### 🎓 6.4. Bài tập nâng cao (Optional)

**1. Thêm tính năng Approve & TransferFrom:**

- Tạo form approve
- Tạo form transferFrom
- Hiển thị allowance

**2. Thêm tính năng Admin:**

- Form mint token (chỉ owner)
- Button pause/unpause (chỉ owner)
- Hiển thị owner address

**3. Thêm thông báo real-time:**

- Listen Transfer events
- Hiển thị toast notification khi có giao dịch mới
- Update balance tự động

**4. Tối ưu UX:**

- Thêm loading skeleton
- Thêm animation
- Thêm dark mode
- Thêm multi-language support

**5. Deploy Production:**

- Deploy frontend lên Vercel/Netlify
- Deploy contract lên mainnet
- Setup custom domain
- Add Google Analytics

---

### 📝 Tổng kết Phần 6

**Những điều đã học:**

1. **Smart Contract Development:**

   - Sử dụng OpenZeppelin libraries
   - Implement ERC20 standard
   - Access control với Ownable
   - Pausable mechanism
   - Custom events

2. **Testing:**

   - Viết test cases với Hardhat
   - Test coverage
   - Edge cases handling

3. **Deployment:**

   - Deploy lên testnet
   - Verify contract
   - Use faucets để lấy test tokens

4. **Frontend Integration:**

   - Connect MetaMask
   - Read contract data
   - Send transactions
   - Handle errors
   - Query events
   - Build responsive UI

5. **Best Practices:**
   - Input validation
   - Error handling
   - Loading states
   - Gas estimation
   - Transaction confirmation
   - User feedback

**Next Steps:**

- Học về advanced patterns (Proxy, Upgradeable)
- Tích hợp với Backend (Phần 4)
- Implement security best practices (Phần 5)
- Deploy lên mainnet
- Marketing và community building

---

## Phần 7: So sánh Ethereum vs Hyperledger Fabric

Khi xây dựng giải pháp blockchain cho doanh nghiệp, việc lựa chọn nền tảng phù hợp là cực kỳ quan trọng. Hai nền tảng phổ biến nhất hiện nay là **Ethereum (Public/Private)** và **Hyperledger Fabric (Enterprise)**. Mỗi nền tảng có ưu điểm riêng và phù hợp với các use case khác nhau.

---

### 7.1. Tổng quan và Vai trò

#### 🌐 Ethereum

**Vai trò:** Nền tảng blockchain công khai (public) cho ứng dụng phi tập trung (DApps)

**Đặc điểm chính:**

- **Permissionless**: Bất kỳ ai cũng có thể tham gia mạng lưới
- **Decentralized**: Không có tổ chức trung tâm kiểm soát
- **Transparent**: Tất cả dữ liệu đều công khai
- **Trustless**: Không cần tin tưởng bên thứ ba
- **Global**: Mạng lưới toàn cầu với hàng nghìn nodes

**Mục đích sử dụng:**

```
✅ Token & Cryptocurrency
✅ DeFi (Decentralized Finance)
✅ NFT (Non-Fungible Token)
✅ DAO (Decentralized Autonomous Organization)
✅ GameFi & Metaverse
✅ Public Crowdfunding (ICO/IDO)
✅ Cross-border Payments
```

**Ví dụ thực tế:**

- **Uniswap**: Sàn giao dịch phi tập trung
- **USDT/USDC**: Stablecoin
- **Axie Infinity**: Game NFT
- **OpenSea**: NFT Marketplace
- **MakerDAO**: Lending protocol

---

#### 🏢 Hyperledger Fabric

**Vai trò:** Nền tảng blockchain doanh nghiệp (enterprise) cho các tổ chức

**Đặc điểm chính:**

- **Permissioned**: Chỉ thành viên được phê duyệt mới tham gia
- **Modular**: Kiến trúc linh hoạt, có thể tùy chỉnh
- **Private**: Dữ liệu có thể được giữ riêng tư
- **Scalable**: Hiệu suất cao cho doanh nghiệp
- **Consortium**: Mạng lưới liên minh giữa các tổ chức

**Mục đích sử dụng:**

```
✅ Supply Chain Management
✅ Trade Finance
✅ Healthcare Records
✅ Identity Management
✅ Asset Tracking
✅ Interbank Settlement
✅ Insurance Claims
```

**Ví dụ thực tế:**

- **IBM Food Trust**: Theo dõi nguồn gốc thực phẩm (Walmart, Carrefour)
- **TradeLens**: Logistics và vận tải biển (Maersk, IBM)
- **we.trade**: Tài chính thương mại (14 ngân hàng châu Âu)
- **MediLedger**: Dược phẩm và y tế
- **Everledger**: Theo dõi kim cương và tài sản

---

### 7.2. So sánh chi tiết

#### 📊 Bảng so sánh tổng quan

| **Tiêu chí**          | **Ethereum**               | **Hyperledger Fabric**               |
| --------------------- | -------------------------- | ------------------------------------ |
| **Loại mạng**         | Public (có Private option) | Private (Permissioned)               |
| **Đối tượng**         | B2C, DApps, Crypto         | B2B, Enterprise, Consortium          |
| **Quyền truy cập**    | Permissionless             | Permissioned                         |
| **Quản lý danh tính** | Địa chỉ ví (pseudonymous)  | PKI/MSP (Certificate Authority)      |
| **Dữ liệu**           | Hoàn toàn công khai        | Private, có thể chia sẻ theo channel |
| **Smart Contract**    | Solidity (EVM)             | Chaincode (Go, Node.js, Java)        |
| **Consensus**         | PoS (Proof of Stake)       | Pluggable (Raft, Kafka, PBFT)        |
| **Transaction Speed** | 15-30 TPS                  | 3,000-20,000 TPS                     |
| **Finality**          | Probabilistic (~12 blocks) | Immediate (1 block)                  |
| **Gas Fee**           | Có (ETH/Gwei)              | Không có                             |
| **Cryptocurrency**    | Có (ETH)                   | Không có native token                |
| **Governance**        | Community-driven           | Consortium-driven                    |
| **Scalability**       | Thấp (Layer 2 cần thiết)   | Cao (native)                         |
| **Privacy**           | Thấp (public ledger)       | Cao (private channels)               |
| **Compliance**        | Khó (pseudonymous)         | Dễ (KYC/AML built-in)                |
| **Cost**              | Cao (gas fees)             | Thấp (infrastructure only)           |
| **Maturity**          | Rất cao (2015)             | Cao (2017)                           |

---

### 7.3. Khác biệt về Kiến trúc

#### 🔐 1. Quản lý Danh tính (Identity Management)

**Ethereum:**

```
┌─────────────────────────────────────┐
│         Ethereum Network            │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 0x1a │  │ 0x2b │  │ 0x3c │       │
│  └──────┘  └──────┘  └──────┘       │
│   Anonymous addresses               │
│   (Don't know who's behind)         │
└─────────────────────────────────────┘

✅ Advantages:
   - Privacy (pseudonymous)
   - No KYC required
   - Free to join

❌ Disadvantages:
   - Hard to comply
   - Cannot revoke permissions
   - Hard to hold accountable
```

**Hyperledger Fabric:**

```
┌─────────────────────────────────────────────┐
│      Hyperledger Fabric Network             │
│                                             │
│  Certificate Authority (CA)                 │
│         │                                   │
│    ┌────┴────┬────────┬────────┐            │
│    │         │        │        │            │
│  ┌─▼──┐   ┌─▼──┐  ┌─▼──┐  ┌─▼──┐            │
│  │Org1│   │Org2│  │Org3│  │Org4│            │
│  │User│   │User│  │User│  │User│            │
│  └────┘   └────┘  └────┘  └────┘            │
│  (X.509 Certificates)                       │
│  (Known real identities)                    │
└─────────────────────────────────────────────┘

✅ Advantages:
   - KYC/AML compliance
   - Can revoke certificates
   - Clear accountability
   - Granular permissions

❌ Disadvantages:
   - More complex
   - Requires CA infrastructure
   - Ít privacy hơn
```

**Code ví dụ - Ethereum (Anonymous):**

```javascript
// Ethereum: Chỉ cần private key
const wallet = new ethers.Wallet(privateKey);
console.log("Address:", wallet.address); // 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

// Không ai biết đây là ai
// Có thể tạo vô số ví
```

**Code ví dụ - Fabric (Identity):**

```javascript
// Hyperledger Fabric: Cần certificate từ CA
const identity = {
  credentials: {
    certificate: "-----BEGIN CERTIFICATE-----\n...",
    privateKey: "-----BEGIN PRIVATE KEY-----\n...",
  },
  mspId: "Org1MSP",
  type: "X.509",
};

// Certificate chứa thông tin:
// - Organization: TL Corp
// - Common Name: admin@tl.com
// - Issued by: CA.tl.com
// - Valid from: 2025-01-01 to 2026-01-01
```

---

#### 🔒 2. Phạm vi Công khai (Data Visibility)

**Ethereum:**

```
┌─────────────────────────────────────────────┐
│         Ethereum Public Ledger              │
│                                             │
│  Block #1: Alice → Bob: 10 ETH              │
│  Block #2: Bob → Charlie: 5 ETH             │
│  Block #3: Charlie → David: 2 ETH           │
│                                             │
│  👁️ Everyone can see                        │
│  👁️ Every node has full copy                │
│  👁️ Cannot delete or hide                   │
└─────────────────────────────────────────────┘

✅ Advantages:
   - Absolute transparency
   - Easy to audit
   - Cannot cheat

❌ Disadvantages:
   - No privacy
   - Competitors can see data
   - Not suitable for sensitive data
```

**Hyperledger Fabric:**

```
┌─────────────────────────────────────────────────────┐
│      Hyperledger Fabric - Multi-Channel             │
│                                                     │
│  Channel 1: [Org1, Org2]                           │
│    - Contract A: Supply chain data                  │
│    - Only Org1 & Org2 can see                      │
│                                                     │
│  Channel 2: [Org2, Org3]                           │
│    - Contract B: Payment data                       │
│    - Only Org2 & Org3 can see                      │
│                                                     │
│  Private Data Collection:                           │
│    - Org1 ←→ Org2: Price negotiation (secret)     │
│    - Hash on chain, data off-chain                 │
└─────────────────────────────────────────────────────┘

✅ Ưu điểm:
   - Privacy tốt
   - Dữ liệu nhạy cảm được bảo vệ
   - Tuân thủ GDPR
   - Cạnh tranh không thấy dữ liệu

❌ Nhược điểm:
   - Phức tạp hơn
   - Cần thiết kế channel cẩn thận
```

**Ví dụ thực tế:**

**Ethereum - Supply Chain (Public):**

```solidity
// ❌ Tất cả đều thấy giá
contract PublicSupplyChain {
    struct Product {
        string name;
        uint256 price;        // Đối thủ có thể thấy giá!
        address manufacturer;
        address currentOwner;
    }

    mapping(uint256 => Product) public products; // Public!
}
```

**Fabric - Supply Chain (Private):**

```javascript
// ✅ Chỉ các bên liên quan mới thấy giá
async function createProduct(ctx, productId, name, price) {
  // Public data (on channel ledger)
  const product = {
    productId: productId,
    name: name,
    manufacturer: ctx.clientIdentity.getID(),
  };
  await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

  // Private data (only between specific orgs)
  const privateData = {
    price: price,
    cost: cost,
    margin: margin,
  };
  await ctx.stub.putPrivateData(
    "priceCollection",
    productId,
    Buffer.from(JSON.stringify(privateData))
  );
}
```

---

#### ⚙️ 3. Cơ chế Đồng thuận (Consensus)

> 💡 **Cơ chế đồng thuận là gì?**
>
> Cơ chế đồng thuận (Consensus Mechanism) là quy trình mà các nodes trong mạng blockchain đồng ý về trạng thái hiện tại của ledger. Nó giải quyết vấn đề: "Làm sao để nhiều máy tính không tin tưởng nhau có thể đồng ý về một sự thật chung?"

**Ethereum (Proof of Stake - PoS):**

```
┌─────────────────────────────────────────────┐
│         Ethereum PoS Consensus              │
│                                             │
│  Step 1: Validators stake 32 ETH            │
│  Step 2: Random validator selected          │
│  Step 3: Propose block                      │
│  Step 4: Other validators attest            │
│  Step 5: Block finalized after ~12 blocks   │
│                                             │
│  ⏱️ Block time: ~12 seconds                 │
│  ⏱️ Finality: ~12 minutes                   │
│  💰 Reward: ETH                             │
└─────────────────────────────────────────────┘

✅ Advantages:
   - Decentralized
   - Secure (economic security)
   - Energy efficient (vs PoW)

❌ Disadvantages:
   - Probabilistic finality
   - Chậm
   - Có thể re-org
```

**Hyperledger Fabric (Raft/PBFT):**

```
┌─────────────────────────────────────────────┐
│      Fabric Raft Consensus (CFT)            │
│                                             │
│  Step 1: Client submit transaction          │
│  Step 2: Endorsing peers execute            │
│  Step 3: Ordering service orders            │
│  Step 4: Committing peers validate          │
│  Step 5: Update ledger                      │
│                                             │
│  ⏱️ Transaction time: < 1 second            │
│  ⏱️ Finality: Immediate                     │
│  💰 No reward (no mining)                   │
└─────────────────────────────────────────────┘

✅ Ưu điểm:
   - Immediate finality
   - Rất nhanh (3000+ TPS)
   - Deterministic
   - Không có re-org

❌ Nhược điểm:
   - Centralized hơn
   - Cần trust consortium
   - Ít nodes hơn
```

---

#### 🎓 Hiểu Cơ chế Đồng thuận qua Ví dụ Thực tế

> **Tại sao cần Cơ chế Đồng thuận?**
>
> Tưởng tượng bạn và 9 người bạn cùng ghi chép sổ sách chung (ledger). Mỗi người có một bản copy. Khi có giao dịch mới, làm sao để tất cả mọi người đồng ý về thứ tự và tính hợp lệ của giao dịch đó? Đó chính là vấn đề mà Cơ chế Đồng thuận giải quyết!

### 📚 So sánh bằng Ví dụ Đời thường

#### **Ethereum PoS = Bầu cử Dân chủ có Cọc tiền**

```
Tình huống: 1000 người muốn quyết định ai sẽ ghi sổ tiếp theo

┌─────────────────────────────────────────────────────────────┐
│                    ETHEREUM PoS                             │
└─────────────────────────────────────────────────────────────┘

Bước 1: Đặt cọc
─────────────────────────────────────────────────────────
• Mỗi người muốn tham gia phải đặt cọc 32 ETH (~$64,000)
• Tiền cọc bị khóa, không thể rút trong thời gian tham gia
• Nếu gian lận → MẤT TIỀN CỌC

Ví dụ:
  - Alice đặt cọc: 32 ETH
  - Bob đặt cọc: 64 ETH (gấp đôi = cơ hội gấp đôi)
  - Charlie đặt cọc: 32 ETH

Bước 2: Xổ số Random (mỗi 12 giây)
─────────────────────────────────────────────────────────
• Hệ thống random chọn 1 người làm "Block Proposer"
• Xác suất được chọn = Số tiền cọc / Tổng tiền cọc
• Bob có 64 ETH → Cơ hội gấp đôi Alice (32 ETH)

Giả sử: Bob được chọn!

Bước 3: Bob tạo Block
─────────────────────────────────────────────────────────
• Bob gom 200-300 transactions từ mempool
• Bob tạo block mới
• Bob broadcast block cho mọi người

Bước 4: Bỏ phiếu (Attestation)
─────────────────────────────────────────────────────────
• Hệ thống random chọn 128 người khác làm "Committee"
• Mỗi người kiểm tra block của Bob:
  ✓ Transactions hợp lệ không?
  ✓ Chữ ký đúng không?
  ✓ Bob có gian lận không?

• Mỗi người vote: "YES" hoặc "NO"
• Cần 2/3 (85 người) vote "YES" → Block được chấp nhận

Kết quả: 120/128 vote "YES" → Block của Bob được thêm vào chain!

Bước 5: Thưởng & Phạt
─────────────────────────────────────────────────────────
✅ Bob nhận thưởng: ~0.02 ETH
✅ 120 người vote đúng: Mỗi người nhận ~0.0001 ETH
❌ 8 người vote sai: Không nhận thưởng
❌ Nếu Bob gian lận: MẤT HẾT 32 ETH!

Bước 6: Lặp lại
─────────────────────────────────────────────────────────
• Sau 12 giây → Random lại → Chọn người mới
• Quá trình lặp lại mãi mãi...
```

#### **Hyperledger Fabric Raft = Hội đồng Quản trị Công ty**

```
Tình huống: 5 công ty (Org1-5) cùng quản lý sổ sách chung

┌─────────────────────────────────────────────────────────────┐
│                  HYPERLEDGER FABRIC RAFT                    │
└─────────────────────────────────────────────────────────────┘

Setup: 5 công ty, mỗi công ty có 1 "Orderer Node"
─────────────────────────────────────────────────────────
• Org1: Node A
• Org2: Node B
• Org3: Node C
• Org4: Node D
• Org5: Node E

Bước 1: Bầu Chủ tịch (Leader Election)
─────────────────────────────────────────────────────────
• Lúc đầu, tất cả nodes bình đẳng
• Sau vài giây, một node tự đề cử: "Tôi muốn làm Leader!"
• Các node khác vote
• Node có >50% votes → Trở thành Leader

Kết quả: Node A (Org1) trở thành Leader!

Bước 2: Hoạt động Bình thường
─────────────────────────────────────────────────────────
Khi có transaction mới:

1. Client gửi transaction đến Leader (Node A)

2. Node A ghi vào sổ của mình:
   Log: [tx1, tx2, tx3, NEW_TX]

3. Node A gửi copy cho các Followers:
   A → B: "Hãy ghi [tx1, tx2, tx3, NEW_TX]"
   A → C: "Hãy ghi [tx1, tx2, tx3, NEW_TX]"
   A → D: "Hãy ghi [tx1, tx2, tx3, NEW_TX]"
   A → E: "Hãy ghi [tx1, tx2, tx3, NEW_TX]"

4. Followers ghi vào sổ và trả lời: "OK, đã ghi!"

5. Node A nhận phản hồi:
   - B: "OK" ✓
   - C: "OK" ✓
   - D: "OK" ✓
   - E: (Không phản hồi - có thể offline)

6. Node A đếm: 3/4 followers OK (>50%)
   → Đủ số lượng → COMMIT!

7. Node A tạo block và broadcast cho tất cả
   → Transaction FINALIZED!

⏱️ Tổng thời gian: < 1 giây

Bước 3: Leader Bị Sự cố
─────────────────────────────────────────────────────────
Nếu Node A (Leader) crash:

1. Followers không nhận được heartbeat từ A
2. Sau timeout (vài giây) → Bầu Leader mới
3. Node B được bầu làm Leader mới
4. Hệ thống tiếp tục hoạt động bình thường

→ Hệ thống chịu được tối đa 2/5 nodes fail (40%)
```

### 🔑 Điểm Khác biệt Cốt lõi

```
┌──────────────────────────────────────────────────────────────┐
│              SO SÁNH CỐT LÕI                                 │
└──────────────────────────────────────────────────────────────┘

Câu hỏi 1: Ai được quyền tham gia?
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • BẤT KỲ AI có 32 ETH
  • Không cần xin phép
  • Không cần KYC
  • Hiện có ~1,000,000 validators

Fabric Raft:
  • CHỈ các tổ chức được mời
  • Phải có X.509 certificate
  • Phải qua KYC
  • Thường chỉ 3-10 organizations

Câu hỏi 2: Làm sao chọn người tạo block?
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • RANDOM mỗi 12 giây
  • Xác suất dựa trên số ETH stake
  • Không ai biết trước ai được chọn

Fabric Raft:
  • CỐ ĐỊNH: Luôn là Leader node
  • Leader được bầu bởi majority vote
  • Leader giữ vai trò cho đến khi fail

Câu hỏi 3: Làm sao đảm bảo không gian lận?
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • Economic Security: Gian lận = Mất tiền cọc
  • Tấn công 51% cần ~$30 tỷ USD
  • Slashing: Mất 1-100% số ETH stake

Fabric Raft:
  • Trust-based: Tin tưởng vào consortium
  • Nếu 1 org gian lận → Các org khác phát hiện
  • Có thể revoke certificate của org đó

Câu hỏi 4: Bao lâu để transaction finalized?
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • ~12 phút (2 epochs)
  • Probabilistic finality
  • Có thể bị re-org nếu < 12 phút

Fabric Raft:
  • < 1 giây
  • Immediate finality
  • KHÔNG BAO GIỜ bị re-org

Câu hỏi 5: Bao nhiêu transactions/giây?
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • 15-30 TPS (mainnet)
  • Tất cả nodes phải execute tất cả transactions
  • Consensus trên toàn bộ network (1M validators)

Fabric Raft:
  • 3,000-20,000 TPS
  • Chỉ endorsing peers execute (2-3 peers)
  • Consensus chỉ trên ordering service (3-5 nodes)
```

---

#### 🔍 Phân tích chi tiết Cơ chế Đồng thuận

### A. Ethereum Proof of Stake (PoS) - Chi tiết

**1. Khái niệm cơ bản:**

Proof of Stake là cơ chế đồng thuận dựa trên việc "đặt cọc" (stake) tiền để có quyền tạo block. Thay vì cạnh tranh bằng sức mạnh tính toán (như PoW), validators cạnh tranh bằng số lượng ETH họ stake.

**2. Cách hoạt động từng bước:**

```
┌─────────────────────────────────────────────────────────────┐
│              ETHEREUM PoS WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

EPOCH (6.4 minutes = 32 slots)
│
├─ SLOT 1 (12 seconds)
│  │
│  ├─ [1] Select Validator
│  │    • RANDAO algorithm randomly selects
│  │    • Probability based on ETH staked amount
│  │    • Validator A selected as "Block Proposer"
│  │
│  ├─ [2] Propose Block
│  │    • Validator A creates new block
│  │    • Contains ~200-300 transactions
│  │    • Broadcast to network
│  │
│  ├─ [3] Attestation (Voting)
│  │    • 128 other validators selected as "Committee"
│  │    • Each validator votes for the block
│  │    • Vote = "I agree this block is valid"
│  │    • Requires 2/3 votes for block acceptance
│  │
│  └─ [4] Block Added
│       • Block added to chain
│       • Not yet finalized (can be reverted)
│
├─ SLOT 2-31 (same process)
│
└─ CHECKPOINT
   • After 32 slots (1 epoch)
   • If 2 consecutive epochs OK → Finalized
   • Cannot revert after finalized

REWARDS & PENALTIES:
├─ ✅ Reward if:
│  • Propose block correctly
│  • Vote correctly and on time
│  • Online and responsive
│
└─ ❌ Penalty (Slashing) if:
   • Propose 2 different blocks in same slot
   • Contradictory votes
   • Offline too long
   • Attempt to attack network
```

**3. Ví dụ cụ thể:**

```javascript
// Assume 1000 validators in network

// Slot 1 (first 12 seconds)
// ──────────────────────────────────────────────

// [Step 1] Random selection
const validators = [
  { address: "0xABC", stake: 32 ETH },
  { address: "0xDEF", stake: 64 ETH },  // Double stake = double probability
  { address: "0x123", stake: 32 ETH },
  // ... 997 other validators
];

// RANDAO algorithm selects validator
const selectedProposer = randomSelect(validators); // Assume 0xDEF selected

// [Step 2] Validator 0xDEF creates block
const newBlock = {
  number: 18000001,
  proposer: "0xDEF",
  transactions: [
    { from: "0xAlice", to: "0xBob", value: "1 ETH" },
    { from: "0xCharlie", to: "0xDavid", value: "0.5 ETH" },
    // ... 298 other transactions
  ],
  parentHash: "0x7f8e...",
  timestamp: 1704067200,
};

// [Step 3] Committee votes
const committee = randomSelect(validators, 128); // Select 128 validators

// Each validator in committee votes
const votes = committee.map(validator => {
  // Validator validates block
  const isValid = validateBlock(newBlock);

  return {
    validator: validator.address,
    vote: isValid ? "YES" : "NO",
    signature: sign(newBlock.hash, validator.privateKey)
  };
});

// Count votes
const yesVotes = votes.filter(v => v.vote === "YES").length; // 120/128
const threshold = committee.length * 2/3; // 85.3

if (yesVotes >= threshold) {
  console.log("✅ Block accepted!");
  addBlockToChain(newBlock);
} else {
  console.log("❌ Block rejected!");
}

// [Step 4] Finality
// Block not yet finalized, must wait 2 more epochs (12.8 minutes)
```

**4. Tại sao cần 12 phút để Finalized?**

**Khái niệm quan trọng:**

Finalized = **Không thể đảo ngược** (irreversible). Đây là trạng thái cuối cùng đảm bảo transaction của bạn **100% an toàn**.

**Giải thích bằng ví dụ thực tế:**

Tưởng tượng bạn chuyển 1000 ETH cho ai đó:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Transaction included in Block 1000                  │
│ Status: PROPOSED                                            │
│ ⚠️  Risk: Block may be rejected if invalid                 │
│ → Not safe yet, waiting for confirmation                    │
└─────────────────────────────────────────────────────────────┘
                        ↓ (6.4 minutes - 32 blocks)
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Block 1000-1032 reaches Checkpoint 1                │
│ Status: JUSTIFIED                                           │
│ ✅ 2/3 validators voted "OK"                                │
│ ⚠️  Risk: Still can be reverted if chain fork occurs       │
│ → Relatively safe, but not 100% certain                     │
└─────────────────────────────────────────────────────────────┘
                        ↓ (6.4 minutes - 32 more blocks)
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Block 1033-1064 reaches Checkpoint 2                │
│ Status: FINALIZED                                           │
│ ✅✅ 2 consecutive checkpoints both OK                      │
│ 🔒 Block 1000-1032 now FINALIZED                            │
│ ✨ CANNOT be reverted, forked, or changed                   │
│ → 100% SAFE! Your transaction is complete!                  │
└─────────────────────────────────────────────────────────────┘

Total time: 6.4 + 6.4 = 12.8 minutes
```

**Timeline chi tiết:**

```
Minute 0:00 ───────────────────────────────────────────────────
│
│  Block 1000 (Your transaction is here)
│  Block 1001
│  Block 1002
│  ...
│  Block 1031
│
Minute 6:24 ───────────────────────────────────────────────────
│  Block 1032 ← CHECKPOINT 1
│  └─→ Block 1000-1032 = JUSTIFIED ✓
│      (Confirmed, but not finalized yet)
│
│  Block 1033
│  Block 1034
│  ...
│  Block 1063
│
Minute 12:48 ──────────────────────────────────────────────────
│  Block 1064 ← CHECKPOINT 2
│  └─→ Block 1033-1064 = JUSTIFIED ✓
│
│  🎉 Block 1000-1032 → FINALIZED! 🎉
│  (Cannot be reversed)
│
```

**Tại sao phải chờ 2 checkpoints?**

1. **Checkpoint 1 (Justified):**
   - Only proves: "This block is valid"
   - But chain fork may still exist (2 competing chains)
2. **Checkpoint 2 (Finalized):**
   - Proves: "No other chain fork exists"
   - Network has fully reached consensus
   - Cannot rollback

**Ví dụ về Chain Fork:**

```
                    ┌─→ Block 1033a ─→ Block 1034a (Chain A)
                    │
Block 1032 (Justified)
                    │
                    └─→ Block 1033b ─→ Block 1034b (Chain B)

⚠️  2 competing chains! Must wait for 1 more checkpoint to know
   which chain wins.

After Checkpoint 2:
─────────────────────────────────────────────────────────
Chain A: Block 1064a (Checkpoint 2) ✅ → Wins!
Chain B: Block 1064b (Rejected)     ❌ → Loses!

→ Block 1000-1032 now FINALIZED on Chain A
→ Cannot switch to Chain B anymore
```

**5. Economic Security (Bảo mật kinh tế):**

```javascript
// Tấn công Ethereum PoS rất tốn kém

// Giả sử muốn tấn công 51%
const totalStaked = 30_000_000; // 30 triệu ETH đang stake
const attackerNeed = totalStaked * 0.51; // 15.3 triệu ETH
const ethPrice = 2000; // $2000/ETH
const attackCost = attackerNeed * ethPrice; // $30.6 tỷ USD!

// Nếu tấn công thất bại → Mất hết tiền stake (Slashing)
// Nếu tấn công thành công → ETH mất giá trị → Vẫn lỗ

console.log("Chi phí tấn công:", attackCost);
console.log("→ Không khả thi về mặt kinh tế!");
```

---

### B. Hyperledger Fabric Consensus - Chi tiết

**1. Khái niệm cơ bản:**

Fabric không có một consensus duy nhất, mà là **pluggable** (có thể thay đổi). Phổ biến nhất là **Raft** (Crash Fault Tolerant) và **PBFT** (Byzantine Fault Tolerant).

**2. Execute-Order-Validate Architecture:**

Đây là điểm khác biệt lớn nhất của Fabric:

```
┌────────────────────────────────────────────────────────────┐
│         FABRIC: EXECUTE-ORDER-VALIDATE                     │
└────────────────────────────────────────────────────────────┘

[Phase 1] EXECUTE (Parallel - No consensus needed)
│
├─ Client sends transaction proposal
│  • "Transfer $100 from Alice → Bob"
│
├─ Endorsing Peers execute chaincode
│  • Peer 1 (Org1): Execute → Read/Write Set
│  • Peer 2 (Org2): Execute → Read/Write Set
│  • Peer 3 (Org3): Execute → Read/Write Set
│  • Don't update ledger (simulation only)
│
└─ Client receives endorsements
   • Need enough endorsements per policy
   • Example: "2 out of 3" or "Org1 AND Org2"

[Phase 2] ORDER (Consensus happens here)
│
├─ Client sends endorsed transaction to Orderer
│
├─ Ordering Service (Raft Consensus)
│  • Leader receives transactions
│  • Leader proposes batch of transactions
│  • Followers vote (majority)
│  • Create block when enough votes
│
└─ Block broadcast to all peers

[Phase 3] VALIDATE (Final check)
│
├─ Committing Peers receive block
│
├─ Validate each transaction:
│  • Check endorsement policy
│  • Check read/write set conflicts
│  • Check signatures
│
├─ Valid transactions → Update ledger
│  • Invalid transactions → Mark as invalid
│
└─ Emit events

FINALITY: Immediate (ngay khi block được commit)
```

**3. Raft Consensus - Chi tiết:**

```
┌────────────────────────────────────────────────────────────┐
│                    RAFT CONSENSUS                          │
└────────────────────────────────────────────────────────────┘

SETUP: 5 Orderer Nodes (Org1, Org2, Org3, Org4, Org5)

[Step 1] Leader Election
│
├─ On start, all nodes are in "Follower" state
├─ After timeout, one node nominates itself as "Candidate"
├─ Candidate sends vote request
├─ Other nodes vote
└─ Node with >50% votes → Becomes Leader

    Node1 (Leader) ←─── Heartbeat ───→ Node2 (Follower)
         │                                    ↓
         └──────→ Node3 (Follower)           Node4 (Follower)
                        ↓
                   Node5 (Follower)

[Step 2] Normal Operation
│
├─ Client sends transaction to Leader
│
├─ Leader appends to log:
│  Log: [tx1, tx2, tx3, tx4, tx5, ...]
│
├─ Leader replicates log to Followers:
│  Leader → Node2: [tx1, tx2, tx3]
│  Leader → Node3: [tx1, tx2, tx3]
│  Leader → Node4: [tx1, tx2, tx3]
│  Leader → Node5: [tx1, tx2, tx3]
│
├─ Followers append to their own log
│
├─ Followers send ACK to Leader
│
└─ Leader receives >50% ACKs → Commit
   • Create block
   • Broadcast block to all peers
   • Finalized!

[Step 3] Leader Failure
│
├─ Leader crash/offline
│
├─ Followers don't receive heartbeat
│
├─ After timeout → New election
│
├─ Node with most complete log is selected
│
└─ New leader continues

FAULT TOLERANCE:
• Can tolerate (N-1)/2 nodes fail
• Example: 5 nodes → Can tolerate 2 nodes fail
• 3 nodes → Can tolerate 1 node fail
```

**4. Code ví dụ - Transaction Flow:**

```javascript
// ════════════════════════════════════════════════════════════
// PHASE 1: EXECUTE (Endorsement)
// ════════════════════════════════════════════════════════════

// Client code
const { Gateway, Wallets } = require("fabric-network");

async function transferMoney() {
  // 1. Connect to network
  const wallet = await Wallets.newFileSystemWallet("./wallet");
  const gateway = new Gateway();
  await gateway.connect(connectionProfile, {
    wallet,
    identity: "user1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork("mychannel");
  const contract = network.getContract("banking");

  // 2. Submit transaction proposal
  console.log("📤 Sending transaction proposal...");

  // Chaincode will be executed on endorsing peers
  const result = await contract.submitTransaction(
    "transfer",
    "Alice", // from
    "Bob", // to
    "100" // amount
  );

  // Behind the scenes:
  // ────────────────────────────────────────────────────────
  // Peer1 (Org1) executes chaincode:
  //   Read: Alice balance = 500
  //   Read: Bob balance = 200
  //   Write: Alice balance = 400
  //   Write: Bob balance = 300
  //   → Endorsement: Sign(ReadWriteSet)
  //
  // Peer2 (Org2) executes chaincode:
  //   Read: Alice balance = 500
  //   Read: Bob balance = 200
  //   Write: Alice balance = 400
  //   Write: Bob balance = 300
  //   → Endorsement: Sign(ReadWriteSet)
  //
  // Client receives 2 endorsements → Meets policy (2 out of 2)
  // ────────────────────────────────────────────────────────

  console.log("✅ Transaction endorsed!");

  // ════════════════════════════════════════════════════════════
  // PHASE 2: ORDER (Consensus)
  // ════════════════════════════════════════════════════════════

  // Client sends endorsed transaction to Orderer
  // (SDK does this automatically)

  // Orderer (Raft consensus):
  // ────────────────────────────────────────────────────────
  // Leader Orderer:
  //   1. Receive transaction
  //   2. Append to log: [tx1, tx2, tx3, THIS_TX]
  //   3. Replicate to followers
  //   4. Receive majority ACKs
  //   5. Create block:
  //      Block #1001 {
  //        transactions: [tx1, tx2, tx3, THIS_TX],
  //        previousHash: "0x7f8e...",
  //        timestamp: 1704067200
  //      }
  //   6. Broadcast block to all peers
  // ────────────────────────────────────────────────────────

  console.log("📦 Block created and broadcast!");

  // ════════════════════════════════════════════════════════════
  // PHASE 3: VALIDATE (Commit)
  // ════════════════════════════════════════════════════════════

  // Committing Peers validate:
  // ────────────────────────────────────────────────────────
  // Peer1 validates:
  //   ✓ Check endorsement policy (2 out of 2 OK)
  //   ✓ Check signatures valid
  //   ✓ Check read set: Alice=500, Bob=200 (still valid)
  //   ✓ No conflicts with other transactions
  //   → VALID → Update ledger
  //
  // Peer2 validates:
  //   ✓ Same checks
  //   → VALID → Update ledger
  // ────────────────────────────────────────────────────────

  console.log("✅ Transaction committed to ledger!");
  console.log("Result:", result.toString());

  // FINALITY: Immediate!
  // No probabilistic finality like Ethereum
  // No reorg
  // Transaction finalized immediately

  await gateway.disconnect();
}

transferMoney();
```

**5. Tại sao Fabric nhanh hơn Ethereum?**

```
ETHEREUM PoS:
├─ All nodes execute all transactions
├─ Consensus across entire network (thousands of nodes)
├─ Probabilistic finality (12 minutes)
└─ → Slow (15-30 TPS)

FABRIC:
├─ Only endorsing peers execute (2-3 peers)
├─ Consensus only on ordering service (3-5 nodes)
├─ Immediate finality (< 1 second)
└─ → Fast (3000-20000 TPS)

Concrete example:
─────────────────────────────────────────────────
Transaction: Transfer $100

Ethereum:
  [0s]    Submit transaction
  [12s]   Block proposed
  [24s]   Block attested
  [768s]  Finalized (12 minutes)
  → Total: 12 minutes 48 seconds

Fabric:
  [0s]     Submit proposal
  [0.1s]   Endorsements received
  [0.2s]   Ordered by Raft
  [0.3s]   Block created
  [0.4s]   Validated and committed
  → Total: 0.4 seconds
```

**6. Trade-offs:**

```
ETHEREUM PoS:
✅ Decentralized (thousands of nodes)
✅ Censorship resistant
✅ Public and transparent
❌ Slow
❌ Expensive (gas fees)
❌ Not private

FABRIC RAFT:
✅ Very fast
✅ Free transactions
✅ Private data
❌ More centralized (fewer nodes)
❌ Requires trust in consortium
❌ Not public
```

---

#### ❓ Câu hỏi Thường gặp về Cơ chế Đồng thuận

**Q1: Tại sao Ethereum PoS cần 12 phút để finalized, còn Fabric chỉ cần < 1 giây?**

```
Ethereum PoS:
─────────────────────────────────────────────────────────
Vấn đề: Phải đảm bảo KHÔNG có chain fork

Timeline:
  0:00  → Transaction vào block 1000
  6:24  → Checkpoint 1 (Block 1032) - JUSTIFIED
          ⚠️  Vẫn có thể có fork!
  12:48 → Checkpoint 2 (Block 1064) - FINALIZED
          ✅ Chắc chắn không có fork!

Lý do cần 2 checkpoints:
  • Checkpoint 1: Chứng minh "Block này hợp lệ"
  • Checkpoint 2: Chứng minh "Không có chain nào khác"
  • Nếu chỉ 1 checkpoint → Có thể bị tấn công fork

Ví dụ Fork:
                    ┌─→ Chain A (100 validators)
  Block 1032 ──────┤
                    └─→ Chain B (80 validators)

  Sau checkpoint 2:
  → Chain A thắng (nhiều validators hơn)
  → Chain B bị loại bỏ
  → Block 1000-1032 trên Chain A = FINALIZED


Fabric Raft:
─────────────────────────────────────────────────────────
Vấn đề: KHÔNG BAO GIỜ có fork (by design)

Timeline:
  0.0s → Client gửi transaction
  0.1s → Endorsing peers execute
  0.2s → Leader Orderer nhận
  0.3s → Followers ACK (majority)
  0.4s → FINALIZED!

Lý do nhanh:
  • CHỈ có 1 Leader → Không thể có 2 chains
  • Majority vote → Ngay lập tức biết kết quả
  • Không cần chờ nhiều blocks
  • Deterministic (không random)

Trade-off:
  ✅ Nhanh
  ❌ Centralized hơn (chỉ 3-5 orderers)
  ❌ Cần trust consortium
```

**Q2: Nếu tôi gửi 1000 ETH, bao giờ tôi chắc chắn người nhận đã có tiền?**

```
Ethereum:
─────────────────────────────────────────────────────────
Mức độ an toàn theo thời gian:

0 confirmations (0 giây):
  ⚠️⚠️⚠️ NGUY HIỂM!
  • Transaction có thể bị reject
  • Có thể bị replace (higher gas)
  • KHÔNG BAO GIỜ tin tưởng ở mức này

1-5 confirmations (12-60 giây):
  ⚠️⚠️ RỦI RO CAO
  • Có thể bị re-org
  • Chỉ OK cho giao dịch nhỏ (< $100)
  • Ví dụ: Mua cafe

12 confirmations (~2.4 phút):
  ⚠️ RỦI RO TRUNG BÌNH
  • Xác suất re-org rất thấp (~0.01%)
  • OK cho giao dịch vừa ($100-$10,000)
  • Ví dụ: Mua hàng online

64 confirmations (~12.8 phút):
  ✅ AN TOÀN
  • Finalized! Không thể revert
  • OK cho giao dịch lớn (> $10,000)
  • Ví dụ: Nạp tiền vào sàn, mua nhà

Best Practice:
  • Giao dịch < $100: Chờ 1-5 confirmations
  • Giao dịch $100-$10K: Chờ 12 confirmations
  • Giao dịch > $10K: Chờ 64 confirmations (finalized)


Fabric:
─────────────────────────────────────────────────────────
Mức độ an toàn:

< 1 giây:
  ✅ AN TOÀN 100%!
  • Immediate finality
  • Không có confirmations
  • Không có re-org
  • Transaction đã FINALIZED ngay lập tức

Lý do:
  • Raft consensus = Deterministic
  • Majority vote = Chắc chắn
  • Không có probabilistic finality
```

**Q3: Điều gì xảy ra nếu validator/node gian lận?**

```
Ethereum PoS - Validator Gian lận:
─────────────────────────────────────────────────────────
Tình huống 1: Validator propose 2 blocks khác nhau (Double signing)

  Slot 100:
    Validator A propose:
      - Block X: "Alice → Bob: 10 ETH"
      - Block Y: "Alice → Charlie: 10 ETH"  (cùng tiền!)

  Phát hiện:
    • Các validators khác thấy 2 blocks
    • Báo cáo lên network
    • Proof được submit on-chain

  Hình phạt:
    ❌ Validator A bị SLASHING
    ❌ Mất 1 ETH (~$2,000)
    ❌ Bị kick khỏi validator set
    ❌ Không thể stake lại trong 36 ngày

Tình huống 2: Validator vote mâu thuẫn

  Slot 100:
    Validator B vote:
      - Vote 1: "Block X is valid"
      - Vote 2: "Block Y is valid" (mâu thuẫn!)

  Hình phạt:
    ❌ Mất 0.5 ETH
    ❌ Bị kick

Tình huống 3: Validator offline quá lâu

  Validator C offline 1 tuần:
    • Không propose blocks khi được chọn
    • Không vote cho blocks

  Hình phạt:
    ❌ Mất ~0.1 ETH
    ❌ Không bị kick (có thể quay lại)

Tình huống 4: Tấn công 51%

  Attacker cần:
    • 51% tổng số ETH stake
    • ~15 triệu ETH
    • ~$30 tỷ USD

  Nếu tấn công:
    ❌ Mất HẾT $30 tỷ (slashing)
    ❌ ETH giảm giá → Vẫn lỗ
    → KHÔNG KHẢ THI về mặt kinh tế!


Fabric Raft - Node Gian lận:
─────────────────────────────────────────────────────────
Tình huống 1: Endorsing Peer gian lận

  Peer A (Org1) endorse sai:
    • Endorse transaction không hợp lệ
    • Ví dụ: Alice chuyển 100 ETH nhưng chỉ có 50

  Phát hiện:
    • Committing peers validate
    • Phát hiện read/write set không hợp lệ
    • Transaction bị mark as INVALID

  Hình phạt:
    ⚠️  Không có hình phạt tự động!
    • Các org khác phát hiện
    • Họp consortium
    • Có thể revoke certificate của Org1
    • Kick Org1 ra khỏi network

Tình huống 2: Leader Orderer gian lận

  Leader cố gắng:
    • Thay đổi thứ tự transactions
    • Bỏ qua một số transactions

  Phát hiện:
    • Follower orderers có log khác
    • Majority không đồng ý
    • Leader bị reject

  Kết quả:
    • Leader bị kick
    • Bầu leader mới
    • Network tiếp tục hoạt động

Tình huống 3: Tấn công Majority

  Attacker cần:
    • Kiểm soát >50% orderers
    • Ví dụ: 3/5 orderers

  Nếu tấn công:
    ✅ CÓ THỂ gian lận!
    • Có thể thay đổi transactions
    • Có thể censorship

  Phòng ngừa:
    • Chọn consortium đáng tin cậy
    • Nhiều orgs độc lập
    • Legal contracts giữa các orgs
```

**Q4: Tại sao không làm Ethereum nhanh như Fabric?**

```
Vấn đề: Trade-off giữa Decentralization vs Speed

Ethereum PoS (Chậm nhưng Decentralized):
─────────────────────────────────────────────────────────
Tại sao chậm?
  1. Nhiều validators (1,000,000 validators)
     → Phải đợi votes từ nhiều người
     → Mất thời gian

  2. Tất cả nodes execute tất cả transactions
     → Mọi node phải verify
     → Bottleneck

  3. Probabilistic finality
     → Phải chờ 2 epochs để chắc chắn
     → 12 phút

  4. Byzantine Fault Tolerance
     → Phải chống được 33% validators ác ý
     → Cần nhiều rounds voting

Ưu điểm:
  ✅ Bất kỳ ai cũng có thể tham gia
  ✅ Không thể censorship
  ✅ Không cần trust ai
  ✅ Truly decentralized


Fabric Raft (Nhanh nhưng Centralized hơn):
─────────────────────────────────────────────────────────
Tại sao nhanh?
  1. Ít nodes (3-10 orderers)
     → Nhanh chóng đạt consensus
     → < 1 giây

  2. Chỉ endorsing peers execute
     → Không phải tất cả nodes
     → Parallel execution

  3. Immediate finality
     → Majority vote = Finalized ngay
     → Không cần chờ

  4. Crash Fault Tolerance (không phải Byzantine)
     → Giả định: Nodes không ác ý
     → Chỉ cần >50% vote

Nhược điểm:
  ❌ Chỉ consortium được tham gia
  ❌ Có thể censorship (nếu majority đồng ý)
  ❌ Phải trust consortium
  ❌ Centralized hơn


Kết luận:
  • Không thể có cả 2!
  • Phải chọn: Decentralized OR Fast
  • Ethereum chọn Decentralized
  • Fabric chọn Fast
```

**Q5: Khi nào nên dùng Ethereum? Khi nào nên dùng Fabric?**

```
Dùng Ethereum khi:
─────────────────────────────────────────────────────────
✅ Cần decentralization
   → DeFi, DAO, Public applications

✅ Cần trustless
   → Không muốn trust bất kỳ tổ chức nào

✅ Cần public & transparent
   → Mọi người đều có thể verify

✅ Cần composability
   → Smart contracts gọi nhau
   → Ví dụ: Uniswap + Aave + Compound

✅ Cần token economics
   → ICO, IDO, NFT, Governance token

Ví dụ:
  • Uniswap (DEX)
  • Aave (Lending)
  • OpenSea (NFT Marketplace)
  • MakerDAO (Stablecoin)


Dùng Fabric khi:
─────────────────────────────────────────────────────────
✅ Cần privacy
   → Dữ liệu nhạy cảm giữa các đối tác
   → Ví dụ: Giá, hợp đồng, thông tin khách hàng

✅ Cần high throughput
   → 3000-20000 TPS
   → Ví dụ: Supply chain với hàng triệu transactions

✅ Cần immediate finality
   → Không thể chờ 12 phút
   → Ví dụ: Trade finance, payments

✅ Cần compliance
   → KYC/AML, GDPR, HIPAA
   → Biết rõ danh tính participants

✅ Cần free transactions
   → Không muốn trả gas fees
   → Infrastructure cost only

Ví dụ:
  • IBM Food Trust (Supply chain)
  • we.trade (Trade finance)
  • MedRec (Healthcare records)
  • TradeLens (Shipping)
```

---

**7. Tóm tắt:**

| Aspect               | Ethereum PoS             | Fabric Raft                |
| -------------------- | ------------------------ | -------------------------- |
| **Purpose**          | Public blockchain        | Private consortium         |
| **Participants**     | Unlimited                | Permissioned               |
| **Consensus Type**   | Nakamoto-style           | CFT (Crash Fault Tolerant) |
| **Finality**         | Probabilistic → Absolute | Immediate                  |
| **Speed**            | 15-30 TPS                | 3000-20000 TPS             |
| **Time to Finality** | ~12 minutes              | < 1 second                 |
| **Energy**           | Low                      | Very low                   |
| **Fault Tolerance**  | 33% Byzantine            | 50% Crash                  |
| **Best for**         | Public DApps, DeFi       | Enterprise, B2B            |

**So sánh Transaction Flow:**

**Ethereum:**

```
User → MetaMask → RPC Node → Mempool
→ Validator picks tx → Execute → Block proposed
→ Attestations → Block finalized (12 blocks later)

⏱️ Total: ~12 minutes for finality
💰 Gas fee: $5-50 (depends on network congestion)
```

**Fabric:**

```
Client → Endorsing Peers (parallel execution)
→ Ordering Service → Committing Peers
→ Ledger updated

⏱️ Total: < 1 second
💰 No fee (only infrastructure cost)
```

---

#### 🏗️ 4. Kiến trúc Smart Contract

**Ethereum Smart Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    // State được lưu trên blockchain
    // Tất cả nodes đều execute
    // Gas fee cho mỗi operation

    function setValue(uint256 newValue) public {
        value = newValue; // Cost: ~5000 gas
    }

    function getValue() public view returns (uint256) {
        return value; // Free (read-only)
    }
}

// Deploy: ~100,000 gas (~$5-20)
// Write: ~5,000 gas (~$0.5-2)
// Read: Free
```

**Fabric Chaincode:**

```javascript
// Node.js Chaincode
const { Contract } = require("fabric-contract-api");

class SimpleStorage extends Contract {
  // State được lưu trên channel ledger
  // Chỉ endorsing peers execute
  // Không có gas fee

  async setValue(ctx, newValue) {
    // Kiểm tra identity
    const clientId = ctx.clientIdentity.getID();

    // Kiểm tra quyền (ACL)
    const org = ctx.clientIdentity.getMSPID();
    if (org !== "Org1MSP") {
      throw new Error("Unauthorized");
    }

    await ctx.stub.putState("myValue", Buffer.from(newValue));

    // Emit event
    ctx.stub.setEvent("ValueChanged", Buffer.from(newValue));
  }

  async getValue(ctx) {
    const valueBytes = await ctx.stub.getState("myValue");
    return valueBytes.toString();
  }
}

// Deploy: Free (chỉ cần approve)
// Write: Free
// Read: Free
```

**Khác biệt chính:**

| **Aspect**         | **Ethereum**    | **Fabric**           |
| ------------------ | --------------- | -------------------- |
| **Language**       | Solidity        | Go, Node.js, Java    |
| **Execution**      | All nodes       | Endorsing peers only |
| **State**          | Global          | Per channel          |
| **Cost**           | Gas fee         | Infrastructure only  |
| **Upgrade**        | Khó (immutable) | Dễ (versioning)      |
| **Access Control** | Code-based      | Identity-based       |

---

### 7.4. Khi nào dùng nền tảng nào?

#### 🎯 Chọn Ethereum khi:

**✅ Use Cases phù hợp:**

**1. Token & Cryptocurrency**

```
Example: Token issuance for projects
- ICO/IDO
- Utility token
- Governance token
- Stablecoin

Reason: Ethereum has the strongest token ecosystem
```

**2. DeFi (Decentralized Finance)**

```
Example: DEX, Lending, Staking
- Uniswap: AMM DEX
- Aave: Lending protocol
- Compound: Money market
- Curve: Stablecoin swap

Reason: Requires decentralization and composability
```

**3. NFT & Digital Assets**

```
Example: NFT marketplace, Game items
- OpenSea: NFT trading
- Axie Infinity: GameFi
- Decentraland: Metaverse
- Art collectibles

Reason: Requires ownership verification and liquidity
```

**4. DAO & Governance**

```
Example: Decentralized organizations
- MakerDAO: Decentralized governance
- Aragon: DAO framework
- Snapshot: Voting

Reason: Requires transparency and trustless voting
```

**5. Public Crowdfunding**

```
Example: Community fundraising
- ICO/IDO
- NFT presale
- Public fundraising

Reason: Access to global audience
```

**6. Cross-border Payments**

```
Example: International money transfer
- USDT/USDC transfers
- Remittance
- Micropayments

Reason: No intermediary banks needed
```

---

#### 🏢 Chọn Hyperledger Fabric khi:

**✅ Use Cases phù hợp:**

**1. Supply Chain Management**

```
Example: Product provenance tracking
- IBM Food Trust (Walmart)
- TradeLens (Maersk shipping)
- Everledger (Diamond tracking)

Reason:
- Requires privacy between partners
- Sensitive data (prices, contracts)
- High throughput
- Compliance requirements

Code example:
```

```javascript
// Fabric: Private data cho giá
async function createShipment(ctx, shipmentId, product, quantity) {
  // Public data (visible to all channel members)
  const shipment = {
    shipmentId,
    product,
    quantity,
    status: "created",
    timestamp: new Date().toISOString(),
  };
  await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

  // Private data (only between buyer and seller)
  const privateData = {
    price: 10000,
    discount: 5,
    paymentTerms: "NET30",
  };
  await ctx.stub.putPrivateData(
    "priceCollection",
    shipmentId,
    Buffer.from(JSON.stringify(privateData))
  );
}
```

**2. Trade Finance & Banking**

```
Example: Trade finance
- we.trade (14 European banks)
- Contour (Letter of Credit)
- Marco Polo (Trade finance)

Reason:
- KYC/AML compliance
- Regulatory requirements
- Multi-party workflows
- Immediate finality

Workflow example:
```

```
Buyer → Request LC → Bank A (Issuing Bank)
  ↓
Bank A → Issue LC → Bank B (Advising Bank)
  ↓
Bank B → Notify → Seller
  ↓
Seller → Ship goods → Update blockchain
  ↓
Bank B → Verify documents → Pay seller
  ↓
Bank A → Reimburse Bank B → Debit buyer

✅ All steps recorded on Fabric
✅ Only involved parties see data
✅ Immediate settlement
```

**3. Healthcare Records**

```
Example: Electronic health records
- MedRec (MIT)
- Guardtime (Estonia healthcare)
- BurstIQ (Health data marketplace)

Reason:
- HIPAA compliance (US)
- GDPR compliance (EU)
- Patient privacy
- Granular access control
- Audit trail

Example:
```

```javascript
// Only authorized doctors can view
async function getPatientRecord(ctx, patientId) {
  // Check if caller is authorized
  const doctorId = ctx.clientIdentity.getID();

  // Check permission in ACL
  const permissionKey = `permission_${patientId}_${doctorId}`;
  const permissionBytes = await ctx.stub.getState(permissionKey);

  if (!permissionBytes || permissionBytes.length === 0) {
    throw new Error("Unauthorized: No permission to access this record");
  }

  // Return patient record
  const recordBytes = await ctx.stub.getPrivateData(
    "patientRecords",
    patientId
  );
  return recordBytes.toString();
}
```

**4. Identity & Credential Management**

```
Example: Digital identity management
- Sovrin (Self-sovereign identity)
- uPort (Digital identity)
- Civic (Identity verification)

Reason:
- Verifiable credentials
- Privacy-preserving
- Selective disclosure
- Revocation support
```

**5. Asset Tracking & IoT**

```
Example: Asset tracking
- Logistics tracking
- Equipment maintenance
- Vehicle history
- Warranty management

Reason:
- High transaction volume
- Low latency
- Private data
- Integration with enterprise systems
```

**6. Insurance Claims**

```
Example: Insurance claims processing
- B3i (Blockchain Insurance Industry Initiative)
- RiskBlock Alliance

Reason:
- Multi-party process
- Fraud prevention
- Automated claims processing
- Regulatory compliance
```

---

### 7.5. Decision Matrix (Ma trận quyết định)

#### 📋 Bảng câu hỏi để chọn nền tảng:

| **Câu hỏi**                          | **Ethereum** | **Fabric** |
| ------------------------------------ | ------------ | ---------- |
| Dữ liệu có thể công khai?            | ✅ Yes       | ❌ No      |
| Cần cryptocurrency/token?            | ✅ Yes       | ❌ No      |
| Cần decentralization tối đa?         | ✅ Yes       | ❌ No      |
| Người dùng là public/anonymous?      | ✅ Yes       | ❌ No      |
| Cần KYC/AML compliance?              | ❌ No        | ✅ Yes     |
| Dữ liệu nhạy cảm/bí mật?             | ❌ No        | ✅ Yes     |
| Cần throughput cao (>1000 TPS)?      | ❌ No        | ✅ Yes     |
| Cần immediate finality?              | ❌ No        | ✅ Yes     |
| Có consortium/partnership?           | ❌ No        | ✅ Yes     |
| Ngân sách gas fee hạn chế?           | ❌ No        | ✅ Yes     |
| Cần upgrade contract thường xuyên?   | ❌ No        | ✅ Yes     |
| Regulatory requirements nghiêm ngặt? | ❌ No        | ✅ Yes     |

**Cách sử dụng:**

- Đếm số ✅ ở mỗi cột
- Cột nào nhiều ✅ hơn → Chọn nền tảng đó

---

### 📝 Tổng kết Phần 7

**Key Takeaways:**

**1. Ethereum:**

- ✅ Public, permissionless, decentralized
- ✅ Tốt cho: Token, DeFi, NFT, DAO
- ✅ Global reach, large ecosystem
- ❌ Chậm, đắt, không private

**2. Hyperledger Fabric:**

- ✅ Private, permissioned, modular
- ✅ Tốt cho: Supply chain, Banking, Healthcare
- ✅ Nhanh, rẻ, private
- ❌ Phức tạp, cần consortium

**3. Decision Framework:**

```
Cần public + token? → Ethereum
Cần private + compliance? → Fabric
Cần cả hai? → Hybrid approach
```

**4. Không có "nền tảng tốt nhất":**

- Chỉ có "nền tảng phù hợp nhất"
- Phụ thuộc vào use case cụ thể
- Cân nhắc kỹ requirements trước khi chọn

**5. Future Trends:**

- **Ethereum**: Layer 2 scaling, privacy solutions (zk-SNARKs)
- **Fabric**: Better tooling, easier deployment
- **Interoperability**: Cross-chain bridges

---
