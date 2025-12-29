# トレーニング資料: BLOCKCHAIN システム開発 (ETHEREUM/EVM)

> **目的**: 技術チームに基礎知識と実践的な統合スキルを提供する。
>
> **Tech Stack**: Solidity (Smart Contract), Ethers.js (Client library), Node.js (Backend)

---

## 📖 公式ドキュメント

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

## 📚 目次

1. [パート 1: 送金とトランザクション業務](#パート1-送金とトランザクション業務)
2. [パート 2: ウォレット、署名と認証 (Client-side)](#パート2-ウォレット署名と認証-client-side)
3. [パート 3: イベント処理](#パート3-イベント処理)
4. [パート 4: Off-chain 統合 (Backend Node.js)](#パート4-off-chain統合-backend-nodejs)
5. [パート 5: セキュリティと監査入門](#パート5-セキュリティと監査入門)
6. [パート 6: 総合演習](#パート6-総合演習)
7. [パート 7: Ethereum vs Hyperledger Fabric の比較](#パート7-ethereum-vs-hyperledger-fabric-の比較)

---

## パート 1: 送金とトランザクション業務

### 1.1. ETH vs ERC20 の送金メカニズム

Ethereum エコシステムには、全く異なるメカニズムで動作する 2 種類のデジタル資産があります：

#### 🔷 Native Token (ETH)

**ETH** は Ethereum ネットワークのネイティブ通貨（native currency）です。ETH の送金は blockchain の **プロトコルレベルで直接処理**されます。

**特徴:**

- ETH の残高は **blockchain の state** に保存され、ウォレットアドレスに紐付けられています
- Smart contract による管理は不要
- Ethereum 上のすべてのトランザクションは ETH で gas 手数料を支払う必要があります
- コード実行が不要なため、処理速度が速い

**例:**

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

**コード例 (Ethers.js):**

```javascript
// 自分のウォレットから別のウォレットへ ETH を送金
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"), // 1 ETH を送金
});

console.log("Transaction hash:", tx.hash);
await tx.wait(); // transaction が confirm されるまで待機
console.log("Transfer completed!");
```

#### 🔶 ERC20 Token

**ERC20** はカスタムトークンを作成するための **Smart Contract 標準**です。実際、ERC20 token は従来の意味での「通貨」ではなく、**Smart Contract によって管理されるデータ**です。

> 📖 **参考資料**: [ERC20 Token Standard (EIP-20)](https://eips.ethereum.org/EIPS/eip-20)

**特徴:**

- 残高はウォレット内にあるのではなく、contract 内の**データ行**です
- Contract は「テーブル」(mapping) 形式で残高を保存: `ウォレットアドレス → トークン数量`
- トークンの送金 = contract の `transfer()` 関数を呼び出す
- Contract 関数を実行するために ETH で gas を支払う必要があります

**例:**

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

**シンプルな ERC20 Smart Contract のコード例:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleERC20 {
    string public name = "My Token";
    string public symbol = "MTK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    // 各アドレスの残高を保存するテーブル
    mapping(address => uint256) public balanceOf;

    // 委任権限 (allowance) を保存するテーブル
    mapping(address => mapping(address => uint256)) public allowance;

    // 送金時のイベント
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 _initialSupply) {
        totalSupply = _initialSupply * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply; // deploy した人に全トークンを割り当て
    }

    // トークン送金関数
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

**ERC20 との連携コード例 (Ethers.js):**

```javascript
// ERC20 contract の ABI（必要な関数のみ）
const ERC20_ABI = [
  // address の残高を返す
  "function balanceOf(address owner) view returns (uint256)",
  // address にトークン数量を送金
  "function transfer(address to, uint256 amount) returns (bool)",
  // spender が owner からトークンを引き出すことを許可
  "function approve(address spender, uint256 amount) returns (bool)",
  // spender が owner から引き出せるトークン数量を返す
  "function allowance(address owner, address spender) view returns (uint256)",
];

// Ethereum Mainnet 上の USDT contract アドレス
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

// Contract に接続
const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

// 残高確認
const balance = await usdtContract.balanceOf(myAddress);
console.log("Balance:", ethers.formatUnits(balance, 6)); // USDT は 6 decimals

// 他の人に 100 USDT を送金
const tx = await usdtContract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6) // 100 USDT
);
await tx.wait();
console.log("Transfer completed!");
```

---

### 1.2. 重要な 3 つの関数: transfer / transferFrom / approve

これらは ERC20 標準の**3 つのコア関数**で、柔軟かつ安全にトークン送金を管理するのに役立ちます。

#### 🔹 関数 `transfer(address to, uint256 amount)`

**目的:** ウォレットの所有者が自分のトークンを他の人に送る。

**動作方法:**

1. 関数を呼び出した人（`msg.sender`）がトークンを送りたい
2. Contract が `msg.sender` の残高を確認
3. 十分な残高があれば、`msg.sender` から減額し `to` に加算
4. `Transfer` イベントを発行

**実例:**

- 友達に 50 USDT を送る
- MetaMask ウォレットから自分の Ledger ウォレットに 100 DAI を送る

**Solidity コード:**

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

**JavaScript コード (Ethers.js):**

```javascript
// 友達に 50 USDT を送る
const tx = await usdtContract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // 友達のアドレス
  ethers.parseUnits("50", 6) // 50 USDT
);
await tx.wait();
console.log("50 USDT の送金が完了しました！");
```

---

#### 🔹 関数 `approve(address spender, uint256 amount)`

**目的:** 別のアドレス（人または Smart Contract）に**あなたのお金を使う権限**を制限付きで付与する。

**動作方法:**

1. `approve(spender, amount)` を呼び出す
2. Contract が記録: 「アドレス `spender` はあなたのウォレットから最大 `amount` トークンを取得できる」
3. この情報は mapping `allowance[owner][spender]` に保存される

**なぜ approve が必要？**

- DEX（Uniswap、PancakeSwap）は取引を実行するためにあなたのウォレットからトークンを取得する権限が必要
- dApp（lending、staking）は期限が来たときに自動的にトークンを引き出す権限が必要

**実例:**

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

**Solidity コード:**

```solidity
function approve(address spender, uint256 amount) public returns (bool) {
    require(spender != address(0), "Cannot approve zero address");

    allowance[msg.sender][spender] = amount;

    emit Approval(msg.sender, spender, amount);
    return true;
}
```

**JavaScript コード (Ethers.js):**

```javascript
// Uniswap Router にウォレットから 1000 USDT を取得する権限を付与
const UNISWAP_ROUTER = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

const tx = await usdtContract.approve(
  UNISWAP_ROUTER,
  ethers.parseUnits("1000", 6) // 1000 USDT を approve
);
await tx.wait();
console.log("Approve が完了しました！");

// allowance を確認
const allowance = await usdtContract.allowance(myAddress, UNISWAP_ROUTER);
console.log("Allowance:", ethers.formatUnits(allowance, 6), "USDT");
```

**⚠️ セキュリティ注意:**

- **大きすぎる数量を approve しない**（例: `2^256 - 1`）。contract がハッキングされた場合、ハッカーがあなたのお金をすべて引き出せます
- 必要な数量だけ approve すべき
- 使用後は `approve(spender, 0)` を呼び出して権限を取り消すべき

---

#### 🔹 関数 `transferFrom(address from, address to, uint256 amount)`

**目的:** approve されたアドレスが**他人のウォレットからお金を引き出して**送金できるようにする。

**動作方法:**

1. 関数を呼び出した人（`msg.sender`）が `from` のウォレットからトークンを取得したい
2. Contract が確認: `from` は `msg.sender` に approve したか？
3. 確認: approve された数量は十分か？
4. 有効な場合: `from` から減額、`to` に加算、allowance を減らす

**実例:**

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

**Solidity コード:**

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

**JavaScript コード (Ethers.js) - DEX Smart Contract の例:**

```solidity
// あなたの DEX contract が transferFrom を使用してユーザーからトークンを取得
// File: DEX.sol (簡略化)

contract SimpleDEX {
    IERC20 public usdtToken;

    constructor(address _usdtAddress) {
        usdtToken = IERC20(_usdtAddress);
    }

    // ユーザーはこの関数を呼び出す前に approve する必要があります
    function deposit(uint256 amount) external {
        // ユーザーのウォレットから USDT を取得してこの contract に送金
        usdtToken.transferFrom(msg.sender, address(this), amount);

        // 後続処理のロジック（DEX 内のユーザー残高を更新...）
    }
}
```

**総合フロー図:**

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

#### 📝 3 つの関数のまとめ

| 関数             | 誰が呼び出す？   | 何をする？                                         | 実例                                           |
| ---------------- | ---------------- | -------------------------------------------------- | ---------------------------------------------- |
| **transfer**     | ウォレット所有者 | 自分でトークンを他の人に送る                       | 友達に送金                                     |
| **approve**      | ウォレット所有者 | 別のアドレスにトークンを取得する権限を付与         | Uniswap で swap するために approve             |
| **transferFrom** | approve された人 | 他人のウォレットからトークンを取得（approve 済み） | Uniswap が swap 時に自動的にトークンを引き出す |

---

### 1.3. コア概念: Nonce、Gas、Confirmations

#### 🔢 Nonce (Number Only Used Once)

**定義:** Nonce は、あるアドレスからのトランザクションの**シーケンス番号**で、0 から始まり順次増加します。

> 📖 **参考資料**: [Ethereum Transactions - Nonce](https://ethereum.org/en/developers/docs/transactions/#nonce)

**なぜ Nonce が必要？**

1. **Replay Attack を防ぐ:**

   - Nonce がなければ、ハッカーは有効なトランザクションをコピーして何度も再送信できます
   - 例: 友達に 1 ETH を送る。Nonce がなければ、ハッカーはそのトランザクションをコピーして、あなたがさらに多くの ETH を失う可能性があります

2. **実行順序を保証:**
   - Nonce 0 のトランザクションが完了してから、Nonce 1 が処理されます
   - Nonce 1 が Nonce 0 より先に到着した場合、Nonce 0 が完了するまで pending 状態になります

**例:**

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

**コード例 (Ethers.js):**

```javascript
// ウォレットの現在の nonce を取得
const nonce = await provider.getTransactionCount(myAddress);
console.log("Current nonce:", nonce);

// 特定の nonce でトランザクションを送信
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  nonce: nonce, // nonce を指定
});

// 複数のトランザクションを並行送信（nonce を順次増加）
const tx1 = await signer.sendTransaction({
  to: addressB,
  value: ethers.parseEther("1.0"),
  nonce: nonce,
});

const tx2 = await signer.sendTransaction({
  to: addressC,
  value: ethers.parseEther("2.0"),
  nonce: nonce + 1, // 手動で増加
});

const tx3 = await signer.sendTransaction({
  to: addressD,
  value: ethers.parseEther("3.0"),
  nonce: nonce + 2,
});
```

**⚠️ よくあるエラー:**

```javascript
// ❌ 間違い: nonce を指定せずに2つのトランザクションを同時に送信
const tx1 = await signer.sendTransaction({
  to: addressB,
  value: ethers.parseEther("1.0"),
});
const tx2 = await signer.sendTransaction({
  to: addressC,
  value: ethers.parseEther("2.0"),
});
// → 両方のトランザクションが同じ nonce を持つ → 後のトランザクションが前のトランザクションを置き換える

// ✅ 正しい: nonce を明示的に指定
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

#### ⛽ Gas (トランザクション手数料)

**定義:** Gas は、Ethereum ネットワークがあなたのトランザクションを処理するために実行する必要がある**作業量の測定単位**です。

> 📖 **参考資料**:
>
> - [Gas and Fees](https://ethereum.org/en/developers/docs/gas/)
> - [EIP-1559: Fee Market](https://eips.ethereum.org/EIPS/eip-1559)

**手数料計算式:**

```
Transaction Fee = Gas Used × Gas Price

Where:
- Gas Used: 実際に消費された gas（トランザクションの複雑さに依存）
- Gas Price: gas 単位あたりに支払う価格（単位: Gwei）

1 Gwei = 0.000000001 ETH = 10^-9 ETH
```

**具体例:**

```
ETH Transfer Transaction:
- Gas Used: 21,000 gas (固定)
- Gas Price: 50 Gwei

Transaction Fee = 21,000 × 50 = 1,050,000 Gwei
                = 0.00105 ETH
                ≈ $2.1 (ETH = $2000 の場合)

ERC20 Token Transfer Transaction:
- Gas Used: 65,000 gas (より複雑)
- Gas Price: 50 Gwei

Transaction Fee = 65,000 × 50 = 3,250,000 Gwei
                = 0.00325 ETH
                ≈ $6.5
```

**Gas の種類:**

1. **Gas Limit:** 支払う意思がある最大 gas 量

   - 低すぎる設定 → トランザクション失敗だが手数料は失われる
   - 高すぎる設定 → 実際に使用した gas のみ消費される

2. **Gas Price:** gas 単位あたりに支払う価格

   - 高い → トランザクションが速く処理される（優先）
   - 低い → トランザクションが遅いか stuck する

3. **Base Fee + Priority Fee (EIP-1559):**

   - **Base Fee:** 基本手数料、ネットワーク負荷に応じて自動調整（burn される）
   - **Priority Fee (Tip):** マイナー/バリデーターへのチップでトランザクションを優先

   > 📖 **詳細**: [Understanding EIP-1559](https://ethereum.org/en/developers/docs/gas/#eip-1559)

**コード例 (Ethers.js):**

```javascript
// 現在の gas price を取得
const feeData = await provider.getFeeData();
console.log("Gas Price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");

// カスタム gas price でトランザクションを送信
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  gasLimit: 21000, // gas 制限
  gasPrice: ethers.parseUnits("50", "gwei"), // 50 Gwei
});

// EIP-1559 を使用（maxFeePerGas + maxPriorityFeePerGas）
const tx2 = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  maxFeePerGas: ethers.parseUnits("100", "gwei"), // 最大 100 Gwei
  maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"), // チップ 2 Gwei
});

// トランザクションの gas を見積もる
const estimatedGas = await signer.estimateGas({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
});
console.log("Estimated Gas:", estimatedGas.toString());

// Contract 関数呼び出しの gas を見積もる
const estimatedGasForTransfer = await usdtContract.transfer.estimateGas(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
);
console.log(
  "Estimated Gas for ERC20 transfer:",
  estimatedGasForTransfer.toString()
);
```

#### 🤖 自動 Gas 処理（Gas Limit と Gas Price を指定しない）

ほとんどの場合、**gas limit と gas price を手動で指定する必要はありません**。Ethers.js（および他のライブラリ）が自動的に処理します。

> 📖 **参考資料**: [Ethers.js - Gas Price](https://docs.ethers.org/v6/api/providers/#Provider-getFeeData)

**動作メカニズム:**

```javascript
// ✅ 最もシンプルな方法 - ライブラリに自動処理させる
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  // gasLimit、gasPrice、maxFeePerGas... を指定する必要なし
});

// Ethers.js が自動的に:
// 1. eth_estimateGas を呼び出して gas limit を計算
// 2. eth_gasPrice または eth_feeHistory を呼び出して適切な gas price を取得
// 3. トランザクション失敗を防ぐため gas limit に ~20% のバッファを追加
```

**自動プロセス:**

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

**詳細例:**

```javascript
// ============================================
// 方法1: ライブラリに自動処理させる（推奨）
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

// 出力例:
// Gas Limit (auto): 25200 (21000 + 20% buffer)
// Gas Price (auto): 45.5 Gwei (ネットワークから自動取得)

// ============================================
// 方法2: 一部を指定、残りは自動
// ============================================

// gas price のみ指定、gas limit は自動
const tx2 = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  gasPrice: ethers.parseUnits("100", "gwei"), // 優先度を上げるため高い gas price を指定
  // gasLimit は自動見積もり
});

// gas limit のみ指定、gas price は自動
const tx3 = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
  gasLimit: 30000, // 特定の gas limit を指定
  // gasPrice はネットワークから自動取得
});

// ============================================
// 方法3: 使用される gas を事前に確認
// ============================================
const txRequest = {
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
};

// gas limit を見積もる
const estimatedGas = await signer.estimateGas(txRequest);
console.log("Estimated Gas:", estimatedGas.toString());

// 現在の fee data を取得
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

// 予想コストを計算
const estimatedCost = estimatedGas * feeData.gasPrice;
console.log("Estimated Cost:", ethers.formatEther(estimatedCost), "ETH");

// その後トランザクションを送信（まだ自動）
const tx4 = await signer.sendTransaction(txRequest);
```

**いつ手動で gas を指定すべきか？**

| 状況                        | 解決策                                      | 理由                                           |
| --------------------------- | ------------------------------------------- | ---------------------------------------------- |
| **Transaction が stuck**    | `gasPrice` または `maxFeePerGas` を上げる   | トランザクションを優先して速く処理             |
| **Gas estimation が間違い** | より高い `gasLimit` を指定                  | 一部の複雑な contract では estimation が不正確 |
| **手数料を節約したい**      | `maxPriorityFeePerGas` を 0-1 Gwei に下げる | 待ち時間が長くなることを受け入れて節約         |
| **ネットワークが混雑**      | `maxFeePerGas` を 2-3 倍に上げる            | トランザクションが処理されることを保証         |
| **Backend 自動化**          | `gasLimit` を固定で指定                     | 毎回 estimation する時間を節約                 |

**gas estimation が失敗した場合のエラー処理例:**

```javascript
async function sendTransactionWithFallback(signer, txRequest) {
  try {
    // 自動 gas でトランザクションを送信
    const tx = await signer.sendTransaction(txRequest);
    console.log("✓ Transaction sent with auto gas:", tx.hash);
    return tx;
  } catch (error) {
    if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
      console.log("⚠ Gas estimation failed, using manual gas limit...");

      // Fallback: 手動で gas limit を指定
      const tx = await signer.sendTransaction({
        ...txRequest,
        gasLimit: 500000, // 高い gas limit を設定して保証
      });

      console.log("✓ Transaction sent with manual gas:", tx.hash);
      return tx;
    }

    throw error; // 他のエラーは上に投げる
  }
}

// 使用例
const tx = await sendTransactionWithFallback(signer, {
  to: contractAddress,
  data: contractInterface.encodeFunctionData("complexFunction", [
    param1,
    param2,
  ]),
});
```

**ベストプラクティス:**

1. **開発/テスト環境:**

   ```javascript
   // 完全に自動 - デバッグが簡単
   const tx = await signer.sendTransaction({ to, value });
   ```

2. **本番環境 (Frontend):**

   ```javascript
   // ユーザーに送信前に見積もりを表示
   const estimatedGas = await signer.estimateGas({ to, value });
   const feeData = await provider.getFeeData();
   const estimatedCost = estimatedGas * feeData.gasPrice;

   // 表示: "Estimated fee: 0.0015 ETH"
   // ユーザーが確認 -> トランザクションを送信（まだ自動）
   const tx = await signer.sendTransaction({ to, value });
   ```

3. **本番環境 (Backend):**

   ```javascript
   // 速い処理を保証するため高い gas price を指定
   const feeData = await provider.getFeeData();

   const tx = await signer.sendTransaction({
     to,
     value,
     maxFeePerGas: (feeData.maxFeePerGas * 120n) / 100n, // 20% 増加
     maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"), // 固定チップ
   });
   ```

**Smart Contract での処理:**

```javascript
// Contract 関数呼び出し - Gas 自動
const tx = await contract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
  // gas を指定する必要なし
);

// gas をオーバーライドしたい場合
const tx2 = await contract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6),
  {
    gasLimit: 100000, // gas limit をオーバーライド
    maxFeePerGas: ethers.parseUnits("100", "gwei"), // max fee をオーバーライド
  }
);

// 呼び出し前に gas を見積もる
const estimatedGas = await contract.transfer.estimateGas(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
);
console.log("Estimated gas for transfer:", estimatedGas.toString());
```

**📊 Gas Used 参考表:**

| トランザクションタイプ | Gas Used (平均)      |
| ---------------------- | -------------------- |
| ETH 送金               | 21,000               |
| ERC20 Token 送金       | 50,000 - 80,000      |
| ERC20 Approve          | 45,000 - 50,000      |
| Uniswap で Swap        | 150,000 - 200,000    |
| NFT Mint               | 80,000 - 150,000     |
| Smart Contract Deploy  | 500,000 - 2,000,000+ |

---

#### ✅ Confirmations (確認数)

**定義:** Confirmations は、**あなたのトランザクションを含むブロックの後に生成されたブロック数**です。

> 📖 **参考資料**: [Transaction Finality](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#finality)

**なぜ Confirmations が必要？**

Blockchain は **Re-org (Reorganization)** される可能性があります - つまり、より長いチェーンが出現したためにブロックチェーンが「逆転」する可能性があります。これによりあなたのトランザクションがキャンセルされる可能性があります。

**例:**

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

**コード例 (Ethers.js):**

```javascript
// トランザクションを送信
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("10.0"),
});

console.log("Transaction hash:", tx.hash);
console.log("Transaction sent! Waiting for confirmations...");

// 1 confirmation を待つ（デフォルト）
const receipt = await tx.wait();
console.log("Transaction confirmed in block:", receipt.blockNumber);

// 12 confirmations を待つ（より安全）
const receipt12 = await tx.wait(12);
console.log("Transaction confirmed with 12 blocks!");

// リアルタイムで confirmations を追跡
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

    // 3秒待ってから再確認
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

// 使用例
await waitForConfirmations(tx.hash, 12);
```

**Backend ベストプラクティス (Node.js):**

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
      // トランザクションがマイニングされるまで待つ
      const receipt = await this.provider.waitForTransaction(txHash);

      if (receipt.status === 0) {
        console.log(`[User ${userId}] ❌ Transaction failed!`);
        await this.updateDatabase(userId, txHash, "FAILED");
        return false;
      }

      console.log(
        `[User ${userId}] Transaction mined in block ${receipt.blockNumber}`
      );

      // 十分な confirmations を待つ
      await this.waitForConfirmations(txHash, this.requiredConfirmations);

      console.log(`[User ${userId}] ✓ Deposit confirmed! Updating balance...`);

      // データベースを更新
      await this.updateDatabase(userId, txHash, "CONFIRMED", amount);

      // 通知メールを送信
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
    // データベース更新をシミュレート
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

// 使用例
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const monitor = new TransactionMonitor(provider, 12);

// ユーザーが取引所に入金したとき
app.post("/api/deposit/notify", async (req, res) => {
  const { userId, txHash, amount } = req.body;

  // バックグラウンドで monitor を実行
  monitor.monitorDeposit(txHash, userId, amount);

  res.json({ message: "Deposit is being monitored" });
});
```

---

### 📝 パート 1 のまとめ

**覚えておくべき重要なポイント:**

1. **ETH vs ERC20:**

   - ETH = Native token、送金が速い、手数料が低い
   - ERC20 = Smart contract、送金が遅い、手数料が高い

2. **ERC20 の 3 つの関数:**

   - `transfer()`: 自分で送金
   - `approve()`: 権限を付与
   - `transferFrom()`: 権限を付与された人が引き出し

3. **Nonce:**

   - トランザクションのシーケンス番号
   - 順次実行: 0 → 1 → 2 → ...
   - Replay attack を防ぐ

4. **Gas:**

   - 手数料 = Gas Used × Gas Price
   - ETH 送金: ~21,000 gas
   - ERC20 送金: ~50,000-80,000 gas

5. **Confirmations:**

   - 重要なトランザクションは 12+ confirmations を待つ
   - Re-org attack を回避
   - Backend は database を更新する前に confirmations を監視する必要がある

6. **自動 Gas:**
   - Ethers.js が gas limit と gas price を自動見積もり
   - 必要な場合のみ手動指定（transaction stuck、gas estimation エラー...）
   - ベストプラクティス: 開発環境では自動、本番環境で優先が必要な場合は手動指定

---

## パート 2: ウォレット、署名と認証 (Client-side)

### 2.1. MetaMask 接続 (EIP-1193)

**MetaMask** は最も人気のある Ethereum ウォレットで、**ブラウザ拡張機能**として動作します。`window.ethereum` オブジェクトを通じて、あなたのウェブサイトと blockchain の間の**橋渡し**役を果たします。

> 📖 **参考資料**:
>
> - [MetaMask Documentation](https://docs.metamask.io/)
> - [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)

#### 🔌 EIP-1193: Ethereum Provider JavaScript API

**EIP-1193** は dApp とウォレット間の通信標準です。MetaMask はウェブページに `window.ethereum` オブジェクトを注入し、以下が可能になります：

- ウォレット接続をリクエスト
- トランザクションを送信
- メッセージに署名
- Blockchain データを読み取る

**MetaMask がインストールされているか確認:**

```javascript
// 方法1: シンプルなチェック
if (typeof window.ethereum !== "undefined") {
  console.log("✓ MetaMask is installed!");
} else {
  console.log("❌ MetaMask is NOT installed");
  alert("Please install MetaMask!");
}

// 方法2: より詳細なチェック
function checkMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    // MetaMask かどうかを確認（他のウォレットの可能性もある）
    if (window.ethereum.isMetaMask) {
      console.log("✓ MetaMask detected");
      return true;
    } else {
      console.log("⚠ Another wallet detected:", window.ethereum);
      return true; // それでも使用可能
    }
  } else {
    console.log("❌ No Ethereum wallet detected");
    return false;
  }
}

// 方法3: 複数のウォレットをチェック（MetaMask、Coinbase Wallet、Trust Wallet...）
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

#### 🔗 ウォレット接続 (Request Accounts)

**接続プロセス:**

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

**基本的なコード例:**

```javascript
// シンプルなウォレット接続関数
async function connectWallet() {
  try {
    // MetaMask をチェック
    if (typeof window.ethereum === "undefined") {
      alert("Please install MetaMask!");
      window.open("https://metamask.io/download/", "_blank");
      return null;
    }

    // 接続をリクエスト
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    const userAddress = accounts[0];
    console.log("✓ Connected:", userAddress);

    return userAddress;
  } catch (error) {
    if (error.code === 4001) {
      // ユーザーがリクエストを拒否
      console.log("❌ User rejected connection");
      alert("You rejected the connection request");
    } else {
      console.error("Error connecting:", error);
      alert("Failed to connect wallet");
    }
    return null;
  }
}

// 使用例
const address = await connectWallet();
if (address) {
  document.getElementById("wallet-address").innerText = address;
}
```

**高度なコード例 (Ethers.js を使用):**

```javascript
import { ethers } from "ethers";

class WalletManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
  }

  // ウォレット接続
  async connect() {
    try {
      // MetaMask をチェック
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed");
      }

      // window.ethereum から provider を作成
      this.provider = new ethers.BrowserProvider(window.ethereum);

      // 接続をリクエスト
      await this.provider.send("eth_requestAccounts", []);

      // signer を取得（トランザクション送信用）
      this.signer = await this.provider.getSigner();

      // ウォレットアドレスを取得
      this.address = await this.signer.getAddress();

      // Chain ID を取得（1 = Ethereum Mainnet、56 = BSC、137 = Polygon...）
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

  // 切断（UI 側のみ、MetaMask から実際に切断するわけではない）
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    console.log("✓ Disconnected");
  }

  // 接続済みかチェック
  isConnected() {
    return this.address !== null;
  }

  // ETH 残高を取得
  async getBalance() {
    if (!this.address) throw new Error("Not connected");

    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  // ETH を送金
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

// 使用例
const wallet = new WalletManager();

// 接続
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

// 残高を表示
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

#### 🔄 変更イベントをリッスン

MetaMask は使用中に変更される可能性があります：

- ユーザーが別のアカウントに切り替える
- ユーザーが別のネットワークに切り替える（Ethereum → BSC）
- ユーザーが切断する

**イベントリスニングのコード:**

```javascript
// ユーザーがアカウントを変更したときにリッスン
window.ethereum.on("accountsChanged", (accounts) => {
  if (accounts.length === 0) {
    // ユーザーが切断
    console.log("❌ User disconnected");
    wallet.disconnect();
    document.getElementById("address").innerText = "Not connected";
  } else {
    // ユーザーがアカウントを切り替え
    const newAddress = accounts[0];
    console.log("🔄 Account changed:", newAddress);
    wallet.address = newAddress;
    document.getElementById("address").innerText = newAddress;

    // データを再読み込み
    loadUserData(newAddress);
  }
});

// ユーザーがネットワークを変更したときにリッスン
window.ethereum.on("chainChanged", (chainIdHex) => {
  const chainId = parseInt(chainIdHex, 16);
  console.log("🔄 Chain changed:", chainId);

  // ベストプラクティス: ネットワーク変更時にページをリロード
  window.location.reload();
});

// MetaMask が切断されたときにリッスン
window.ethereum.on("disconnect", (error) => {
  console.log("❌ MetaMask disconnected:", error);
  wallet.disconnect();
  alert("MetaMask disconnected. Please reconnect.");
});

// コンポーネントのアンマウント時にクリーンアップ（React/Vue）
function cleanup() {
  window.ethereum.removeAllListeners("accountsChanged");
  window.ethereum.removeAllListeners("chainChanged");
  window.ethereum.removeAllListeners("disconnect");
}
```

#### 🌐 ネットワーク切り替え (Switch Chain)

特定のネットワークへの切り替えをユーザーにリクエストする必要がある場合があります（例: dApp が BSC でのみ動作する）。

> 📖 **参考資料**: [MetaMask - Add/Switch Network](https://docs.metamask.io/wallet/how-to/add-network/)

**ネットワーク切り替えのコード:**

```javascript
// 一般的な Chain IDs
const CHAIN_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_SEPOLIA: 11155111,
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
};

// ネットワーク情報
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

// ネットワーク切り替え関数
async function switchNetwork(targetChainId) {
  try {
    // MetaMask に既にあるネットワークに切り替えを試みる
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });

    console.log("✓ Switched to chain:", targetChainId);
    return true;
  } catch (error) {
    // ネットワークが MetaMask に追加されていない場合
    if (error.code === 4902) {
      try {
        // 新しいネットワークを追加
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
      // ユーザーが拒否
      console.log("❌ User rejected network switch");
      return false;
    } else {
      console.error("Failed to switch network:", error);
      throw error;
    }
  }
}

// 使用例
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

// トランザクション実行前に呼び出す
await ensureBSCNetwork();
```

#### 🎨 完全な UI Component (React)

```jsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";

function WalletConnect() {
  const [address, setAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // 以前に接続していたかチェック
  useEffect(() => {
    checkIfWalletIsConnected();

    // イベントをリッスン
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

  // 以前に接続していたかチェック
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

  // ウォレット接続
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

  // 切断
  function disconnectWallet() {
    setAddress(null);
    setBalance(null);
    setChainId(null);
  }

  // 残高を更新
  async function updateBalance(provider, address) {
    const balance = await provider.getBalance(address);
    setBalance(ethers.formatEther(balance));
  }

  // アカウント変更時の処理
  function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAddress(accounts[0]);
      checkIfWalletIsConnected();
    }
  }

  // ネットワーク変更時の処理
  function handleChainChanged() {
    window.location.reload();
  }

  // アドレスをフォーマット: 0x1234...5678
  function formatAddress(addr) {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  }

  // ネットワーク名
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

### 2.2. Provider vs Signer (Ethers.js ライブラリ)

Ethers.js には、**Provider** と **Signer** という 2 つの重要な概念があります。

> 📖 **参考資料**:
>
> - [Ethers.js - Providers](https://docs.ethers.org/v6/api/providers/)
> - [Ethers.js - Signers](https://docs.ethers.org/v6/api/providers/#Signer)

#### 📖 Provider (読み取り専用)

**Provider** は**読み取り専用**（read-only）のオブジェクトで、以下の用途に使用されます：

- Blockchain 情報を取得（block number、gas price...）
- ウォレット残高を読み取る
- Smart contract の `view`/`pure` 関数を呼び出す（gas 不要）
- Transaction receipt を取得

Provider を使用する際、**ユーザー確認は不要**です。

**Provider の種類:**

```javascript
import { ethers } from "ethers";

// 1. BrowserProvider - MetaMask 経由で接続
const provider = new ethers.BrowserProvider(window.ethereum);

// 2. JsonRpcProvider - RPC URL 経由で接続（Backend）
const provider = new ethers.JsonRpcProvider(
  "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
);

// 3. AlchemyProvider - Alchemy 経由で接続
const provider = new ethers.AlchemyProvider("mainnet", "YOUR_API_KEY");

// 4. InfuraProvider - Infura 経由で接続
const provider = new ethers.InfuraProvider("mainnet", "YOUR_API_KEY");
```

**Provider の使用例:**

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);

// 現在の block number を取得
const blockNumber = await provider.getBlockNumber();
console.log("Current block:", blockNumber);

// Gas price を取得
const feeData = await provider.getFeeData();
console.log("Gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");

// アドレスの残高を取得
const balance = await provider.getBalance(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
);
console.log("Balance:", ethers.formatEther(balance), "ETH");

// Transaction 情報を取得
const tx = await provider.getTransaction(
  "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
);
console.log("Transaction:", tx);

// Block 情報を取得
const block = await provider.getBlock(blockNumber);
console.log("Block:", block);

// Smart contract を読み取る（view function）
const ERC20_ABI = ["function balanceOf(address) view returns (uint256)"];
const usdtContract = new ethers.Contract(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ERC20_ABI,
  provider // 読み取りには provider のみ必要
);

const balance = await usdtContract.balanceOf(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
);
console.log("USDT Balance:", ethers.formatUnits(balance, 6));
```

#### ✍️ Signer (書き込み権限あり)

**Signer** は**書き込み権限**（write）を持つオブジェクトで、以下の用途に使用されます：

- Transaction を送信（ETH 送金、token 送金...）
- Smart contract の state を変更する関数を呼び出す
- メッセージに署名

Signer を使用する際、**ユーザー確認が必要**（MetaMask で「Confirm」をクリック）です。

**Provider から Signer を取得:**

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Signer のアドレスを取得
const address = await signer.getAddress();
console.log("Signer address:", address);
```

**Signer の使用例:**

```javascript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 1. ETH を送金
const tx = await signer.sendTransaction({
  to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  value: ethers.parseEther("1.0"),
});
console.log("Transaction sent:", tx.hash);
await tx.wait();
console.log("Transaction confirmed!");

// 2. Smart contract 関数を呼び出す（write function）
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];
const usdtContract = new ethers.Contract(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  ERC20_ABI,
  signer // 書き込みには signer が必要
);

const tx2 = await usdtContract.transfer(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  ethers.parseUnits("100", 6)
);
console.log("Transfer transaction:", tx2.hash);
await tx2.wait();
console.log("Transfer confirmed!");

// 3. メッセージに署名
const message = "Hello, Ethereum!";
const signature = await signer.signMessage(message);
console.log("Signature:", signature);
```

#### 🔄 Provider と Signer の切り替え

```javascript
// Provider を使った Contract（読み取り専用）
const contractReadOnly = new ethers.Contract(address, abi, provider);
const balance = await contractReadOnly.balanceOf(userAddress);

// Signer を使った Contract（書き込み可能）
const contractWithSigner = new ethers.Contract(address, abi, signer);
const tx = await contractWithSigner.transfer(toAddress, amount);

// または既存の contract から切り替え
const contractWithSigner = contractReadOnly.connect(signer);
```

#### 📊 Provider vs Signer の比較

| 基準                 | Provider                               | Signer                                    |
| -------------------- | -------------------------------------- | ----------------------------------------- |
| **権限**             | 読み取り専用（read-only）              | 読み取り + 書き込み（read-write）         |
| **ユーザー確認必要** | 不要                                   | 必要（MetaMask popup）                    |
| **ユースケース**     | データ読み取り、view function 呼び出し | Transaction 送信、write function 呼び出し |
| **例**               | 残高確認、contract 読み取り            | 送金、NFT mint                            |
| **作成元**           | RPC URL、Alchemy、Infura、MetaMask     | Provider（`getSigner()` 経由）            |
| **Gas 手数料**       | 不要                                   | 必要                                      |

---

### 2.3. SIWE (Sign-In With Ethereum)

**SIWE**（Sign-In With Ethereum）は、従来の username/password の代わりに Ethereum ウォレットでログインする標準です。

> 📖 **参考資料**:
>
> - [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
> - [SIWE Official Documentation](https://docs.login.xyz/)
> - [SIWE NPM Package](https://www.npmjs.com/package/siwe)

#### 🔐 なぜ SIWE を使うのか？

**メリット:**

- ✅ アカウント登録不要（email、password 不要）
- ✅ パスワード漏洩の心配なし
- ✅ 暗号署名（cryptographic signature）による認証
- ✅ ユーザーが自分のアイデンティティを完全にコントロール

**デメリット:**

- ❌ ユーザーはウォレット（MetaMask...）をインストールする必要がある
- ❌ Private key を失うとアカウントを失う
- ❌ 技術に詳しくないユーザーには不親切

#### 🔄 SIWE のワークフロー

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

#### 💻 Frontend コード例

```javascript
// File: frontend/auth.js
import { ethers } from "ethers";

class SIWEAuth {
  constructor(backendUrl) {
    this.backendUrl = backendUrl;
    this.token = localStorage.getItem("auth_token");
  }

  // ログイン
  async signIn() {
    try {
      // 1. ウォレット接続
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      console.log("Signing in with address:", address);

      // 2. Backend から nonce を取得
      const nonceResponse = await fetch(`${this.backendUrl}/auth/nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const { nonce } = await nonceResponse.json();
      console.log("Received nonce:", nonce);

      // 3. SIWE 標準に従って message を作成
      const message = this.createSIWEMessage(address, nonce);
      console.log("Message to sign:", message);

      // 4. Message に署名
      const signature = await signer.signMessage(message);
      console.log("Signature:", signature);

      // 5. Signature を backend に送信して検証
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

      // 6. Token を保存
      this.token = token;
      localStorage.setItem("auth_token", token);

      console.log("✓ Signed in successfully:", user);
      return user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  }

  // SIWE 標準（EIP-4361）に従って message を作成
  createSIWEMessage(address, nonce) {
    const domain = window.location.host;
    const origin = window.location.origin;
    const statement = "Sign in to MyApp";

    // SIWE 標準フォーマット
    return `${domain} wants you to sign in with your Ethereum account:
${address}

${statement}

URI: ${origin}
Version: 1
Chain ID: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;
  }

  // ログアウト
  signOut() {
    this.token = null;
    localStorage.removeItem("auth_token");
    console.log("✓ Signed out");
  }

  // ログイン済みかチェック
  isAuthenticated() {
    return this.token !== null;
  }

  // API 呼び出し用の token を取得
  getAuthHeader() {
    return {
      Authorization: `Bearer ${this.token}`,
    };
  }
}

// 使用例
const auth = new SIWEAuth("http://localhost:3000");

// ログイン
document.getElementById("signin-btn").addEventListener("click", async () => {
  try {
    const user = await auth.signIn();
    alert(`Welcome, ${user.address}!`);
    window.location.href = "/dashboard";
  } catch (error) {
    alert("Sign in failed: " + error.message);
  }
});

// ログアウト
document.getElementById("signout-btn").addEventListener("click", () => {
  auth.signOut();
  window.location.href = "/";
});

// Token を使って API を呼び出す
async function getUserProfile() {
  const response = await fetch("http://localhost:3000/api/profile", {
    headers: auth.getAuthHeader(),
  });
  const profile = await response.json();
  return profile;
}
```

#### 🖥️ Backend コード例（Node.js + Express）

```javascript
// File: backend/server.js
const express = require("express");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Database シミュレーション（実際には MongoDB、PostgreSQL などを使用）
const users = new Map(); // address -> user data
const nonces = new Map(); // address -> nonce

// 1. Nonce 取得 endpoint
app.post("/auth/nonce", (req, res) => {
  const { address } = req.body;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Invalid address" });
  }

  // ランダムな nonce を生成
  const nonce = crypto.randomBytes(16).toString("hex");

  // Nonce を保存（5 分後に期限切れ）
  nonces.set(address.toLowerCase(), {
    nonce,
    expiresAt: Date.now() + 5 * 60 * 1000,
  });

  console.log(`Generated nonce for ${address}: ${nonce}`);

  res.json({ nonce });
});

// 2. Signature 検証 endpoint
app.post("/auth/verify", async (req, res) => {
  try {
    const { address, message, signature } = req.body;

    // Input をチェック
    if (!address || !message || !signature) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const addressLower = address.toLowerCase();

    // Nonce をチェック
    const nonceData = nonces.get(addressLower);
    if (!nonceData) {
      return res.status(400).json({ error: "Nonce not found" });
    }

    if (Date.now() > nonceData.expiresAt) {
      nonces.delete(addressLower);
      return res.status(400).json({ error: "Nonce expired" });
    }

    // Signature を検証
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== addressLower) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // 使用済み nonce を削除
    nonces.delete(addressLower);

    // User を作成または更新
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

    // JWT token を作成
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

// 3. JWT 認証 Middleware
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

// 4. Protected API（ログイン必要）
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

// 5. Public API（ログイン不要）
app.get("/api/stats", (req, res) => {
  res.json({
    totalUsers: users.size,
    timestamp: new Date().toISOString(),
  });
});

// Server を起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

#### 📦 公式 SIWE ライブラリの使用

自分で実装する代わりに、公式ライブラリを使用できます：

```bash
npm install siwe
```

> 📖 **参考資料**: [SIWE Library Documentation](https://docs.login.xyz/libraries/typescript)

**SIWE ライブラリを使用した Backend:**

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
    cookie: { secure: false }, // HTTPS を使用する場合は true
  })
);

// 1. Nonce を取得
app.get("/auth/nonce", (req, res) => {
  req.session.nonce = crypto.randomBytes(16).toString("hex");
  res.json({ nonce: req.session.nonce });
});

// 2. 検証
app.post("/auth/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;

    // SIWE 標準に従って message を parse
    const siweMessage = new SiweMessage(message);

    // Signature と nonce を検証
    const fields = await siweMessage.verify({
      signature,
      nonce: req.session.nonce,
    });

    // User を session に保存
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

### 📝 パート 2 のまとめ

**覚えておくべき重要なポイント:**

1. **MetaMask 接続:**

   - `window.ethereum` が存在するか確認
   - `eth_requestAccounts` で接続をリクエスト
   - `accountsChanged`、`chainChanged` イベントをリッスン
   - `wallet_switchEthereumChain` でネットワークを切り替え可能

2. **Provider vs Signer:**

   - **Provider**: 読み取り専用、ユーザー確認不要
   - **Signer**: 書き込み可能、ユーザー確認必要（MetaMask popup）
   - Provider はデータ読み取り用、Signer は transaction 送信用

3. **SIWE (Sign-In With Ethereum):**

   - Username/password の代わりにウォレットでログイン
   - ワークフロー: Nonce 取得 → メッセージ署名 → Signature 検証 → JWT 発行
   - Backend は `ethers.verifyMessage()` で検証
   - 公式 `siwe` ライブラリを使用可能

4. **ベストプラクティス:**
   - MetaMask がインストールされているか常に確認
   - ユーザーが接続を拒否した場合のエラー処理
   - ユーザーがネットワークを変更したらページをリロード
   - Token を localStorage（または cookie）に保存
   - Backend で signature を検証、frontend を信頼しない

---

## パート 3: イベント処理

Events（イベント）は Smart contract の重要なメカニズムで、contract が重要な活動を**記録**し、外部アプリケーションに**通知**することを可能にします。

> 📖 **参考資料**:
>
> - [Solidity Events](https://docs.soliditylang.org/en/latest/contracts.html#events)
> - [Ethers.js - Contract Events](https://docs.ethers.org/v6/api/contract/#ContractEvent)

### 3.1. ERC20 の Transfer イベント

#### 📢 なぜ Events が必要？

**Events** は 3 つの主要な問題を解決します：

1. **Logging**: Contract の活動履歴を記録（変更不可）
2. **Notification**: 変更があった際に frontend に通知
3. **Gas 節約**: Events にデータを保存する方が storage より遥かに安い

**コスト比較:**

```
1 uint256 を storage に保存:     ~20,000 gas
1 uint256 を event に保存:        ~375 gas
→ 50 倍安い！
```

#### 🔔 ERC20 の Transfer イベント

`Transfer` イベントは ERC20 標準で最も重要なイベントで、トークン送金のたびに発行されます。

**Solidity での定義:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ERC20 {
    // 3 つのパラメータを持つ Transfer イベント
    // indexed: このパラメータでフィルタリング可能
    event Transfer(
        address indexed from,    // 送信者
        address indexed to,      // 受信者
        uint256 value            // 数量
    );

    // Approval イベント
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

        // Transfer イベントを発行
        emit Transfer(msg.sender, to, amount);

        return true;
    }

    function mint(address to, uint256 amount) public {
        balanceOf[to] += amount;

        // Mint の場合、from = address(0)
        emit Transfer(address(0), to, amount);
    }

    function burn(uint256 amount) public {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");

        balanceOf[msg.sender] -= amount;

        // Burn の場合、to = address(0)
        emit Transfer(msg.sender, address(0), amount);
    }
}
```

#### 🔍 `indexed` パラメータ

`indexed` とマークされたパラメータは、イベントをクエリする際に**フィルタリング**できます。

**ルール:**

- 1 つのイベントに最大 **3 つの indexed パラメータ**
- `indexed` パラメータは **topics** に保存（検索しやすい）
- `indexed` でないパラメータは **data** に保存（検索しにくい）

**例:**

```solidity
event Transfer(
    address indexed from,    // Topic 1: フィルタリング可能
    address indexed to,      // Topic 2: フィルタリング可能
    uint256 value            // Data: 直接フィルタリング不可
);

// クエリ可能:
// - アドレス A からのすべてのトランザクション
// - アドレス B へのすべてのトランザクション
// - A から B へのすべてのトランザクション
// 直接クエリ不可: value > 1000 のすべてのトランザクション
```

#### 📊 Event Log の構造

イベントが発行されると、**transaction receipt** に以下の構造で保存されます：

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

### 3.2. 過去のイベント取得 (Past Events)

過去に発生したイベントをクエリして、トランザクション履歴を構築できます。

#### 📜 Ethers.js で Past Events をクエリ

**例 1: すべての Transfer トランザクションを取得**

```javascript
import { ethers } from "ethers";

// Contract に接続
const provider = new ethers.JsonRpcProvider(
  "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
);

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address) view returns (uint256)",
];

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

// 最近の 1000 ブロックのすべての Transfer events を取得
const currentBlock = await provider.getBlockNumber();
const fromBlock = currentBlock - 1000;

const events = await contract.queryFilter(
  contract.filters.Transfer(), // Filter: すべての Transfer events
  fromBlock,
  currentBlock
);

console.log(`Found ${events.length} Transfer events`);

// 各イベントを処理
events.forEach((event) => {
  console.log({
    from: event.args.from,
    to: event.args.to,
    value: ethers.formatUnits(event.args.value, 6), // USDT は 6 decimals
    blockNumber: event.blockNumber,
    transactionHash: event.transactionHash,
  });
});
```

**例 2: 特定のアドレスへの送金を取得**

```javascript
const USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Filter: TO = USER_ADDRESS のイベントのみ取得
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

**例 3: 特定のアドレスからの送金を取得**

```javascript
const USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Filter: FROM = USER_ADDRESS のイベントのみ取得
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

**例 4: 2 つの特定のアドレス間のトランザクションを取得**

```javascript
const ADDRESS_A = "0xAAA...";
const ADDRESS_B = "0xBBB...";

// Filter: FROM = A AND TO = B
const filter = contract.filters.Transfer(ADDRESS_A, ADDRESS_B);

const events = await contract.queryFilter(filter, fromBlock, currentBlock);

console.log(`Found ${events.length} transfers from A to B`);
```

#### 🔧 Transaction History の構築

**例: ユーザーの完全なトランザクション履歴を作成**

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

  // Token 情報を取得
  const decimals = await contract.decimals();
  const symbol = await contract.symbol();

  // 送信イベントを取得
  const sentFilter = contract.filters.Transfer(userAddress, null);
  const sentEvents = await contract.queryFilter(sentFilter, fromBlock, toBlock);

  // 受信イベントを取得
  const receivedFilter = contract.filters.Transfer(null, userAddress);
  const receivedEvents = await contract.queryFilter(
    receivedFilter,
    fromBlock,
    toBlock
  );

  // 結合して block number でソート
  const allEvents = [...sentEvents, ...receivedEvents].sort(
    (a, b) => a.blockNumber - b.blockNumber
  );

  // 結果をフォーマット
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

// 使用例
const history = await getTransactionHistory(
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  18000000, // From block
  18001000 // To block
);

console.log("Transaction History:");
console.table(history);
```

#### ⚠️ Past Events クエリ時の注意点

**1. Block range の制限:**

```javascript
// ❌ 間違い: Range が大きすぎるとエラー
const events = await contract.queryFilter(filter, 0, currentBlock);
// Error: query returned more than 10000 results

// ✅ 正しい: 複数のチャンクに分割
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

    // Rate limit を避けるため遅延
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return allEvents;
}

// 使用例
const events = await queryEventsInChunks(
  contract,
  contract.filters.Transfer(userAddress, null),
  18000000,
  18100000
);
```

**2. Rate limiting:**

```javascript
// 複数回クエリする場合は retry logic を実装
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

### 3.3. リアルタイム登録 (Event Listeners)

過去のイベントをクエリする代わりに、**リアルタイムでイベントをリッスン**して UI を即座に更新できます。

#### 🎧 Ethers.js でイベントをリッスン

**例 1: すべての Transfer イベントをリッスン**

```javascript
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);

const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const contract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

// すべての Transfer イベントをリッスン
contract.on("Transfer", (from, to, value, event) => {
  console.log("🔔 New Transfer detected!");
  console.log({
    from: from,
    to: to,
    value: ethers.formatUnits(value, 6),
    blockNumber: event.log.blockNumber,
    transactionHash: event.log.transactionHash,
  });

  // UI を更新
  updateUI(from, to, value);
});

console.log("✓ Listening for Transfer events...");
```

**例 2: 特定のアドレスへの Transfer をリッスン**

```javascript
const USER_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

// Filter: TO = USER_ADDRESS のイベントのみリッスン
const filter = contract.filters.Transfer(null, USER_ADDRESS);

contract.on(filter, (from, to, value, event) => {
  console.log("💰 You received tokens!");
  console.log({
    from: from,
    amount: ethers.formatUnits(value, 6),
    txHash: event.log.transactionHash,
  });

  // 通知を表示
  showNotification(
    `Received ${ethers.formatUnits(value, 6)} USDT from ${from}`
  );

  // 残高を更新
  updateBalance();
});
```

**例 3: 複数のイベントをリッスン**

```javascript
// Transfer と Approval の両方をリッスン
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

#### 🛑 イベントリッスンを停止

```javascript
// 方法 1: 特定のイベントのリッスンを停止
const listener = (from, to, value, event) => {
  console.log("Transfer:", { from, to, value });
};

contract.on("Transfer", listener);

// 後で停止
contract.off("Transfer", listener);

// 方法 2: 1 つのイベントのすべての listeners を停止
contract.removeAllListeners("Transfer");

// 方法 3: Contract のすべての listeners を停止
contract.removeAllListeners();
```

#### 🎨 実践例: Real-time Transaction Monitor（React）

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

        // User への Transfer イベントをリッスン
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

          // Browser notification を表示
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

    // Component unmount 時のクリーンアップ
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

#### 🎯 Event Listeners のベストプラクティス

**1. Component unmount 時のクリーンアップ（React/Vue）:**

```javascript
useEffect(() => {
  const contract = new ethers.Contract(address, abi, provider);

  const listener = (from, to, value) => {
    console.log("Transfer:", { from, to, value });
  };

  contract.on("Transfer", listener);

  // クリーンアップ
  return () => {
    contract.off("Transfer", listener);
  };
}, []);
```

**2. エラー処理:**

```javascript
contract.on("Transfer", (from, to, value, event) => {
  try {
    // イベント処理
    updateUI(from, to, value);
  } catch (error) {
    console.error("Error handling Transfer event:", error);
    // Listener をクラッシュさせないため error を throw しない
  }
});
```

**3. 複数のイベントに対する Debounce:**

```javascript
let debounceTimer;

contract.on("Transfer", (from, to, value, event) => {
  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    // 500ms 間新しいイベントがない場合に処理
    updateUI();
  }, 500);
});
```

---

### 3.4. Smart Contract での Custom Events

Smart contract の特別な活動に対して custom events を作成できます。

#### 📝 例: NFT Marketplace

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

        // 売り手に支払いを送金
        payable(listing.seller).transfer(listing.price);

        // 超過支払いを返金
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

#### 🎧 Custom Events をリッスン

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

// ItemListed をリッスン
marketplace.on("ItemListed", (tokenId, seller, price, timestamp, event) => {
  console.log("🆕 New item listed!");
  console.log({
    tokenId: tokenId.toString(),
    seller: seller,
    price: ethers.formatEther(price),
    timestamp: new Date(Number(timestamp) * 1000).toISOString(),
  });

  // UI を更新: リストにアイテムを追加
  addItemToList(tokenId, seller, price);
});

// ItemSold をリッスン
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

    // UI を更新: リストからアイテムを削除
    removeItemFromList(tokenId);

    // Notification を表示
    showNotification(
      `NFT #${tokenId} sold for ${ethers.formatEther(price)} ETH`
    );
  }
);

// PriceUpdated をリッスン
marketplace.on(
  "PriceUpdated",
  (tokenId, oldPrice, newPrice, timestamp, event) => {
    console.log("💲 Price updated!");
    console.log({
      tokenId: tokenId.toString(),
      oldPrice: ethers.formatEther(oldPrice),
      newPrice: ethers.formatEther(newPrice),
    });

    // UI を更新: 価格を更新
    updateItemPrice(tokenId, newPrice);
  }
);
```

---

### 📝 パート 3 のまとめ

**覚えておくべき重要なポイント:**

1. **Events とは:**

   - Smart contract の logging メカニズム
   - Storage に保存するより遥かに安い
   - 記録後は変更不可
   - クエリとリアルタイムリッスンが可能

2. **`indexed` パラメータ:**

   - 最大 3 つの indexed パラメータ
   - クエリ時にフィルタリング可能
   - Topics に保存（検索しやすい）

3. **Past Events のクエリ:**

   - `queryFilter()` で過去のイベントを取得
   - Block range を小さく分割（大量クエリを避ける）
   - Rate limiting のため再試行ロジックを実装
   - Transaction history を構築可能

4. **Event Listeners:**

   - `contract.on()` でリアルタイムリッスン
   - `contract.off()` または `removeAllListeners()` でクリーンアップを忘れずに
   - Listener 内でエラー処理してクラッシュを防ぐ
   - 特定のイベントをフィルタリング可能

5. **ベストプラクティス:**
   - 重要な活動には常に events を発行
   - フィルタリングが必要なパラメータには indexed を使用
   - 使用しない場合は listeners をクリーンアップ
   - Listeners 内にエラーハンドリングを実装
   - イベントが多すぎる場合は debounce を使用

---

## パート 4: Off-chain 統合 (Backend Node.js)

Backend は blockchain システムで重要な役割を果たし、frontend では実行できないタスクを処理します：

- 自動的に transaction を送信
- Events を監視して database を更新
- Webhook を処理
- Private keys を安全に管理

> 📖 **参考資料**:
>
> - [Ethers.js - Wallets](https://docs.ethers.org/v6/api/wallet/)
> - [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### 4.1. Private Key で署名 (Backend Wallet)

Backend には MetaMask がないため、private key から wallet を作成する必要があります。

#### 🔐 Private Key から Wallet を作成

**⚠️ セキュリティ注意:**

- **絶対に** private key を Git にコミットしない
- Private key を `.env` ファイルに保存
- `.gitignore` を使用して `.env` を除外
- Production では secret management service を使用（AWS Secrets Manager、HashiCorp Vault...）

**基本例:**

```javascript
// File: backend/wallet.js
require("dotenv").config();
const { ethers } = require("ethers");

// 1. RPC Provider 経由で接続
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// 2. Private key から wallet を作成
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

console.log("Wallet address:", wallet.address);

// 3. 残高を確認
async function checkBalance() {
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
}

checkBalance();
```

**`.env` ファイル:**

```bash
# RPC Provider
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Wallet Private Key (このファイルをコミットしない！)
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret123
```

**`.gitignore` ファイル:**

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

#### 💰 Backend から ETH を送金

```javascript
// File: backend/sendETH.js
require("dotenv").config();
const { ethers } = require("ethers");

async function sendETH(toAddress, amountInEther) {
  try {
    // 1. Wallet をセットアップ
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    console.log("Sending from:", wallet.address);
    console.log("Sending to:", toAddress);
    console.log("Amount:", amountInEther, "ETH");

    // 2. 残高を確認
    const balance = await provider.getBalance(wallet.address);
    const amount = ethers.parseEther(amountInEther);

    if (balance < amount) {
      throw new Error("Insufficient balance");
    }

    // 3. Transaction を送信
    const tx = await wallet.sendTransaction({
      to: toAddress,
      value: amount,
    });

    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    // 4. Confirmation を待つ
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

// 使用例
sendETH("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "0.1");
```

#### 🪙 Backend から ERC20 Token を送金

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
    // 1. Wallet をセットアップ
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // 2. Token contract に接続
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    // 3. Token 情報を取得
    const symbol = await tokenContract.symbol();
    const decimals = await tokenContract.decimals();

    console.log(`Sending ${amount} ${symbol}...`);
    console.log("From:", wallet.address);
    console.log("To:", toAddress);

    // 4. 残高を確認
    const balance = await tokenContract.balanceOf(wallet.address);
    const amountInWei = ethers.parseUnits(amount, decimals);

    if (balance < amountInWei) {
      throw new Error(`Insufficient ${symbol} balance`);
    }

    // 5. Token を送金
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

// 使用例
sendToken(
  "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
  "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "100" // 100 USDT
);
```

#### 🏭 Wallet Manager Class (Production 対応)

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

  // ETH 残高を取得
  async getBalance() {
    const balance = await this.provider.getBalance(this.address);
    return ethers.formatEther(balance);
  }

  // Token 残高を取得
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

  // ETH を送金
  async sendETH(to, amountInEther, options = {}) {
    const amount = ethers.parseEther(amountInEther);

    // 残高を確認
    const balance = await this.provider.getBalance(this.address);
    if (balance < amount) {
      throw new Error("Insufficient ETH balance");
    }

    // Transaction を送信
    const tx = await this.wallet.sendTransaction({
      to: to,
      value: amount,
      ...options, // gasLimit, gasPrice, etc.
    });

    console.log(`[ETH Transfer] TX: ${tx.hash}`);

    // Confirmation を待つ
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status === 1 ? "SUCCESS" : "FAILED",
    };
  }

  // ERC20 token を送金
  async sendToken(tokenAddress, to, amount, options = {}) {
    const ERC20_ABI = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function balanceOf(address) view returns (uint256)",
      "function decimals() view returns (uint8)",
      "function symbol() view returns (string)",
    ];

    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.wallet);

    // Token 情報を取得
    const [decimals, symbol, balance] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
      contract.balanceOf(this.address),
    ]);

    const amountInWei = ethers.parseUnits(amount, decimals);

    // 残高を確認
    if (balance < amountInWei) {
      throw new Error(`Insufficient ${symbol} balance`);
    }

    // Transaction を送信
    const tx = await contract.transfer(to, amountInWei, options);

    console.log(`[${symbol} Transfer] TX: ${tx.hash}`);

    // Confirmation を待つ
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

  // Transaction の gas を見積もる
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

  // Transaction 履歴を取得
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

// 使用例
const walletManager = new WalletManager(
  process.env.RPC_URL,
  process.env.PRIVATE_KEY
);

// 残高を確認
walletManager.getBalance().then((balance) => {
  console.log("ETH Balance:", balance);
});

// ETH を送金
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

### 4.2. RPC Provider の使用

RPC Provider はアプリケーションと blockchain の間の橋渡しです。さまざまな種類の provider があります。

#### 🌐 RPC Provider の種類

**1. Public RPC（無料だが不安定）:**

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

**2. Alchemy（Production 推奨）:**

```javascript
require("dotenv").config();
const { ethers } = require("ethers");

// Alchemy Provider
const provider = new ethers.AlchemyProvider(
  "mainnet", // または "sepolia", "polygon", "arbitrum"
  process.env.ALCHEMY_API_KEY
);

// または完全な URL で JsonRpcProvider を使用
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

// または
const provider = new ethers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
);
```

**4. QuickNode:**

```javascript
const provider = new ethers.JsonRpcProvider(process.env.QUICKNODE_URL);
// URL format: https://your-endpoint.quiknode.pro/YOUR_API_KEY/
```

#### 🔄 Fallback Provider（信頼性向上）

複数の provider を使用して、1 つの provider でエラーが発生した場合に自動的に切り替え：

```javascript
const { ethers } = require("ethers");

// 複数の providers で FallbackProvider を作成
const providers = [
  new ethers.AlchemyProvider("mainnet", process.env.ALCHEMY_API_KEY),
  new ethers.InfuraProvider("mainnet", process.env.INFURA_API_KEY),
  new ethers.JsonRpcProvider(
    "https://api.zan.top/node/v1/eth/mainnet/7d5a7370dd004a1f913078deb248af07"
  ),
];

const fallbackProvider = new ethers.FallbackProvider(providers);

// 通常の provider として使用
const blockNumber = await fallbackProvider.getBlockNumber();
console.log("Current block:", blockNumber);
```

#### 🔁 RPC Calls の Retry Logic

```javascript
// File: backend/utils/rpcHelper.js
async function callWithRetry(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);

      if (i === maxRetries - 1) {
        throw error; // Retry 回数を使い果たしたらエラーを throw
      }

      // Exponential backoff: 1s, 2s, 4s...
      const waitTime = delay * Math.pow(2, i);
      console.log(`Retrying in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
}

// 使用例
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Retry 付きで block number を取得
const blockNumber = await callWithRetry(async () => {
  return await provider.getBlockNumber();
});

console.log("Block number:", blockNumber);

// Retry 付きで transaction を送信
const tx = await callWithRetry(async () => {
  return await wallet.sendTransaction({
    to: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    value: ethers.parseEther("0.1"),
  });
});

console.log("Transaction sent:", tx.hash);
```

---

### 📝 パート 4 のまとめ

**覚えておくべき重要なポイント:**

1. **Backend Wallet:**

   - Private key から wallet を作成
   - Private key を `.env` に保存（Git にコミットしない）
   - WalletManager class を使用して管理
   - エラーハンドリングと retry logic を実装

2. **RPC Provider:**

   - Production では Alchemy/Infura を使用
   - 高い信頼性のため FallbackProvider を実装
   - Performance と latency を監視
   - Exponential backoff で retry logic を実装

3. **ベストプラクティス:**
   - 常に input を検証
   - Retry logic を実装
   - RPC calls の rate limiting

---

## パート 5: セキュリティと監査入門

セキュリティは Smart contract で最も重要な要素です。小さなミスが数百万ドルの損失につながる可能性があります。

> 📖 **参考資料**:
>
> - [Smart Contract Security Best Practices](https://consensys.github.io/smart-contract-best-practices/)
> - [OpenZeppelin Security](https://docs.openzeppelin.com/contracts/security)
> - [SWC Registry](https://swcregistry.io/) - 一般的な脆弱性のリスト

### 5.1. Reentrancy Attack（再入攻撃）

**Reentrancy** は Smart contract で最も危険な脆弱性で、2016 年の The DAO ハックで 6000 万ドルの被害をもたらしました。

#### 🔴 Reentrancy の脆弱性

**動作方法:**

```
1. User が Contract A の withdraw() を呼び出す
2. Contract A が User（ハッカーの Contract B）に ETH を送金
3. Contract B が ETH を受け取り、fallback function がトリガーされる
4. Contract B が Contract A の withdraw() を再度呼び出す（REENTRANCY!）
5. Contract A はまだ balance を更新していないため、チェックは通過
6. Contract A が再び Contract B に ETH を送金
7. Contract A の資金が尽きるまで繰り返す
```

**脆弱性のあるコード:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ❌ 脆弱性のある CONTRACT - 使用しないでください！
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // ❌ REENTRANCY 脆弱性のある関数
    function withdraw() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        // ❌ 間違い: balance を更新する前に送金
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");

        // この行は reentrancy 時に実行されない
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint256) {
        return balances[msg.sender];
    }
}
```

**攻撃 Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVulnerableBank {
    function deposit() external payable;
    function withdraw() external;
}

// ハッカーの Contract
contract Attacker {
    IVulnerableBank public bank;
    uint256 public attackCount;

    constructor(address _bankAddress) {
        bank = IVulnerableBank(_bankAddress);
    }

    // 攻撃開始
    function attack() external payable {
        require(msg.value >= 1 ether, "Need at least 1 ETH");

        // Bank に deposit
        bank.deposit{value: msg.value}();

        // 出金開始（reentrancy をトリガー）
        bank.withdraw();
    }

    // Fallback function - ETH 受信時に呼ばれる
    receive() external payable {
        attackCount++;

        // Bank にまだ資金があれば withdraw() を再度呼び出す
        if (address(bank).balance >= 1 ether) {
            bank.withdraw();
        }
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
```

#### ✅ Reentrancy の防止方法

**1. Checks-Effects-Interactions Pattern:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ✅ 方法 1: Checks-Effects-Interactions Pattern
contract SafeBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint256 balance = balances[msg.sender];

        // 1. CHECKS: 条件をチェック
        require(balance > 0, "Insufficient balance");

        // 2. EFFECTS: 送金前に state を更新
        balances[msg.sender] = 0;

        // 3. INTERACTIONS: 外部 contract と相互作用
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

**2. OpenZeppelin の ReentrancyGuard:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// ✅ 方法 2: ReentrancyGuard を使用
contract SafeBankWithGuard is ReentrancyGuard {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // nonReentrant modifier が reentrancy を防ぐ
    function withdraw() public nonReentrant {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "Insufficient balance");

        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }
}
```

#### 🧪 Reentrancy Attack のテスト

```javascript
// File: test/reentrancy.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Reentrancy Attack", function () {
  let vulnerableBank, safeBank, attacker;
  let owner, user1, hacker;

  beforeEach(async function () {
    [owner, user1, hacker] = await ethers.getSigners();

    // Vulnerable bank をデプロイ
    const VulnerableBank = await ethers.getContractFactory("VulnerableBank");
    vulnerableBank = await VulnerableBank.deploy();

    // Safe bank をデプロイ
    const SafeBank = await ethers.getContractFactory("SafeBank");
    safeBank = await SafeBank.deploy();

    // Vulnerable bank に deposit
    await vulnerableBank
      .connect(user1)
      .deposit({ value: ethers.parseEther("10") });
  });

  it("Should be vulnerable to reentrancy attack", async function () {
    // Attacker contract をデプロイ
    const Attacker = await ethers.getContractFactory("Attacker");
    attacker = await Attacker.deploy(await vulnerableBank.getAddress());

    const bankBalanceBefore = await ethers.provider.getBalance(
      await vulnerableBank.getAddress()
    );
    console.log("Bank balance before:", ethers.formatEther(bankBalanceBefore));

    // Attacker が 1 ETH を deposit して攻撃
    await attacker.connect(hacker).attack({ value: ethers.parseEther("1") });

    const bankBalanceAfter = await ethers.provider.getBalance(
      await vulnerableBank.getAddress()
    );
    const attackerBalance = await attacker.getBalance();

    console.log("Bank balance after:", ethers.formatEther(bankBalanceAfter));
    console.log("Attacker balance:", ethers.formatEther(attackerBalance));
    console.log("Attack count:", await attacker.attackCount());

    // Bank が空になった
    expect(bankBalanceAfter).to.equal(0);
    expect(attackerBalance).to.be.gt(ethers.parseEther("1"));
  });

  it("Should be safe from reentrancy attack", async function () {
    // Safe bank に deposit
    await safeBank.connect(user1).deposit({ value: ethers.parseEther("10") });

    // Safe bank を標的とする attacker contract をデプロイ
    const Attacker = await ethers.getContractFactory("Attacker");
    attacker = await Attacker.deploy(await safeBank.getAddress());

    // 攻撃は失敗する
    await expect(
      attacker.connect(hacker).attack({ value: ethers.parseEther("1") })
    ).to.be.reverted;
  });
});
```

#### 🔍 Reentrancy の詳細分析

**なぜ Reentrancy が危険なのか？**

1. **State が更新されていない:** Contract が送金前に balance を更新していない
2. **External call がコードをトリガー:** `call()` が他の contract のコードをトリガーできる
3. **Recursive calls:** Attacker が withdraw 関数を複数回呼び出す
4. **Gas limit:** Gas が尽きるか contract の資金が尽きるまで続く

**攻撃のタイムライン:**

```
Block 1:
  Attacker.attack() が Bank.deposit(1 ETH) を呼び出す
  → Bank.balances[Attacker] = 1 ETH

Block 2:
  Attacker.attack() が Bank.withdraw() を呼び出す

  1 回目:
    ├─ Bank がチェック: balances[Attacker] = 1 ETH ✓
    ├─ Bank が Attacker に 1 ETH を送金
    ├─ Attacker.receive() がトリガーされる
    │   └─ Attacker が Bank.withdraw() を再度呼び出す（REENTRANCY!）
    │
    │   2 回目（ネスト）:
    │     ├─ Bank がチェック: balances[Attacker] = 1 ETH ✓（まだ更新されていない！）
    │     ├─ Bank が Attacker に 1 ETH を送金
    │     ├─ Attacker.receive() がトリガーされる
    │     │   └─ Attacker が Bank.withdraw() を呼び出す
    │     │
    │     │   3 回目（ネスト）:
    │     │     ├─ Bank がチェック: balances[Attacker] = 1 ETH ✓
    │     │     ├─ Bank が Attacker に 1 ETH を送金
    │     │     └─ ...（Bank の資金が尽きるまで繰り返す）
    │     │
    │     └─ Bank.balances[Attacker] = 0（遅すぎる！）
    │
    └─ Bank.balances[Attacker] = 0（遅すぎる！）
```

**Reentrancy の種類:**

1. **Single-Function Reentrancy:** 同じ関数を再度呼び出す
2. **Cross-Function Reentrancy:** 同じ contract の別の関数を呼び出す
3. **Cross-Contract Reentrancy:** 別の contract の関数を呼び出す

**Cross-Function Reentrancy の例:**

```solidity
// ❌ 脆弱性: Cross-Function Reentrancy
contract VulnerableBank {
    mapping(address => uint256) public balances;

    function withdraw() public {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");

        // 送金が先
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success);

        // 更新が後（間違い！）
        balances[msg.sender] = 0;
    }

    // 別の関数も exploit される可能性がある
    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // Attacker はここから withdraw() を呼び出せる
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**Reentrancy を避けるベストプラクティス:**

1. ✅ **Checks-Effects-Interactions Pattern**（最も推奨）
2. ✅ OpenZeppelin の **ReentrancyGuard**
3. ✅ **Pull over Push:** ユーザーが自分で引き出す方式
4. ✅ **Mutex locks:** State variable を使用してロック
5. ✅ **Gas limits:** `call()` の代わりに `transfer()` または `send()` を使用

**Pull over Push Pattern:**

```solidity
// ✅ 安全: Pull Payment Pattern
contract SafeBank {
    mapping(address => uint256) public balances;
    mapping(address => uint256) public pendingWithdrawals;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // Step 1: Withdrawal をリクエスト
    function requestWithdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        // State を先に更新
        balances[msg.sender] -= amount;
        pendingWithdrawals[msg.sender] += amount;
    }

    // Step 2: User が自分で引き出す（pull）
    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending withdrawal");

        // State を先に更新
        pendingWithdrawals[msg.sender] = 0;

        // 送金は後
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```

**有名な Reentrancy によるハッキング事件:**

1. **The DAO (2016):** $60 million - Ethereum のハードフォークにつながった
2. **Lendf.Me (2020):** $25 million
3. **Cream Finance (2021):** $130 million

---

### 5.2. Access Control（アクセス制御）

すべての人が機密関数を呼び出せるわけではありません。明確な権限管理メカニズムが必要です。

#### 🔐 Ownable Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is Ownable {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    // Constructor が自動的に deployer を owner に設定
    constructor() Ownable(msg.sender) {}

    // owner のみが token を mint できる
    function mint(address to, uint256 amount) public onlyOwner {
        balances[to] += amount;
        totalSupply += amount;
    }

    // owner のみが token を burn できる
    function burn(address from, uint256 amount) public onlyOwner {
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
    }

    // owner のみが所有権を移転できる
    // transferOwnership() 関数は Ownable に既に含まれている
}
```

#### 🎭 Role-Based Access Control (RBAC)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract AdvancedToken is AccessControl {
    // Roles を定義
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    bool public paused;

    constructor() {
        // Deployer がデフォルトの admin
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Admin は他の roles を付与できる
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    // MINTER_ROLE のみが mint できる
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(!paused, "Contract is paused");
        balances[to] += amount;
        totalSupply += amount;
    }

    // BURNER_ROLE のみが burn できる
    function burn(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        require(!paused, "Contract is paused");
        require(balances[from] >= amount, "Insufficient balance");
        balances[from] -= amount;
        totalSupply -= amount;
    }

    // PAUSER_ROLE のみが pause/unpause できる
    function pause() public onlyRole(PAUSER_ROLE) {
        paused = true;
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        paused = false;
    }

    // Admin は他のアドレスに role を付与できる
    function grantMinterRole(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    // Admin は role を取り消せる
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

#### 🔍 Access Control の詳細分析

**なぜ Access Control が重要なのか？**

1. **機密関数の保護:** Mint, burn, pause, upgrade
2. **明確な権限管理:** 誰が何をできるか
3. **リスクの軽減:** 不正アクセスの防止
4. **Compliance:** 法的要件への対応

**Access Control パターンの比較:**

| Pattern           | Use Case                    | 利点                   | 欠点                                         |
| ----------------- | --------------------------- | ---------------------- | -------------------------------------------- |
| **Ownable**       | Simple contracts, 1 admin   | シンプル、gas が安い   | 1 人の owner のみ、単一障害点                |
| **AccessControl** | Complex systems, 複数 roles | 柔軟、拡張性が高い     | 複雑、gas が高い                             |
| **Custom**        | Specific requirements       | 完全にカスタマイズ可能 | 自分で実装する必要がある、エラーが起きやすい |

**実例: Multi-Role を持つ DeFi Protocol:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract DeFiProtocol is AccessControl, Pausable {
    // Roles を定義
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

        // Roles を設定
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Admin がすべての roles を grant/revoke できる
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

        // Fee を計算
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

**Access Control のテスト:**

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

    // Roles を付与
    const ADMIN_ROLE = await protocol.ADMIN_ROLE();
    const OPERATOR_ROLE = await protocol.OPERATOR_ROLE();
    const PAUSER_ROLE = await protocol.PAUSER_ROLE();

    await protocol.grantRole(OPERATOR_ROLE, operator.address);
    await protocol.grantRole(PAUSER_ROLE, pauser.address);
  });

  describe("Role Management", function () {
    it("Should grant and revoke roles correctly", async function () {
      const OPERATOR_ROLE = await protocol.OPERATOR_ROLE();

      // Role をチェック
      expect(await protocol.hasRole(OPERATOR_ROLE, operator.address)).to.be
        .true;

      // Role を取り消す
      await protocol.revokeRole(OPERATOR_ROLE, operator.address);
      expect(await protocol.hasRole(OPERATOR_ROLE, operator.address)).to.be
        .false;
    });

    it("Should prevent unauthorized access", async function () {
      // User は OPERATOR_ROLE を持っていないので mint できない
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

      // Paused 時は mint がブロックされる
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

**Access Control のベストプラクティス:**

1. ✅ **Principle of Least Privilege:** 必要最小限の権限のみを付与
2. ✅ **Role Separation:** Roles を明確に分離（admin ≠ operator）
3. ✅ **Multi-sig for Admin:** Admin role には Gnosis Safe を使用
4. ✅ **Timelock for Critical Functions:** 重要な変更には遅延を設定
5. ✅ **Event Logging:** すべての権限変更をログに記録
6. ✅ **Emergency Roles:** 緊急時用の role を用意（pause）
7. ✅ **Role Hierarchy:** Admin > Operator > User
8. ✅ **Revoke Unused Roles:** 使用していない roles を取り消す

**よくある間違い:**

```solidity
// ❌ 間違い: address(0) をチェックしない
function transferOwnership(address newOwner) public onlyOwner {
    owner = newOwner; // owner を address(0) に設定できてしまう！
}

// ✅ 正しい: address(0) をチェック
function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0), "Invalid address");
    owner = newOwner;
}

// ❌ 間違い: Event を emit しない
function addAdmin(address account) public onlyOwner {
    admins[account] = true;
}

// ✅ 正しい: Event を emit
function addAdmin(address account) public onlyOwner {
    admins[account] = true;
    emit AdminAdded(account, msg.sender);
}

// ❌ 間違い: Hardcode addresses
address public admin = 0x123...;

// ✅ 正しい: Constructor で設定
constructor(address _admin) {
    require(_admin != address(0), "Invalid admin");
    admin = _admin;
}
```

**Timelock Pattern for Admin Functions:**

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

    // Step 1: Transfer をリクエスト（2 日待つ必要がある）
    function requestOwnershipTransfer(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        pendingOwner = newOwner;
        transferRequestTime = block.timestamp;

        emit OwnershipTransferRequested(owner, newOwner, block.timestamp + transferDelay);
    }

    // Step 2: Transfer を実行（2 日後）
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

    // Transfer をキャンセル
    function cancelOwnershipTransfer() external onlyOwner {
        pendingOwner = address(0);
        transferRequestTime = 0;
    }
}
```

---

### 5.3. Pausable（一時停止メカニズム）

エラーや攻撃を検出した場合、contract を即座に「凍結」する機能が必要です。

#### ⏸️ Pausable Pattern

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PausableToken is Pausable, Ownable {
    mapping(address => uint256) public balances;

    constructor() Ownable(msg.sender) {}

    // owner のみが pause できる
    function pause() public onlyOwner {
        _pause();
    }

    // owner のみが unpause できる
    function unpause() public onlyOwner {
        _unpause();
    }

    // Transfer は paused 時にブロックされる
    function transfer(address to, uint256 amount) public whenNotPaused {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }

    // Mint は paused 時でも動作（emergency mint）
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

    // Circuit breaker を起動
    function toggleCircuitBreaker() public onlyOwner {
        stopped = !stopped;
    }

    // 通常の関数 - emergency 時にブロック
    function withdraw(uint256 amount) public stopInEmergency {
        // 新しい日になったら daily counter をリセット
        if (block.timestamp / 1 days > lastWithdrawDay) {
            withdrawnToday = 0;
            lastWithdrawDay = block.timestamp / 1 days;
        }

        // Daily limit をチェック
        require(withdrawnToday + amount <= dailyLimit, "Daily limit exceeded");

        withdrawnToday += amount;

        // Withdraw logic...
    }

    // Emergency 関数 - stopped 時のみ動作
    function emergencyWithdraw() public onlyInEmergency {
        // Emergency withdraw logic...
    }
}
```

#### 🔍 Pausable Pattern の詳細分析

**なぜ Pausable が必要か？**

1. **Emergency Response:** エラー/攻撃検出時に contract を停止
2. **Maintenance:** Upgrade 時に一時停止
3. **Compliance:** 法的要件への対応（assets の凍結）
4. **Damage Control:** 問題発生時の被害を最小化

**Pause の種類:**

1. **Full Pause:** すべての関数を停止
2. **Partial Pause:** 特定の関数のみを停止
3. **Selective Pause:** Role または address ごとに停止
4. **Automatic Pause:** 異常検出時に自動停止

**Advanced Pausable の例:**

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

    // Emergency pause - min duration を待つ必要がない
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

    // Contract pause 時に停止
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

    // Pause されない（emergency function）
    function emergencyWithdraw() external {
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance");
        balances[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Transfer failed");
    }

    // View functions は pause されない
    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }
}
```

**Anomaly Detection 付き Automatic Circuit Breaker:**

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
        // 新しい時間になったら counter をリセット
        uint256 hour = block.timestamp / 1 hours;
        if (hour > currentHour) {
            withdrawnThisHour = 0;
            failedTxThisHour = 0;
            currentHour = hour;
        }

        // Anomalies をチェック
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

**Pausable のテスト:**

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

    // Balances を設定
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

      // すぐには unpause できない
      await expect(contract.connect(pauser).unpause()).to.be.revertedWith(
        "Min pause duration not met"
      );

      // 時間を進める
      await ethers.provider.send("evm_increaseTime", [3600]); // 1 hour
      await ethers.provider.send("evm_mine");

      // 今は unpause できる
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

      // すぐに unpause できる
      await contract.emergencyUnpause();
      expect(await contract.paused()).to.be.false;
    });

    it("Should allow emergency withdraw even when paused", async function () {
      await contract.connect(pauser).pause(1);

      // Emergency withdraw は動作する
      await expect(contract.connect(user).emergencyWithdraw()).to.not.be
        .reverted;
    });
  });
});
```

**Pausable のベストプラクティス:**

1. ✅ **Pause/Unpause Roles を分離:** Pauser ≠ Unpauser
2. ✅ **Min Pause Duration:** 連続した pause/unpause を防ぐ
3. ✅ **Emergency Functions:** 一部の関数は pause されない
4. ✅ **Pause Reasons:** Pause の理由をログに記録
5. ✅ **Automatic Pause:** 異常検出時に自動 pause
6. ✅ **Selective Pause:** 全体ではなく user/function ごとに pause
7. ✅ **Multi-sig for Unpause:** 複数人の承認が必要
8. ✅ **Notification:** Pause 時にユーザーに通知

**いつ Pause すべきか？**

- 🚨 セキュリティ脆弱性を検出
- 🚨 進行中の攻撃
- 🚨 Critical bug を検出
- 🚨 Transaction patterns の異常
- 🔧 Maintenance/upgrade
- ⚖️ 法的要件

**いつ Pause すべきでないか？**

- ❌ Market を操作するため
- ❌ 正当な transaction を防ぐため
- ❌ 個人的な理由
- ❌ 明確な理由がない場合

---

### 5.4. Integer Overflow/Underflow

Solidity 0.8.0 以前では、整数演算が overflow/underflow してもエラーが発生しませんでした。

#### ⚠️ Overflow/Underflow の脆弱性（Solidity < 0.8.0）

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0; // 古いバージョン

// ❌ Solidity < 0.8.0 で脆弱性あり
contract VulnerableCounter {
    uint8 public count = 255;

    function increment() public {
        count++; // Overflow: 255 + 1 = 0（エラーなし！）
    }

    function decrement() public {
        count--; // Underflow: 0 - 1 = 255（エラーなし！）
    }
}
```

#### ✅ 解決策

**1. Solidity >= 0.8.0 を使用（自動チェック）:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ✅ Solidity >= 0.8.0 で安全
contract SafeCounter {
    uint8 public count = 255;

    function increment() public {
        count++; // Overflow 時に自動で revert
    }

    function decrement() public {
        count--; // Underflow 時に自動で revert
    }
}
```

**2. SafeMath を使用（Solidity < 0.8.0）:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SafeCounterOld {
    using SafeMath for uint256;

    uint256 public count;

    function increment() public {
        count = count.add(1); // Overflow 時に revert
    }

    function decrement() public {
        count = count.sub(1); // Underflow 時に revert
    }
}
```

---

### 5.5. Front-Running Attack

Front-running は、attacker が pending transaction を見て、より高い gas price で transaction を送信し、先に処理させる攻撃です。

#### 🏃 Front-Running の例

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ❌ Front-Running に脆弱
contract VulnerableAuction {
    address public highestBidder;
    uint256 public highestBid;

    function bid() public payable {
        require(msg.value > highestBid, "Bid too low");

        // 前の bidder に返金
        if (highestBidder != address(0)) {
            payable(highestBidder).transfer(highestBid);
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
    }
}

// Attacker ができること:
// 1. Mempool で victim の bid transaction を確認
// 2. より高い gas price で bid transaction を送信
// 3. Attacker の transaction が先に処理される
// 4. Victim が outbid される
```

#### ✅ 解決策: Commit-Reveal Pattern

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

    // Phase 1: Commit（bid の hash を送信）
    function commitBid(bytes32 commitment) public payable {
        require(block.timestamp < commitPhaseEnd, "Commit phase ended");
        require(bids[msg.sender].commitment == bytes32(0), "Already committed");

        bids[msg.sender] = Bid({
            commitment: commitment,
            deposit: msg.value,
            revealed: false
        });
    }

    // Phase 2: Reveal（実際の bid を公開）
    function revealBid(uint256 amount, bytes32 secret) public {
        require(block.timestamp >= commitPhaseEnd, "Commit phase not ended");
        require(block.timestamp < revealPhaseEnd, "Reveal phase ended");

        Bid storage bid = bids[msg.sender];
        require(!bid.revealed, "Already revealed");

        // Commitment を検証
        bytes32 commitment = keccak256(abi.encodePacked(amount, secret));
        require(commitment == bid.commitment, "Invalid reveal");

        bid.revealed = true;

        // Highest bid かチェック
        if (amount > highestBid && bid.deposit >= amount) {
            highestBidder = msg.sender;
            highestBid = amount;
        }
    }

    // Phase 3: Withdraw（資金を引き出す）
    function withdraw() public {
        require(block.timestamp >= revealPhaseEnd, "Auction not ended");

        Bid storage bid = bids[msg.sender];
        require(bid.deposit > 0, "No deposit");

        uint256 refund;
        if (msg.sender == highestBidder) {
            // Winner は余剰分を受け取る
            refund = bid.deposit - highestBid;
        } else {
            // Loser は全額返金
            refund = bid.deposit;
        }

        bid.deposit = 0;
        payable(msg.sender).transfer(refund);
    }
}
```

---

### 5.6. その他の一般的な脆弱性

#### 🔓 Unprotected Functions

```solidity
// ❌ 間違い: 機密関数に access control がない
contract Vulnerable {
    address public owner;

    function setOwner(address newOwner) public {
        owner = newOwner; // 誰でも owner を変更できる！
    }
}

// ✅ 正しい: Access control を追加
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
// ❌ 間違い: External call の結果をチェックしない
contract Vulnerable {
    function sendEther(address payable recipient) public payable {
        recipient.send(msg.value); // Return value をチェックしない！
    }
}

// ✅ 正しい: 結果をチェック
contract Safe {
    function sendEther(address payable recipient) public payable {
        bool success = recipient.send(msg.value);
        require(success, "Transfer failed");
    }

    // または call を使用
    function sendEtherWithCall(address payable recipient) public payable {
        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "Transfer failed");
    }
}
```

#### 🎲 Weak Randomness

```solidity
// ❌ 間違い: Predictable randomness
contract VulnerableLottery {
    function random() public view returns (uint256) {
        // ❌ 予測可能！
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
    }
}

// ✅ 正しい: Chainlink VRF を使用
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract SafeLottery is VRFConsumerBase {
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;

    constructor()
        VRFConsumerBase(
            0x... // VRF Coordinator
            0x... // LINK Token
        )
    {
        keyHash = 0x...;
        fee = 0.1 * 10 ** 18; // 0.1 LINK
    }

    function getRandomNumber() public returns (bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness;
    }
}
```

### 📝 パート 5 のまとめ

**覚えておくべき重要なポイント:**

1. **Reentrancy Attack:**

   - Smart contract で最も危険な脆弱性
   - Checks-Effects-Interactions Pattern を使用
   - OpenZeppelin の ReentrancyGuard を使用
   - State を更新してから外部呼び出し

2. **Access Control:**

   - 機密関数を保護
   - Ownable（シンプルな場合）または AccessControl（複雑な場合）
   - Multi-sig と Timelock を使用
   - すべての権限変更をログに記録

3. **Pausable:**

   - Emergency stop メカニズムを実装
   - Owner/admin のみが pause できる
   - どの関数を pause すべきか慎重に検討
   - Pause/unpause ロジックをテスト

4. **Integer Overflow/Underflow:**

   - Solidity >= 0.8.0 を使用（自動チェック）
   - 古いバージョンでは SafeMath を使用
   - Unchecked blocks に注意

5. **Front-Running:**

   - Commit-Reveal pattern を使用
   - Time-locks を実装
   - Private transactions の使用を検討

6. **ベストプラクティス:**

   - 常に input を検証
   - External calls の return values をチェック
   - Block data を random として使用しない
   - Deploy 前にコードを監査
   - OpenZeppelin contracts を使用
   - Test coverage > 90%
   - Bug bounty program を実施

7. **セキュリティチェックリスト:**
   - ✅ Reentrancy 保護
   - ✅ Access control 実装
   - ✅ Input validation
   - ✅ Integer overflow/underflow 対策（Solidity 0.8+ は自動）
   - ✅ Gas optimization
   - ✅ Emergency pause 機能
   - ✅ Upgrade メカニズム（必要な場合）
   - ✅ 監査とテスト
   - ✅ External calls のチェック
   - ✅ Weak randomness の回避

---

## パート 6: 総合演習

このパートでは、最初から最後まで完全なアプリケーションを構築します：

1. **ERC20 Smart Contract を作成**
2. **Testnet にデプロイ**
3. **対話用の Frontend を構築**
4. **送金をテスト**

---

### 6.1. ERC20 Smart Contract の作成

#### 📋 要件

**TLCoin (KPC)** という名前のトークンを作成し、以下の機能を実装：

- ERC20 標準に準拠
- Mint 可能（owner のみ）
- Burn 可能（誰でも）
- Pause/Unpause 可能（owner のみ）
- 完全な event logging

#### 🔧 ステップ 1: 環境セットアップ

**Hardhat をインストール:**

```bash
mkdir tl-token
cd tl-token
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

選択: **Create a JavaScript project**

**OpenZeppelin をインストール:**

```bash
npm install @openzeppelin/contracts
```

#### 📝 ステップ 2: Smart Contract を作成

`contracts/TLCoin.sol` ファイルを作成:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title TLCoin
 * @dev Mint、burn、pause 機能を持つ ERC20 Token
 */
contract TLCoin is ERC20, ERC20Burnable, Ownable, Pausable {
    // Events
    event TokensMinted(address indexed to, uint256 amount, uint256 timestamp);
    event TokensBurned(address indexed from, uint256 amount, uint256 timestamp);
    event ContractPaused(address indexed by, uint256 timestamp);
    event ContractUnpaused(address indexed by, uint256 timestamp);

    // Constants
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** 18; // 10 億 token
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10 ** 18; // 1 億 token

    /**
     * @dev Constructor
     * @param initialOwner 初期 owner のアドレス
     */
    constructor(
        address initialOwner
    ) ERC20("TLCoin", "KPC") Ownable(initialOwner) {
        // Owner に initial supply を mint
        _mint(initialOwner, INITIAL_SUPPLY);
        emit TokensMinted(initialOwner, INITIAL_SUPPLY, block.timestamp);
    }

    /**
     * @dev 新しい token を mint（owner のみ）
     * @param to Token を受け取るアドレス
     * @param amount Token の数量
     */
    function mint(address to, uint256 amount) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount, block.timestamp);
    }

    /**
     * @dev Token を burn（誰でも自分の token を burn できる）
     * @param amount Burn する token の数量
     */
    function burn(uint256 amount) public override {
        super.burn(amount);
        emit TokensBurned(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev 他のアドレスから token を burn（事前に approve が必要）
     * @param account Burn する token のアドレス
     * @param amount Token の数量
     */
    function burnFrom(address account, uint256 amount) public override {
        super.burnFrom(account, amount);
        emit TokensBurned(account, amount, block.timestamp);
    }

    /**
     * @dev Contract を pause（owner のみ）
     */
    function pause() public onlyOwner {
        _pause();
        emit ContractPaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Contract を unpause（owner のみ）
     */
    function unpause() public onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender, block.timestamp);
    }

    /**
     * @dev Pausable logic を追加するため _update を override
     */
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override whenNotPaused {
        super._update(from, to, value);
    }

    /**
     * @dev Token の詳細情報を取得
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

#### 🔍 コードの解説:

**1. OpenZeppelin からの継承:**

```solidity
contract TLCoin is ERC20, ERC20Burnable, Ownable, Pausable
```

- `ERC20`: 基本的な関数を提供（transfer、approve、transferFrom）
- `ERC20Burnable`: burn と burnFrom 関数を追加
- `Ownable`: Owner 管理
- `Pausable`: Contract の pause/unpause を可能にする

**2. Constants:**

```solidity
uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18;
```

- `MAX_SUPPLY`: 総供給量の上限（10 億 token）
- `INITIAL_SUPPLY`: 初期供給量（1 億 token）
- `10**18` を掛けるのは、ERC20 がデフォルトで 18 decimals を持つため

**3. Constructor:**

```solidity
constructor(address initialOwner)
    ERC20("TLCoin", "KPC")
    Ownable(initialOwner)
```

- "TLCoin" という名前と "KPC" という symbol で token を初期化
- 初期 owner を設定
- Owner に initial supply を mint

**4. Mint 関数:**

```solidity
function mint(address to, uint256 amount) public onlyOwner {
    require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
    _mint(to, amount);
}
```

- Owner のみが呼び出せる（`onlyOwner`）
- MAX_SUPPLY を超えないかチェック
- Mint 後に event を emit

**5. \_update の Override:**

```solidity
function _update(address from, address to, uint256 value)
    internal
    override
    whenNotPaused
{
    super._update(from, to, value);
}
```

- `whenNotPaused` を追加して、contract が pause されているときに transfer をブロック
- `_update` は transfer のたびに呼ばれる internal 関数

#### 🧪 ステップ 3: テストを作成

`test/TLCoin.test.js` ファイルを作成:

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
      expect(await tlCoin.symbol()).to.equal("KPC");
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

**テストを実行:**

```bash
npx hardhat test
```

期待される結果:

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

#### 🚀 ステップ 4: Testnet にデプロイ

**1. hardhat.config.js を設定:**

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

**2. `.env` ファイルを作成:**

```bash
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
ETHERSCAN_API_KEY=your_etherscan_api_key
BSCSCAN_API_KEY=your_bscscan_api_key
```

**⚠️ 重要:** `.env` を `.gitignore` に追加:

```bash
echo ".env" >> .gitignore
```

**3. Deploy script を作成:**

`scripts/deploy.js` ファイルを作成:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying TLCoin...");

  // Deployer account を取得
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Balance をチェック
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Contract をデプロイ
  const TLCoin = await ethers.getContractFactory("TLCoin");
  const tlCoin = await TLCoin.deploy(deployer.address);

  await tlCoin.waitForDeployment();

  const contractAddress = await tlCoin.getAddress();
  console.log("✅ TLCoin deployed to:", contractAddress);

  // Token info を取得
  const tokenInfo = await tlCoin.getTokenInfo();
  console.log("\n📊 Token Information:");
  console.log("   Name:", tokenInfo.tokenName);
  console.log("   Symbol:", tokenInfo.tokenSymbol);
  console.log("   Decimals:", tokenInfo.tokenDecimals);
  console.log(
    "   Total Supply:",
    ethers.formatEther(tokenInfo.tokenTotalSupply),
    "KPC"
  );
  console.log(
    "   Max Supply:",
    ethers.formatEther(tokenInfo.tokenMaxSupply),
    "KPC"
  );
  console.log("   Is Paused:", tokenInfo.isPaused);

  // Block confirmations を待つ
  console.log("\n⏳ Waiting for block confirmations...");
  await tlCoin.deploymentTransaction().wait(5);

  // Etherscan で contract を検証
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

**4. デプロイ:**

```bash
# Sepolia にデプロイ
npx hardhat run scripts/deploy.js --network sepolia

# または BSC Testnet にデプロイ
npx hardhat run scripts/deploy.js --network bscTestnet
```

**5. Testnet token を取得:**

- **Sepolia ETH:** https://sepoliafaucet.com/
- **BSC Testnet BNB:** https://testnet.bnbchain.org/faucet-smart

---

### 6.2. Frontend の構築

次に、TLCoin と対話するための Web インターフェースを作成します。

#### 🎨 ステップ 1: React App のセットアップ

```bash
npx create-react-app tl-dapp
cd tl-dapp
npm install ethers
```

#### 📁 ステップ 2: ディレクトリ構造

```
tl-dapp/
├── src/
│   ├── components/
│   │   ├── WalletConnect.jsx
│   │   ├── TokenInfo.jsx
│   │   ├── TransferForm.jsx
│   │   └── TransactionHistory.jsx
│   ├── contracts/
│   │   └── TLCoin.json  (artifacts からコピー)
│   ├── App.js
│   └── App.css
```

#### 📝 ステップ 3: Contract ABI をコピー

```bash
# Hardhat project から ABI をコピー
cp ../tl-token/artifacts/contracts/TLCoin.sol/TLCoin.json src/contracts/
```

#### 💻 ステップ 4: Components を作成

**1. WalletConnect.jsx:**

```javascript
import { useState } from "react";
import { ethers } from "ethers";

function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("MetaMask をインストールしてください！");
        return;
      }

      // Account access をリクエスト
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Chain ID を取得
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      setAccount(accounts[0]);
      setChainId(parseInt(chainId, 16));
      setError("");

      // Provider と signer を作成
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      onConnect({
        account: accounts[0],
        provider,
        signer,
        chainId: parseInt(chainId, 16),
      });

      // Account 変更をリッスン
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          onConnect(null);
        } else {
          setAccount(accounts[0]);
          connectWallet();
        }
      });

      // Chain 変更をリッスン
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Connection error:", error);
      setError(error.message);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
    onConnect(null);
  };

  const getNetworkName = (chainId) => {
    const networks = {
      1: "Ethereum Mainnet",
      11155111: "Sepolia Testnet",
      97: "BSC Testnet",
      56: "BSC Mainnet",
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  return (
    <div className="wallet-connect">
      {!account ? (
        <button onClick={connectWallet} className="connect-btn">
          🦊 Connect Wallet
        </button>
      ) : (
        <div className="wallet-info">
          <div className="account">
            <span className="label">Account:</span>
            <span className="address">
              {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>
          <div className="network">
            <span className="label">Network:</span>
            <span className="network-name">{getNetworkName(chainId)}</span>
          </div>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default WalletConnect;
```

**2. TokenInfo.jsx:**

```javascript
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import TLCoinABI from "../contracts/TLCoin.json";

function TokenInfo({ wallet, contractAddress }) {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wallet && contractAddress) {
      loadTokenInfo();
    }
  }, [wallet, contractAddress]);

  const loadTokenInfo = async () => {
    try {
      setLoading(true);

      // Contract instance を作成
      const contract = new ethers.Contract(
        contractAddress,
        TLCoinABI.abi,
        wallet.provider
      );

      // Token info を取得
      const info = await contract.getTokenInfo();
      setTokenInfo({
        name: info.tokenName,
        symbol: info.tokenSymbol,
        decimals: info.tokenDecimals,
        totalSupply: ethers.formatEther(info.tokenTotalSupply),
        maxSupply: ethers.formatEther(info.tokenMaxSupply),
        isPaused: info.isPaused,
      });

      // User balance を取得
      const userBalance = await contract.balanceOf(wallet.account);
      setBalance(ethers.formatEther(userBalance));
    } catch (error) {
      console.error("Error loading token info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading token info...</div>;
  }

  if (!tokenInfo) {
    return null;
  }

  return (
    <div className="token-info">
      <h2>📊 Token Information</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">Name:</span>
          <span className="value">{tokenInfo.name}</span>
        </div>
        <div className="info-item">
          <span className="label">Symbol:</span>
          <span className="value">{tokenInfo.symbol}</span>
        </div>
        <div className="info-item">
          <span className="label">Total Supply:</span>
          <span className="value">
            {parseFloat(tokenInfo.totalSupply).toLocaleString()}{" "}
            {tokenInfo.symbol}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Max Supply:</span>
          <span className="value">
            {parseFloat(tokenInfo.maxSupply).toLocaleString()}{" "}
            {tokenInfo.symbol}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Your Balance:</span>
          <span className="value highlight">
            {parseFloat(balance).toLocaleString()} {tokenInfo.symbol}
          </span>
        </div>
        <div className="info-item">
          <span className="label">Status:</span>
          <span className={`value ${tokenInfo.isPaused ? "paused" : "active"}`}>
            {tokenInfo.isPaused ? "⏸️ Paused" : "✅ Active"}
          </span>
        </div>
      </div>
      <button onClick={loadTokenInfo} className="refresh-btn">
        🔄 Refresh
      </button>
    </div>
  );
}

export default TokenInfo;
```

**3. TransferForm.jsx:**

```javascript
import { useState } from "react";
import { ethers } from "ethers";
import TLCoinABI from "../contracts/TLCoin.json";

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

    // Validation
    if (!ethers.isAddress(recipient)) {
      setError("Invalid recipient address");
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    try {
      setLoading(true);

      // Contract instance を signer 付きで作成
      const contract = new ethers.Contract(
        contractAddress,
        TLCoinABI.abi,
        wallet.signer
      );

      // Balance をチェック
      const balance = await contract.balanceOf(wallet.account);
      const amountWei = ethers.parseEther(amount);

      if (balance < amountWei) {
        setError("Insufficient balance");
        setLoading(false);
        return;
      }

      // Gas を見積もる
      const gasEstimate = await contract.transfer.estimateGas(
        recipient,
        amountWei
      );
      console.log("Gas estimate:", gasEstimate.toString());

      // Transaction を送信
      const tx = await contract.transfer(recipient, amountWei, {
        gasLimit: (gasEstimate * 120n) / 100n, // 20% buffer を追加
      });

      setSuccess(`Transaction sent! Hash: ${tx.hash}`);
      console.log("Transaction hash:", tx.hash);

      // Confirmation を待つ
      const receipt = await tx.wait();
      console.log("Transaction confirmed:", receipt);

      setSuccess(
        `✅ Transfer successful! ${amount} KPC sent to ${recipient.slice(
          0,
          6
        )}...${recipient.slice(-4)}`
      );
      setRecipient("");
      setAmount("");

      // Balance を更新するための callback
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (error) {
      console.error("Transfer error:", error);

      // Error message を解析
      if (error.code === "ACTION_REJECTED") {
        setError("Transaction rejected by user");
      } else if (error.message.includes("insufficient funds")) {
        setError("Insufficient ETH for gas fee");
      } else {
        setError(error.reason || error.message || "Transfer failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transfer-form">
      <h2>💸 Transfer KPC</h2>
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
          <label>Amount (KPC):</label>
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
import TLCoinABI from "../contracts/TLCoin.json";

function TransactionHistory({ wallet, contractAddress }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet && contractAddress) {
      loadTransactions();
    }
  }, [wallet, contractAddress]);

  const loadTransactions = async () => {
    try {
      setLoading(true);

      const contract = new ethers.Contract(
        contractAddress,
        TLCoinABI.abi,
        wallet.provider
      );

      // 現在の block を取得
      const currentBlock = await wallet.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // 直近 ~10000 blocks

      // Transfer events を取得
      const filterFrom = contract.filters.Transfer(wallet.account, null);
      const filterTo = contract.filters.Transfer(null, wallet.account);

      const [eventsFrom, eventsTo] = await Promise.all([
        contract.queryFilter(filterFrom, fromBlock, currentBlock),
        contract.queryFilter(filterTo, fromBlock, currentBlock),
      ]);

      // Events を結合してソート
      const allEvents = [...eventsFrom, ...eventsTo]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 20); // 直近 20 transactions を表示

      // Transactions を整形
      const formattedTxs = await Promise.all(
        allEvents.map(async (event) => {
          const block = await event.getBlock();
          return {
            hash: event.transactionHash,
            from: event.args.from,
            to: event.args.to,
            value: ethers.formatEther(event.args.value),
            timestamp: new Date(block.timestamp * 1000).toLocaleString(),
            blockNumber: event.blockNumber,
            type:
              event.args.from.toLowerCase() === wallet.account.toLowerCase()
                ? "sent"
                : "received",
          };
        })
      );

      setTransactions(formattedTxs);
    } catch (error) {
      console.error("Error loading transactions:", error);
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
      <h2>📜 Transaction History</h2>
      <button
        onClick={loadTransactions}
        disabled={loading}
        className="refresh-btn"
      >
        {loading ? "⏳ Loading..." : "🔄 Refresh"}
      </button>

      {transactions.length === 0 ? (
        <p className="no-transactions">No transactions found</p>
      ) : (
        <div className="transactions-list">
          {transactions.map((tx, index) => (
            <div key={index} className={`transaction-item ${tx.type}`}>
              <div className="tx-header">
                <span className={`tx-type ${tx.type}`}>
                  {tx.type === "sent" ? "📤 Sent" : "📥 Received"}
                </span>
                <span className="tx-amount">
                  {parseFloat(tx.value).toFixed(4)} KPC
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

// ⚠️ YOUR_CONTRACT_ADDRESS を実際の contract address に置き換えてください
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";

function App() {
  const [wallet, setWallet] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnect = (walletData) => {
    setWallet(walletData);
  };

  const handleTransferComplete = () => {
    // Token info と transaction history を更新
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🪙 TLCoin DApp</h1>
        <p>Decentralized Token Transfer Application</p>
      </header>

      <main className="App-main">
        <WalletConnect onConnect={handleConnect} />

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
          </div>
        )}
      </main>

      <footer className="App-footer"></footer>
    </div>
  );
}

export default App;
```

**6. App.js:**

```javascript
import { useState } from "react";
import "./App.css";
import WalletConnect from "./components/WalletConnect";
import TokenInfo from "./components/TokenInfo";
import TransferForm from "./components/TransferForm";
import TransactionHistory from "./components/TransactionHistory";

// Contract address を更新してください
const CONTRACT_ADDRESS = "0x..."; // Deploy 後のアドレス

function App() {
  const [wallet, setWallet] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleConnect = (walletData) => {
    setWallet(walletData);
  };

  const handleTransferComplete = () => {
    // Balance を更新するため refresh
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🪙 TLCoin DApp</h1>
        <WalletConnect onConnect={handleConnect} />
      </header>

      {wallet && (
        <main className="App-main">
          <div className="top-section">
            <TokenInfo
              wallet={wallet}
              contractAddress={CONTRACT_ADDRESS}
              key={refreshKey}
            />
            <TransferForm
              wallet={wallet}
              contractAddress={CONTRACT_ADDRESS}
              onTransferComplete={handleTransferComplete}
            />
          </div>

          <div className="bottom-section">
            <TransactionHistory
              wallet={wallet}
              contractAddress={CONTRACT_ADDRESS}
            />
          </div>
        </main>
      )}

      {!wallet && (
        <div className="connect-prompt">
          <p>👆 Connect your wallet to get started</p>
        </div>
      )}
    </div>
  );
}

export default App;
```

**7. App.css:**

```css
.App {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.App-header {
  padding: 2rem;
  text-align: center;
  color: white;
}

.App-header h1 {
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.App-main {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.top-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.bottom-section {
  width: 100%;
}

/* Wallet Connect */
.wallet-connect {
  text-align: center;
}

.connect-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition: transform 0.2s;
}

.connect-btn:hover {
  transform: scale(1.05);
}

.wallet-info {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  border-radius: 10px;
  display: inline-block;
}

.wallet-info .account,
.wallet-info .network {
  margin: 0.5rem 0;
  color: white;
}

.wallet-info .label {
  font-weight: bold;
  margin-right: 0.5rem;
}

.disconnect-btn {
  margin-top: 1rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
}

/* Token Info */
.token-info,
.transfer-form {
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.token-info h2,
.transfer-form h2 {
  margin-top: 0;
  color: #667eea;
}

.info-grid {
  display: grid;
  gap: 1rem;
  margin: 1.5rem 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.info-item .label {
  font-weight: bold;
  color: #666;
}

.info-item .value {
  color: #333;
  font-weight: 600;
}

.refresh-btn {
  width: 100%;
  padding: 0.8rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}

.refresh-btn:hover {
  background: #5568d3;
}

/* Transfer Form */
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
  font-weight: bold;
  color: #666;
}

.form-group input {
  padding: 0.8rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.submit-btn {
  padding: 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background: #5568d3;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Messages */
.error {
  margin-top: 1rem;
  padding: 1rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  border-left: 4px solid #c33;
}

.success {
  margin-top: 1rem;
  padding: 1rem;
  background: #efe;
  color: #3c3;
  border-radius: 8px;
  border-left: 4px solid #3c3;
}

.success a {
  color: #3c3;
  font-weight: bold;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.connect-prompt {
  text-align: center;
  padding: 4rem 2rem;
  color: white;
  font-size: 1.5rem;
}

/* Transaction History */
.transaction-history {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.transaction-history h2 {
  margin-bottom: 1.5rem;
  color: #333;
}

.no-transactions {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.1rem;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.transaction-item {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 1.5rem;
  border-left: 4px solid #667eea;
  transition: transform 0.2s, box-shadow 0.2s;
}

.transaction-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.transaction-item.sent {
  border-left-color: #f56565;
}

.transaction-item.received {
  border-left-color: #48bb78;
}

.tx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.tx-type {
  font-weight: bold;
  font-size: 1.1rem;
}

.tx-type.sent {
  color: #f56565;
}

.tx-type.received {
  color: #48bb78;
}

.tx-amount {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.tx-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.tx-detail {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.tx-detail .label {
  font-size: 0.85rem;
  color: #999;
  font-weight: 600;
}

.tx-detail .value {
  font-size: 0.95rem;
  color: #333;
  font-family: monospace;
}

.view-link {
  display: inline-block;
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.view-link:hover {
  color: #5568d3;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .top-section {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .App-header h1 {
    font-size: 2rem;
  }

  .wallet-info {
    font-size: 0.9rem;
  }

  .tx-details {
    grid-template-columns: 1fr;
  }

  .transaction-item {
    padding: 1rem;
  }
}
```

#### 🚀 ステップ 5: アプリケーションを実行

**1. CONTRACT_ADDRESS を App.js で更新:**

```javascript
const CONTRACT_ADDRESS = "0x..."; // Deploy 後の contract address
```

**2. Development server を起動:**

```bash
npm start
```

**3. ブラウザを開く:**

```
http://localhost:3000
```

#### 🎯 ステップ 6: 送金をテスト

**1. MetaMask を接続:**

- "Connect Wallet" をクリック
- MetaMask で account を選択
- Connection を approve

**2. Token 情報を確認:**

- 現在の balance を確認
- Total supply を確認
- Token status を確認

**3. Transfer を実行:**

- 受信者のアドレスを入力
- KPC の数量を入力
- "Send Transfer" をクリック
- MetaMask で transaction を confirm
- Transaction の confirmation を待つ

**4. Transaction 履歴を確認:**

- "View on Etherscan" をクリックして詳細を確認

---

### 📊 6.3. 完了チェックリスト

**Smart Contract:**

- ✅ OpenZeppelin で ERC20 token を作成
- ✅ Mint、burn、pause functions を実装
- ✅ 完全な test cases を作成
- ✅ Testnet にデプロイ
- ✅ Explorer で contract を検証

**Frontend:**

- ✅ React app をセットアップ
- ✅ MetaMask を接続
- ✅ Token 情報を表示
- ✅ 送金フォーム
- ✅ Errors と loading states を処理
- ✅ Transaction 履歴を表示
- ✅ Responsive design

**Testing:**

- ✅ Wallet の connect/disconnect をテスト
- ✅ 成功した transfer をテスト
- ✅ 残高不足での transfer をテスト
- ✅ 無効なアドレスでの transfer をテスト
- ✅ Pause/unpause をテスト
- ✅ Event listeners をテスト

---

### 🎓 6.4. 上級課題（オプション）

**1. Approve & TransferFrom 機能を追加:**

- Approve フォームを作成
- TransferFrom フォームを作成
- Allowance を表示

**2. Admin 機能を追加:**

- Token を mint するフォーム（owner のみ）
- Pause/unpause ボタン（owner のみ）
- Owner address を表示

**3. Real-time 通知を追加:**

- Transfer events をリッスン
- 新しい transaction があったら toast notification を表示
- Balance を自動更新

**4. UX を最適化:**

- Loading skeleton を追加
- Animation を追加
- Dark mode を追加
- Multi-language support を追加

**5. Production にデプロイ:**

- Frontend を Vercel/Netlify にデプロイ
- Contract を mainnet にデプロイ
- Custom domain をセットアップ
- Google Analytics を追加

---

### 📝 パート 6 のまとめ

**学んだこと:**

1. **Smart Contract 開発:**

   - OpenZeppelin ライブラリの使用
   - ERC20、Ownable、Pausable、Burnable の実装
   - Custom events の追加
   - Modifier の使用

2. **テストとデプロイ:**

   - Hardhat でのテスト作成
   - Deploy scripts の作成
   - Testnet へのデプロイ
   - Contract の検証

3. **ベストプラクティス:**
   - コードの再利用（OpenZeppelin）
   - 包括的なテスト
   - Event logging
   - Access control
   - Emergency mechanisms（pause）

---

## パート 7: Ethereum vs Hyperledger Fabric の比較

企業向け blockchain ソリューションを構築する際、適切なプラットフォームを選択することは非常に重要です。現在最も人気のある 2 つのプラットフォームは **Ethereum (Public/Private)** と **Hyperledger Fabric (Enterprise)** です。各プラットフォームには独自の利点があり、異なる use case に適しています。

---

### 7.1. 概要と役割

#### 🌐 Ethereum

**役割:** 分散型アプリケーション（DApps）のための公開 blockchain プラットフォーム

**主な特徴:**

- **Permissionless**: 誰でもネットワークに参加できる
- **Decentralized**: 中央管理組織が存在しない
- **Transparent**: すべてのデータが公開
- **Trustless**: 第三者を信頼する必要がない
- **Global**: 数千の nodes を持つグローバルネットワーク

**使用目的:**

```
✅ Token & Cryptocurrency
✅ DeFi (Decentralized Finance)
✅ NFT (Non-Fungible Token)
✅ DAO (Decentralized Autonomous Organization)
✅ GameFi & Metaverse
✅ Public Crowdfunding (ICO/IDO)
✅ Cross-border Payments
```

**実例:**

- **Uniswap**: 分散型取引所
- **USDT/USDC**: Stablecoin
- **Axie Infinity**: NFT Game
- **OpenSea**: NFT Marketplace
- **MakerDAO**: Lending protocol

---

#### 🏢 Hyperledger Fabric

**役割:** 組織向けの企業 blockchain プラットフォーム

**主な特徴:**

- **Permissioned**: 承認されたメンバーのみが参加
- **Modular**: 柔軟でカスタマイズ可能なアーキテクチャ
- **Private**: データをプライベートに保つことができる
- **Scalable**: 企業向けの高性能
- **Consortium**: 組織間のコンソーシアムネットワーク

**使用目的:**

```
✅ Supply Chain Management
✅ Trade Finance
✅ Healthcare Records
✅ Identity Management
✅ Asset Tracking
✅ Interbank Settlement
✅ Insurance Claims
```

**実例:**

- **IBM Food Trust**: 食品の出所追跡（Walmart、Carrefour）
- **TradeLens**: 物流と海運（Maersk、IBM）
- **we.trade**: 貿易金融（14 の欧州銀行）
- **MediLedger**: 医薬品と医療
- **Everledger**: ダイヤモンドと資産の追跡

---

### 7.2. 詳細比較

#### 📊 総合比較表

| **基準**               | **Ethereum**                     | **Hyperledger Fabric**          |
| ---------------------- | -------------------------------- | ------------------------------- |
| **ネットワークタイプ** | Public（Private オプションあり） | Private (Permissioned)          |
| **対象**               | B2C、DApps、Crypto               | B2B、Enterprise、Consortium     |
| **アクセス権**         | Permissionless                   | Permissioned                    |
| **ID 管理**            | Wallet address (pseudonymous)    | PKI/MSP (Certificate Authority) |
| **データ**             | 完全に公開                       | Private、channel ごとに共有可能 |
| **Smart Contract**     | Solidity (EVM)                   | Chaincode (Go, Node.js, Java)   |
| **Consensus**          | PoS (Proof of Stake)             | Pluggable (Raft, Kafka, PBFT)   |
| **Transaction Speed**  | 15-30 TPS                        | 3,000-20,000 TPS                |
| **Finality**           | Probabilistic (~12 blocks)       | Immediate (1 block)             |
| **Gas Fee**            | あり (ETH/Gwei)                  | なし                            |
| **Cryptocurrency**     | あり (ETH)                       | Native token なし               |
| **Governance**         | Community-driven                 | Consortium-driven               |
| **Scalability**        | 低い（Layer 2 が必要）           | 高い（native）                  |
| **Privacy**            | 低い（public ledger）            | 高い（private channels）        |
| **Compliance**         | 困難（pseudonymous）             | 容易（KYC/AML built-in）        |
| **Cost**               | 高い（gas fees）                 | 低い（infrastructure のみ）     |
| **Maturity**           | 非常に高い（2015）               | 高い（2017）                    |

---

### 7.3. アーキテクチャの違い

#### 🔐 1. ID 管理 (Identity Management)

**Ethereum:**

```
┌─────────────────────────────────────┐
│         Ethereum Network            │
│                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐       │
│  │ 0x1a │  │ 0x2b │  │ 0x3c │       │
│  └──────┘  └──────┘  └──────┘       │
│   Anonymous addresses               │
│   (誰がいるかわからない)             │
└─────────────────────────────────────┘

✅ 利点:
   - Privacy (pseudonymous)
   - KYC 不要
   - 自由に参加

❌ 欠点:
   - Compliance が困難
   - 権限を revoke できない
   - 責任追及が難しい
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
│  (実際の ID がわかる)                        │
└─────────────────────────────────────────────┘

✅ 利点:
   - KYC/AML compliance
   - Certificate を revoke できる
   - 明確な責任追及
   - 詳細な権限管理

❌ 欠点:
   - より複雑
   - CA インフラが必要
   - Privacy が低い
```

**Code 例 - Ethereum (Anonymous):**

```javascript
// Ethereum: Private key のみ必要
const wallet = new ethers.Wallet(privateKey);
console.log("Address:", wallet.address); // 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

// 誰もこれが誰かわからない
// 無限に wallet を作成できる
```

**Code 例 - Fabric (Identity):**

```javascript
// Hyperledger Fabric: CA からの certificate が必要
const identity = {
  credentials: {
    certificate: "-----BEGIN CERTIFICATE-----\n...",
    privateKey: "-----BEGIN PRIVATE KEY-----\n...",
  },
  mspId: "Org1MSP",
  type: "X.509",
};

// Certificate には以下の情報が含まれる:
// - Organization: TL Corp
// - Common Name: admin@tl.com
// - Issued by: CA.tl.com
// - Valid from: 2025-01-01 to 2026-01-01
```

---

#### 🔒 2. データの公開範囲 (Data Visibility)

**Ethereum:**

```
┌─────────────────────────────────────────────┐
│         Ethereum Public Ledger              │
│                                             │
│  Block #1: Alice → Bob: 10 ETH              │
│  Block #2: Bob → Charlie: 5 ETH             │
│  Block #3: Charlie → David: 2 ETH           │
│                                             │
│  👁️ 誰でも閲覧可能                          │
│  👁️ すべての node が完全なコピーを持つ      │
│  👁️ 削除や非表示にできない                  │
└─────────────────────────────────────────────┘

✅ 利点:
   - 絶対的な透明性
   - 監査が容易
   - 不正ができない

❌ 欠点:
   - Privacy なし
   - 競合他社がデータを閲覧できる
   - 機密データには不適切
```

**Hyperledger Fabric:**

```
┌─────────────────────────────────────────────────────┐
│      Hyperledger Fabric - Multi-Channel             │
│                                                     │
│  Channel 1: [Org1, Org2]                           │
│    - Contract A: Supply chain data                  │
│    - Org1 & Org2 のみ閲覧可能                       │
│                                                     │
│  Channel 2: [Org2, Org3]                           │
│    - Contract B: Payment data                       │
│    - Org2 & Org3 のみ閲覧可能                       │
│                                                     │
│  Private Data Collection:                           │
│    - Org1 ←→ Org2: 価格交渉（秘密）                │
│    - Hash は chain 上、data は off-chain            │
└─────────────────────────────────────────────────────┘

✅ 利点:
   - 優れた Privacy
   - 機密データが保護される
   - GDPR に準拠
   - 競合他社がデータを閲覧できない

❌ 欠点:
   - より複雑
   - Channel の設計を慎重に行う必要がある
```

**実例:**

**Ethereum - Supply Chain (Public):**

```solidity
// ❌ すべての人が価格を閲覧できる
contract PublicSupplyChain {
    struct Product {
        string name;
        uint256 price;        // 競合他社が価格を閲覧できる！
        address manufacturer;
        address currentOwner;
    }

    mapping(uint256 => Product) public products; // Public!
}
```

**Fabric - Supply Chain (Private):**

```javascript
// ✅ 関係者のみが価格を閲覧できる
async function createProduct(ctx, productId, name, price) {
  // Public data (channel ledger 上)
  const product = {
    productId: productId,
    name: name,
    manufacturer: ctx.clientIdentity.getID(),
  };
  await ctx.stub.putState(productId, Buffer.from(JSON.stringify(product)));

  // Private data (特定の orgs 間のみ)
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

#### ⚙️ 3. Consensus Mechanism（コンセンサスメカニズム）

> 💡 **Consensus Mechanism とは？**
>
> Consensus Mechanism（コンセンサスメカニズム）は、blockchain ネットワーク内の nodes が ledger の現在の状態について合意するプロセスです。「お互いに信頼していない複数のコンピュータが、どうやって共通の真実について合意できるのか？」という問題を解決します。

**Ethereum (Proof of Stake - PoS):**

```
┌─────────────────────────────────────────────┐
│         Ethereum PoS Consensus              │
│                                             │
│  Step 1: Validators が 32 ETH を stake      │
│  Step 2: Random に validator を選択         │
│  Step 3: Block を propose                   │
│  Step 4: 他の validators が attest          │
│  Step 5: 約 12 blocks 後に block finalized  │
│                                             │
│  ⏱️ Block time: 約 12 秒                    │
│  ⏱️ Finality: 約 12 分                      │
│  💰 Reward: ETH                             │
└─────────────────────────────────────────────┘

✅ 利点:
   - Decentralized
   - Secure (economic security)
   - Energy efficient (vs PoW)

❌ 欠点:
   - Probabilistic finality
   - 遅い
   - Re-org の可能性
```

**Hyperledger Fabric (Raft/PBFT):**

```
┌─────────────────────────────────────────────┐
│      Fabric Raft Consensus (CFT)            │
│                                             │
│  Step 1: Client が transaction を submit    │
│  Step 2: Endorsing peers が execute         │
│  Step 3: Ordering service が order          │
│  Step 4: Committing peers が validate       │
│  Step 5: Ledger を update                   │
│                                             │
│  ⏱️ Transaction time: < 1 秒                │
│  ⏱️ Finality: Immediate                     │
│  💰 Reward なし (mining なし)               │
└─────────────────────────────────────────────┘

✅ 利点:
   - Immediate finality
   - 非常に速い (3000+ TPS)
   - Deterministic
   - Re-org なし

❌ 欠点:
   - より Centralized
   - Consortium を信頼する必要がある
   - より少ない nodes
```

---

#### 🎓 実例で Consensus Mechanism を理解する

> **なぜ Consensus Mechanism が必要なのか？**
>
> あなたと 9 人の友人が共通の帳簿（ledger）を記録していると想像してください。各自がコピーを持っています。新しい取引があった場合、全員がその取引の順序と有効性について合意するにはどうすればよいでしょうか？これが Consensus Mechanism が解決する問題です！

### 📚 日常の例で比較

#### **Ethereum PoS = 資金を担保にした民主的選挙**

```
状況: 1000 人が次に誰が帳簿に記録するかを決定したい

┌─────────────────────────────────────────────────────────────┐
│                    ETHEREUM PoS                             │
└─────────────────────────────────────────────────────────────┘

ステップ 1: 担保を預ける
─────────────────────────────────────────────────────────
• 参加したい人は 32 ETH を stake する必要がある (~$64,000)
• Stake した資金はロックされ、参加中は引き出せない
• 不正行為 → 資金を失う

例:
  - Alice が stake: 32 ETH
  - Bob が stake: 64 ETH (2倍 = チャンス2倍)
  - Charlie が stake: 32 ETH

ステップ 2: ランダム抽選 (12秒ごと)
─────────────────────────────────────────────────────────
• システムがランダムに 1 人を "Block Proposer" として選択
• 選ばれる確率 = Stake 額 / 総 Stake 額
• Bob は 64 ETH → Alice (32 ETH) の 2 倍のチャンス

仮定: Bob が選ばれた！

ステップ 3: Bob が Block を作成
─────────────────────────────────────────────────────────
• Bob が mempool から 200-300 transactions を集める
• Bob が新しい block を作成
• Bob が block を全員に broadcast

ステップ 4: 投票 (Attestation)
─────────────────────────────────────────────────────────
• システムがランダムに 128 人を "Committee" として選択
• 各人が Bob の block をチェック:
  ✓ Transactions は有効か？
  ✓ 署名は正しいか？
  ✓ Bob は不正をしていないか？

• 各人が投票: "YES" または "NO"
• 2/3 (85人) が "YES" を投票 → Block が承認される

結果: 120/128 が "YES" を投票 → Bob の Block が chain に追加される！

ステップ 5: 報酬と罰則
─────────────────────────────────────────────────────────
✅ Bob が報酬を受け取る: ~0.02 ETH
✅ 正しく投票した 120 人: 各自 ~0.0001 ETH を受け取る
❌ 誤って投票した 8 人: 報酬なし
❌ Bob が不正をした場合: 32 ETH をすべて失う！

ステップ 6: 繰り返し
─────────────────────────────────────────────────────────
• 12 秒後 → 再度ランダム → 新しい人を選択
• プロセスが永遠に繰り返される...
```

**Hyperledger Fabric Raft = 会社の取締役会**

```
状況: 5 つの会社 (Org1-5) が共通の ledger を管理

┌─────────────────────────────────────────────────────────────┐
│                  HYPERLEDGER FABRIC RAFT                    │
└─────────────────────────────────────────────────────────────┘

セットアップ: 5 社、各社に 1 つの "Orderer Node"
─────────────────────────────────────────────────────────
• Org1: Node A
• Org2: Node B
• Org3: Node C
• Org4: Node D
• Org5: Node E

ステップ 1: リーダー選出 (Leader Election)
─────────────────────────────────────────────────────────
• 最初、すべての nodes は対等
• 数秒後、1 つの node が自己推薦: "私が Leader になりたい！"
• 他の nodes が投票
• 50% 以上の投票を得た Node → Leader になる

結果: Node A (Org1) が Leader になった！

ステップ 2: 通常運用
─────────────────────────────────────────────────────────
新しい transaction がある場合:

1. Client が Leader (Node A) に transaction を送信

2. Node A が自分の log に記録:
   Log: [tx1, tx2, tx3, NEW_TX]

3. Node A が Followers にコピーを送信:
   A → B: "[tx1, tx2, tx3, NEW_TX] を記録してください"
   A → C: "[tx1, tx2, tx3, NEW_TX] を記録してください"
   A → D: "[tx1, tx2, tx3, NEW_TX] を記録してください"
   A → E: "[tx1, tx2, tx3, NEW_TX] を記録してください"

4. Followers が log に記録して応答: "OK、記録しました！"

5. Node A が応答を受信:
   - B: "OK" ✓
   - C: "OK" ✓
   - D: "OK" ✓
   - E: (応答なし - おそらく offline)

6. Node A がカウント: 3/4 followers が OK (>50%)
   → 十分な数 → COMMIT！

7. Node A が block を作成して全員に broadcast
   → Transaction が FINALIZED！

⏱️ 合計時間: < 1 秒

ステップ 3: Leader に障害が発生
─────────────────────────────────────────────────────────
Node A (Leader) がクラッシュした場合:

1. Followers が A からの heartbeat を受信しない
2. Timeout 後 (数秒) → 新しい Leader を選出
3. Node B が新しい Leader として選出される
4. システムは通常通り動作を続ける

→ システムは最大 2/5 nodes の障害に耐えられる (40%)
```

### 🔑 核心的な違い

```
┌──────────────────────────────────────────────────────────────┐
│              核心的な比較                                     │
└──────────────────────────────────────────────────────────────┘

質問 1: 誰が参加できるか？
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • 32 ETH を持っている人なら誰でも
  • 許可不要
  • KYC 不要
  • 現在約 1,000,000 validators

Fabric Raft:
  • 招待された組織のみ
  • X.509 certificate が必要
  • KYC が必要
  • 通常 3-10 organizations のみ

質問 2: Block を作成する人をどう選ぶか？
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • 12 秒ごとにランダム
  • 確率は stake した ETH の量に基づく
  • 誰が選ばれるか事前にわからない

Fabric Raft:
  • 固定: 常に Leader node
  • Leader は過半数の投票で選出される
  • Leader は障害が発生するまで役割を維持

質問 3: 不正を防ぐ方法は？
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • Economic Security: 不正 = Stake した資金を失う
  • 51% 攻撃には約 $30 billion USD が必要
  • Slashing: Stake した ETH の 1-100% を失う

Fabric Raft:
  • Trust-based: Consortium を信頼
  • 1 つの org が不正 → 他の orgs が検出
  • その org の certificate を revoke できる

質問 4: Transaction が finalized されるまでの時間は？
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • 約 12 分 (2 epochs)
  • Probabilistic finality
  • 12 分未満の場合 re-org の可能性あり

Fabric Raft:
  • < 1 秒
  • Immediate finality
  • 絶対に re-org しない

質問 5: 1 秒あたりの transactions 数は？
─────────────────────────────────────────────────────────────
Ethereum PoS:
  • 15-30 TPS (mainnet)
  • すべての nodes がすべての transactions を実行
  • ネットワーク全体で consensus (1M validators)

Fabric Raft:
  • 3,000-20,000 TPS
  • Endorsing peers のみが実行 (2-3 peers)
  • Ordering service のみで consensus (3-5 nodes)
```

---

#### 🔍 Consensus Mechanism の詳細分析

### A. Ethereum Proof of Stake (PoS) - 詳細

**1. 基本概念:**

Proof of Stake は、block を作成する権利を得るために資金を "stake"（担保）することに基づく consensus mechanism です。Proof of Work (PoW) のように計算能力で競争するのではなく、validators は stake した ETH の量で競争します。

**2. ステップごとの動作:**

```
┌─────────────────────────────────────────────────────────────┐
│              ETHEREUM PoS WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

EPOCH (6.4 分 = 32 slots)
│
├─ SLOT 1 (12 秒)
│  │
│  ├─ [1] Validator を選択
│  │    • RANDAO アルゴリズムがランダムに選択
│  │    • 確率は stake した ETH の量に基づく
│  │    • Validator A が "Block Proposer" として選択される
│  │
│  ├─ [2] Block を Propose
│  │    • Validator A が新しい block を作成
│  │    • 約 200-300 transactions を含む
│  │    • Network に broadcast
│  │
│  ├─ [3] Attestation (投票)
│  │    • 128 の他の validators が "Committee" として選択される
│  │    • 各 validator が block に投票
│  │    • Vote = "この block は有効であることに同意"
│  │    • Block 承認には 2/3 の投票が必要
│  │
│  └─ [4] Block が追加される
│       • Block が chain に追加される
│       • まだ finalized されていない（revert 可能）
│
├─ SLOT 2-31 (同じプロセス)
│
└─ CHECKPOINT
   • 32 slots (1 epoch) 後
   • 2 つの連続した epochs が OK → Finalized
   • Finalized 後は revert 不可能

報酬と罰則:
├─ ✅ 報酬条件:
│  • Block を正しく propose
│  • 正しくタイムリーに投票
│  • Online で responsive
│
└─ ❌ 罰則 (Slashing) 条件:
   • 同じ slot で 2 つの異なる blocks を propose
   • 矛盾する投票
   • 長時間 offline
   • Network への攻撃を試みる
```

**3. 具体例:**

```javascript
// 1000 validators がネットワークにいると仮定

// Slot 1 (最初の 12 秒)
// ──────────────────────────────────────────────

// [Step 1] ランダム選択
const validators = [
  { address: "0xABC", stake: 32 ETH },
  { address: "0xDEF", stake: 64 ETH },  // 2倍の stake = 2倍の確率
  { address: "0x123", stake: 32 ETH },
  // ... 997 の他の validators
];

// RANDAO アルゴリズムが validator を選択
const selectedProposer = randomSelect(validators); // 0xDEF が選ばれたと仮定

// [Step 2] Validator 0xDEF が block を作成
const newBlock = {
  number: 18000001,
  proposer: "0xDEF",
  transactions: [
    { from: "0xAlice", to: "0xBob", value: "1 ETH" },
    { from: "0xCharlie", to: "0xDavid", value: "0.5 ETH" },
    // ... 298 の他の transactions
  ],
  parentHash: "0x7f8e...",
  timestamp: 1704067200,
};

// [Step 3] Committee が投票
const committee = randomSelect(validators, 128); // 128 validators を選択

// Committee の各 validator が投票
const votes = committee.map(validator => {
  // Validator が block を validate
  const isValid = validateBlock(newBlock);

  return {
    validator: validator.address,
    vote: isValid ? "YES" : "NO",
    signature: sign(newBlock.hash, validator.privateKey)
  };
});

// 投票を集計
const yesVotes = votes.filter(v => v.vote === "YES").length; // 120/128
const threshold = committee.length * 2/3; // 85.3

if (yesVotes >= threshold) {
  console.log("✅ Block が承認された！");
  addBlockToChain(newBlock);
} else {
  console.log("❌ Block が拒否された！");
}

// [Step 4] Finality
// Block はまだ finalized されていない、さらに 2 epochs (12.8 分) 待つ必要がある
```

**4. なぜ finalized に 12 分かかるのか？**

**重要な概念:**

Finalized = **取り消し不可能**（irreversible）。これは transaction が **100% 安全**であることを保証する最終状態です。

**実例で説明:**

誰かに 1000 ETH を送金すると想像してください:

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Transaction が Block 1000 に含まれる                 │
│ Status: PROPOSED                                            │
│ ⚠️  リスク: Block が無効な場合拒否される可能性あり          │
│ → まだ安全ではない、確認を待っている                         │
└─────────────────────────────────────────────────────────────┘
                        ↓ (6.4 分 - 32 blocks)
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Block 1000-1032 が Checkpoint 1 に到達              │
│ Status: JUSTIFIED                                           │
│ ✅ 2/3 の validators が "OK" を投票                         │
│ ⚠️  リスク: Chain fork が発生した場合まだ revert 可能      │
│ → 比較的安全だが、100% 確実ではない                         │
└─────────────────────────────────────────────────────────────┘
                        ↓ (6.4 分 - さらに 32 blocks)
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Block 1033-1064 が Checkpoint 2 に到達              │
│ Status: FINALIZED                                           │
│ ✅✅ 2 つの連続した checkpoints が両方 OK                   │
│ 🔒 Block 1000-1032 が FINALIZED                             │
│ ✨ Revert、fork、または変更不可能                           │
│ → 100% 安全！ Transaction が完了！                          │
└─────────────────────────────────────────────────────────────┘

合計時間: 6.4 + 6.4 = 12.8 分
```

**詳細なタイムライン:**

```
分 0:00 ───────────────────────────────────────────────────
│
│  Block 1000 (あなたの transaction がここにある)
│  Block 1001
│  Block 1002
│  ...
│  Block 1031
│
分 6:24 ───────────────────────────────────────────────────
│  Block 1032 ← CHECKPOINT 1
│  └─→ Block 1000-1032 = JUSTIFIED ✓
│      (確認済みだが、まだ finalized されていない)
│
│  Block 1033
│  Block 1034
│  ...
│  Block 1063
│
分 12:48 ──────────────────────────────────────────────────
│  Block 1064 ← CHECKPOINT 2
│  └─→ Block 1033-1064 = JUSTIFIED ✓
│
│  🎉 Block 1000-1032 → FINALIZED! 🎉
│  (取り消し不可能)
│
```

**なぜ 2 つの checkpoints が必要なのか？**

1. **Checkpoint 1 (Justified):**
   - 証明するのは: "この block は有効"
   - しかし chain fork がまだ存在する可能性（2 つの競合する chains）
2. **Checkpoint 2 (Finalized):**
   - 証明するのは: "他の chain fork が存在しない"
   - Network が完全に consensus に達した
   - Rollback 不可能

**Chain Fork の例:**

```
                    ┌─→ Block 1033a ─→ Block 1034a (Chain A)
                    │
Block 1032 (Justified)
                    │
                    └─→ Block 1033b ─→ Block 1034b (Chain B)

⚠️  2 つの競合する chains！ どちらの chain が勝つかを知るには
   さらに 1 つの checkpoint を待つ必要がある。

Checkpoint 2 の後:
─────────────────────────────────────────────────────────
Chain A: Block 1064a (Checkpoint 2) ✅ → 勝つ！
Chain B: Block 1064b (拒否)         ❌ → 負ける！

→ Chain A の Block 1000-1032 が FINALIZED
→ Chain B に切り替えることはもうできない
```

**5. Economic Security (経済的セキュリティ):**

```javascript
// Ethereum PoS への攻撃は非常にコストがかかる

// 51% 攻撃を試みると仮定
const totalStaked = 30_000_000; // 30 million ETH が stake されている
const attackerNeed = totalStaked * 0.51; // 15.3 million ETH
const ethPrice = 2000; // $2000/ETH
const attackCost = attackerNeed * ethPrice; // $30.6 billion USD!

// 攻撃が失敗した場合 → すべての stake を失う (Slashing)
// 攻撃が成功した場合 → ETH の価値が下がる → それでも損失

console.log("攻撃コスト:", attackCost);
console.log("→ 経済的に実行不可能！");
```

---

### B. Hyperledger Fabric Consensus - 詳細

**1. 基本概念:**

Fabric には単一の consensus がなく、**pluggable**（交換可能）です。最も一般的なのは **Raft** (Crash Fault Tolerant) と **PBFT** (Byzantine Fault Tolerant) です。

**2. Execute-Order-Validate アーキテクチャ:**

これが Fabric の最大の違いです:

```
┌────────────────────────────────────────────────────────────┐
│         FABRIC: EXECUTE-ORDER-VALIDATE                     │
└────────────────────────────────────────────────────────────┘

[Phase 1] EXECUTE (並列 - consensus 不要)
│
├─ Client が transaction proposal を送信
│  • "Alice → Bob に $100 を送金"
│
├─ Endorsing Peers が chaincode を実行
│  • Peer 1 (Org1): 実行 → Read/Write Set
│  • Peer 2 (Org2): 実行 → Read/Write Set
│  • Peer 3 (Org3): 実行 → Read/Write Set
│  • Ledger を更新しない（simulation のみ）
│
└─ Client が endorsements を受信
   • Policy に従って十分な endorsements が必要
   • 例: "3 のうち 2" または "Org1 AND Org2"

[Phase 2] ORDER (ここで Consensus が発生)
│
├─ Client が endorsed transaction を Orderer に送信
│
├─ Ordering Service (Raft Consensus)
│  • Leader が transactions を受信
│  • Leader が transactions のバッチを propose
│  • Followers が投票 (majority)
│  • 十分な投票で block を作成
│
└─ Block をすべての peers に broadcast

[Phase 3] VALIDATE (最終チェック)
│
├─ Committing Peers が block を受信
│
├─ 各 transaction を validate:
│  • Endorsement policy をチェック
│  • Read/write set の競合をチェック
│  • 署名をチェック
│
├─ 有効な transactions → Ledger を更新
│  • 無効な transactions → 無効としてマーク
│
└─ Events を emit

FINALITY: Immediate (block が commit されたらすぐ)
```

**3. Raft Consensus - 詳細:**

```
┌────────────────────────────────────────────────────────────┐
│                    RAFT CONSENSUS                          │
└────────────────────────────────────────────────────────────┘

SETUP: 5 Orderer Nodes (Org1, Org2, Org3, Org4, Org5)

[Step 1] Leader Election
│
├─ 起動時、すべての nodes が "Follower" 状態
├─ Timeout 後、1 つの node が "Candidate" として自己推薦
├─ Candidate が投票リクエストを送信
├─ 他の nodes が投票
└─ 50% 以上の投票を得た Node → Leader になる

    Node1 (Leader) ←─── Heartbeat ───→ Node2 (Follower)
         │                                    ↓
         └──────→ Node3 (Follower)           Node4 (Follower)
                        ↓
                   Node5 (Follower)

[Step 2] 通常運用
│
├─ Client が Leader に transaction を送信
│
├─ Leader が log に追加:
│  Log: [tx1, tx2, tx3, tx4, tx5, ...]
│
├─ Leader が log を Followers に複製:
│  Leader → Node2: [tx1, tx2, tx3]
│  Leader → Node3: [tx1, tx2, tx3]
│  Leader → Node4: [tx1, tx2, tx3]
│  Leader → Node5: [tx1, tx2, tx3]
│
├─ Followers が自分の log に追加
│
├─ Followers が Leader に ACK を送信
│
└─ Leader が 50% 以上の ACKs を受信 → Commit
   • Block を作成
   • Block をすべての peers に broadcast
   • Finalized！

[Step 3] Leader 障害
│
├─ Leader がクラッシュ/offline
│
├─ Followers が heartbeat を受信しない
│
├─ Timeout 後 → 新しい election
│
├─ 最も完全な log を持つ Node が選択される
│
└─ 新しい leader が続行

FAULT TOLERANCE:
• (N-1)/2 nodes の障害に耐えられる
• 例: 5 nodes → 2 nodes の障害に耐えられる
• 3 nodes → 1 node の障害に耐えられる
```

**4. Code 例 - Transaction Flow:**

```javascript
// ════════════════════════════════════════════════════════════
// PHASE 1: EXECUTE (Endorsement)
// ════════════════════════════════════════════════════════════

// Client code
const { Gateway, Wallets } = require("fabric-network");

async function transferMoney() {
  // 1. Network に接続
  const wallet = await Wallets.newFileSystemWallet("./wallet");
  const gateway = new Gateway();
  await gateway.connect(connectionProfile, {
    wallet,
    identity: "user1",
    discovery: { enabled: true, asLocalhost: true },
  });

  const network = await gateway.getNetwork("mychannel");
  const contract = network.getContract("banking");

  // 2. Transaction proposal を submit
  console.log("📤 Transaction proposal を送信中...");

  // Chaincode が endorsing peers で実行される
  const result = await contract.submitTransaction(
    "transfer",
    "Alice", // from
    "Bob", // to
    "100" // amount
  );

  // 裏側で起こっていること:
  // ────────────────────────────────────────────────────────
  // Peer1 (Org1) が chaincode を実行:
  //   Read: Alice balance = 500
  //   Read: Bob balance = 200
  //   Write: Alice balance = 400
  //   Write: Bob balance = 300
  //   → Endorsement: Sign(ReadWriteSet)
  //
  // Peer2 (Org2) が chaincode を実行:
  //   Read: Alice balance = 500
  //   Read: Bob balance = 200
  //   Write: Alice balance = 400
  //   Write: Bob balance = 300
  //   → Endorsement: Sign(ReadWriteSet)
  //
  // Client が 2 つの endorsements を受信 → Policy を満たす (2 out of 2)
  // ────────────────────────────────────────────────────────

  console.log("✅ Transaction が endorsed された！");

  // ════════════════════════════════════════════════════════════
  // PHASE 2: ORDER (Consensus)
  // ════════════════════════════════════════════════════════════

  // Client が endorsed transaction を Orderer に送信
  // (SDK が自動的に行う)

  // Orderer (Raft consensus):
  // ────────────────────────────────────────────────────────
  // Leader Orderer:
  //   1. Transaction を受信
  //   2. Log に追加: [tx1, tx2, tx3, THIS_TX]
  //   3. Followers に複製
  //   4. Majority の ACKs を受信
  //   5. Block を作成:
  //      Block #1001 {
  //        transactions: [tx1, tx2, tx3, THIS_TX],
  //        previousHash: "0x7f8e...",
  //        timestamp: 1704067200
  //      }
  //   6. Block をすべての peers に broadcast
  // ────────────────────────────────────────────────────────

  console.log("📦 Block が作成され broadcast された！");

  // ════════════════════════════════════════════════════════════
  // PHASE 3: VALIDATE (Commit)
  // ════════════════════════════════════════════════════════════

  // Committing Peers が validate:
  // ────────────────────────────────────────────────────────
  // Peer1 が validate:
  //   ✓ Endorsement policy をチェック (2 out of 2 OK)
  //   ✓ 署名が有効かチェック
  //   ✓ Read set をチェック: Alice=500, Bob=200 (まだ有効)
  //   ✓ 他の transactions との競合なし
  //   → VALID → Ledger を更新
  //
  // Peer2 が validate:
  //   ✓ 同じチェック
  //   → VALID → Ledger を更新
  // ────────────────────────────────────────────────────────

  console.log("✅ Transaction が ledger に commit された！");
  console.log("結果:", result.toString());

  // FINALITY: Immediate！
  // Ethereum のような probabilistic finality なし
  // Reorg なし
  // Transaction がすぐに finalized

  await gateway.disconnect();
}

transferMoney();
```

**5. なぜ Fabric は Ethereum より速いのか？**

```
ETHEREUM PoS:
├─ すべての nodes がすべての transactions を実行
├─ ネットワーク全体で consensus (数千の nodes)
├─ Probabilistic finality (12 分)
└─ → 遅い (15-30 TPS)

FABRIC:
├─ Endorsing peers のみが実行 (2-3 peers)
├─ Ordering service のみで consensus (3-5 nodes)
├─ Immediate finality (< 1 秒)
└─ → 速い (3000-20000 TPS)

具体例:
─────────────────────────────────────────────────
Transaction: $100 を送金

Ethereum:
  [0s]    Transaction を submit
  [12s]   Block が proposed
  [24s]   Block が attested
  [768s]  Finalized (12 分)
  → 合計: 12 分 48 秒

Fabric:
  [0s]     Proposal を submit
  [0.1s]   Endorsements を受信
  [0.2s]   Raft で ordered
  [0.3s]   Block が作成された
  [0.4s]   Validated して committed
  → 合計: 0.4 秒
```

**6. Trade-offs:**

```
ETHEREUM PoS:
✅ Decentralized (数千の nodes)
✅ Censorship resistant
✅ Public で transparent
❌ 遅い
❌ 高い (gas fees)
❌ Private ではない

FABRIC RAFT:
✅ 非常に速い
✅ Free transactions
✅ Private data
❌ より centralized (より少ない nodes)
❌ Consortium を信頼する必要がある
❌ Public ではない
```

---

#### ❓ Consensus Mechanism に関するよくある質問

**Q1: なぜ Ethereum PoS は finalized に 12 分かかり、Fabric は < 1 秒なのか？**

```
Ethereum PoS:
─────────────────────────────────────────────────────────
問題: Chain fork がないことを保証する必要がある

Timeline:
  0:00  → Transaction が block 1000 に入る
  6:24  → Checkpoint 1 (Block 1032) - JUSTIFIED
          ⚠️  まだ fork の可能性あり！
  12:48 → Checkpoint 2 (Block 1064) - FINALIZED
          ✅ Fork がないことを確認！

2 つの checkpoints が必要な理由:
  • Checkpoint 1: "この Block は有効" を証明
  • Checkpoint 2: "他の chain がない" を証明
  • 1 つの checkpoint のみ → Fork 攻撃の可能性

Fork の例:
                    ┌─→ Chain A (100 validators)
  Block 1032 ──────┤
                    └─→ Chain B (80 validators)

  Checkpoint 2 の後:
  → Chain A が勝つ (より多くの validators)
  → Chain B が削除される
  → Chain A の Block 1000-1032 = FINALIZED


Fabric Raft:
─────────────────────────────────────────────────────────
問題: 設計上、絶対に fork しない

Timeline:
  0.0s → Client が transaction を送信
  0.1s → Endorsing peers が実行
  0.2s → Leader Orderer が受信
  0.3s → Followers が ACK (majority)
  0.4s → FINALIZED！

速い理由:
  • Leader が 1 つのみ → 2 つの chains は不可能
  • Majority vote → すぐに結果がわかる
  • 複数の blocks を待つ必要なし
  • Deterministic (ランダムではない)

Trade-off:
  ✅ 速い
  ❌ より centralized (3-5 orderers のみ)
  ❌ Consortium を信頼する必要がある
```

**Q2: 1000 ETH を送金した場合、いつ受取人が確実に資金を受け取ったと言えるか？**

```
Ethereum:
─────────────────────────────────────────────────────────
時間経過による安全性レベル:

0 confirmations (0 秒):
  ⚠️⚠️⚠️ 危険！
  • Transaction が reject される可能性
  • Replace される可能性 (higher gas)
  • このレベルでは絶対に信頼しない

1-5 confirmations (12-60 秒):
  ⚠️⚠️ 高リスク
  • Re-org の可能性あり
  • 小額の取引のみ OK (< $100)
  • 例: コーヒーを買う

12 confirmations (~2.4 分):
  ⚠️ 中リスク
  • Re-org の確率は非常に低い (~0.01%)
  • 中額の取引 OK ($100-$10,000)
  • 例: オンラインショッピング

64 confirmations (~12.8 分):
  ✅ 安全
  • Finalized！ Revert 不可能
  • 高額の取引 OK (> $10,000)
  • 例: 取引所への入金、不動産購入

Best Practice:
  • 取引 < $100: 1-5 confirmations を待つ
  • 取引 $100-$10K: 12 confirmations を待つ
  • 取引 > $10K: 64 confirmations を待つ (finalized)


Fabric:
─────────────────────────────────────────────────────────
安全性レベル:

< 1 秒:
  ✅ 100% 安全！
  • Immediate finality
  • Confirmations なし
  • Re-org なし
  • Transaction がすぐに FINALIZED

理由:
  • Raft consensus = Deterministic
  • Majority vote = 確実
  • Probabilistic finality なし
```

**Q3: Validator/node が不正をした場合、何が起こるか？**

```
Ethereum PoS - Validator の不正:
─────────────────────────────────────────────────────────
シナリオ 1: Validator が 2 つの異なる blocks を propose (Double signing)

  Slot 100:
    Validator A が propose:
      - Block X: "Alice → Bob: 10 ETH"
      - Block Y: "Alice → Charlie: 10 ETH"  (同じ資金！)

  検出:
    • 他の validators が 2 つの blocks を発見
    • Network に報告
    • Proof が on-chain で submit される

  罰則:
    ❌ Validator A が SLASHING される
    ❌ 1 ETH を失う (~$2,000)
    ❌ Validator set から kick される
    ❌ 36 日間 stake できない

シナリオ 2: Validator が矛盾した投票

  Slot 100:
    Validator B が投票:
      - Vote 1: "Block X is valid"
      - Vote 2: "Block Y is valid" (矛盾！)

  罰則:
    ❌ 0.5 ETH を失う
    ❌ Kick される

シナリオ 3: Validator が長期間 offline

  Validator C が 1 週間 offline:
    • 選ばれても blocks を propose しない
    • Blocks に投票しない

  罰則:
    ❌ 約 0.1 ETH を失う
    ❌ Kick されない (戻ることができる)

シナリオ 4: 51% 攻撃

  Attacker が必要:
    • 総 ETH stake の 51%
    • 約 15 million ETH
    • 約 $30 billion USD

  攻撃した場合:
    ❌ $30 billion をすべて失う (slashing)
    ❌ ETH の価値が下がる → それでも損失
    → 経済的に実行不可能！


Fabric Raft - Node の不正:
─────────────────────────────────────────────────────────
シナリオ 1: Endorsing Peer の不正

  Peer A (Org1) が誤って endorse:
    • 無効な transaction を endorse
    • 例: Alice が 100 ETH を送金するが 50 しか持っていない

  検出:
    • Committing peers が validate
    • Read/write set が無効であることを検出
    • Transaction が INVALID とマークされる

  罰則:
    ⚠️  自動罰則なし！
    • 他の orgs が検出
    • Consortium 会議
    • Org1 の certificate を revoke できる
    • Org1 を network から kick

シナリオ 2: Leader Orderer の不正

  Leader が試みる:
    • Transactions の順序を変更
    • 一部の transactions を無視

  検出:
    • Follower orderers が異なる log を持つ
    • Majority が同意しない
    • Leader が reject される

  結果:
    • Leader が kick される
    • 新しい leader を選出
    • システムは通常通り動作を続ける

シナリオ 3: Majority 攻撃

  Attacker が必要:
    • Orderers の >50% を制御
    • 例: 5 つのうち 3 つの orderers

  攻撃した場合:
    ✅ 不正が可能！
    • Transactions を変更できる
    • Censorship できる

  予防:
    • 信頼できる consortium を選択
    • 多くの独立した orgs
    • Orgs 間の法的契約
```

**Q4: なぜ Ethereum を Fabric のように速くできないのか？**

```
問題: Decentralization vs Speed の Trade-off

Ethereum PoS (遅いが Decentralized):
─────────────────────────────────────────────────────────
なぜ遅いのか？
  1. 多くの validators (1,000,000 validators)
     → 多くの人からの投票を待つ必要がある
     → 時間がかかる

  2. すべての nodes がすべての transactions を実行
     → すべての node が verify する必要がある
     → Bottleneck

  3. Probabilistic finality
     → 確実にするため 2 epochs 待つ必要がある
     → 12 分

  4. Byzantine Fault Tolerance
     → 33% の悪意ある validators に対抗する必要がある
     → 複数ラウンドの投票が必要

利点:
  ✅ 誰でも参加できる
  ✅ Censorship できない
  ✅ 誰も信頼する必要がない
  ✅ 真に decentralized


Fabric Raft (速いがより Centralized):
─────────────────────────────────────────────────────────
なぜ速いのか？
  1. 少ない nodes (3-10 orderers)
     → すぐに consensus に達する
     → < 1 秒

  2. Endorsing peers のみが実行
     → すべての nodes ではない
     → Parallel execution

  3. Immediate finality
     → Majority vote = すぐに Finalized
     → 待つ必要なし

  4. Crash Fault Tolerance (Byzantine ではない)
     → 仮定: Nodes は悪意がない
     → >50% の投票のみ必要

欠点:
  ❌ Consortium のみが参加できる
  ❌ Censorship できる (majority が同意すれば)
  ❌ Consortium を信頼する必要がある
  ❌ より centralized

結論:
  • 両方は持てない！
  • 選択が必要: Decentralized OR Fast
  • Ethereum は Decentralized を選択
  • Fabric は Fast を選択
```

**Q5: いつ Ethereum を使うべきか？ いつ Fabric を使うべきか？**

```
Ethereum を使う場合:
─────────────────────────────────────────────────────────
✅ Decentralization が必要
   → DeFi、DAO、Public applications

✅ Trustless が必要
   → どの組織も信頼したくない

✅ Public & transparent が必要
   → 誰でも verify できる

✅ Composability が必要
   → Smart contracts がお互いを呼び出す
   → 例: Uniswap + Aave + Compound

✅ Token economics が必要
   → ICO、IDO、NFT、Governance token

例:
  • Uniswap (DEX)
  • Aave (Lending)
  • OpenSea (NFT Marketplace)
  • MakerDAO (Stablecoin)


Fabric を使う場合:
─────────────────────────────────────────────────────────
✅ Privacy が必要
   → パートナー間の機密データ
   → 例: 価格、契約、顧客情報

✅ High throughput が必要
   → 3000-20000 TPS
   → 例: 数百万の transactions がある supply chain

✅ Immediate finality が必要
   → 12 分待てない
   → 例: Trade finance、payments

✅ Compliance が必要
   → KYC/AML、GDPR、HIPAA
   → 参加者の実際の ID を知る

✅ Free transactions が必要
   → Gas fees を払いたくない
   → Infrastructure cost のみ

例:
  • IBM Food Trust (Supply chain)
  • we.trade (Trade finance)
  • MedRec (Healthcare records)
  • TradeLens (Shipping)
```

---

**7. まとめ:**

| Aspect               | Ethereum PoS             | Fabric Raft                |
| -------------------- | ------------------------ | -------------------------- |
| **Purpose**          | Public blockchain        | Private consortium         |
| **Participants**     | Unlimited                | Permissioned               |
| **Consensus Type**   | Nakamoto-style           | CFT (Crash Fault Tolerant) |
| **Finality**         | Probabilistic → Absolute | Immediate                  |
| **Speed**            | 15-30 TPS                | 3000-20000 TPS             |
| **Time to Finality** | 約 12 分                 | < 1 秒                     |
| **Energy**           | 低い                     | 非常に低い                 |
| **Fault Tolerance**  | 33% Byzantine            | 50% Crash                  |
| **Best for**         | Public DApps、DeFi       | Enterprise、B2B            |

**Transaction Flow の比較:**

**Ethereum:**

```
User → MetaMask → RPC Node → Mempool
→ Validator が tx を選択 → 実行 → Block が proposed
→ Attestations → Block が finalized (12 blocks 後)

⏱️ 合計: Finality まで約 12 分
💰 Gas fee: $5-50 (network congestion に依存)
```

**Fabric:**

```
Client → Endorsing Peers (並列実行)
→ Ordering Service → Committing Peers
→ Ledger が更新される

⏱️ 合計: < 1 秒
💰 Fee なし (infrastructure cost のみ)
```

---

#### 🏗️ 4. Smart Contract アーキテクチャ

**Ethereum Smart Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    // State が blockchain に保存される
    // すべての nodes が execute
    // 各 operation に Gas fee

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
  // State が channel ledger に保存される
  // endorsing peers のみが execute
  // Gas fee なし

  async setValue(ctx, newValue) {
    // Identity を確認
    const clientId = ctx.clientIdentity.getID();

    // 権限を確認（ACL）
    const org = ctx.clientIdentity.getMSPID();
    if (org !== "Org1MSP") {
      throw new Error("Unauthorized");
    }

    await ctx.stub.putState("myValue", Buffer.from(newValue));

    // Event を emit
    ctx.stub.setEvent("ValueChanged", Buffer.from(newValue));
  }

  async getValue(ctx) {
    const valueBytes = await ctx.stub.getState("myValue");
    return valueBytes.toString();
  }
}

// Deploy: Free（approve のみ必要）
// Write: Free
// Read: Free
```

**主な違い:**

| **Aspect**         | **Ethereum**      | **Fabric**           |
| ------------------ | ----------------- | -------------------- |
| **Language**       | Solidity          | Go, Node.js, Java    |
| **Execution**      | All nodes         | Endorsing peers only |
| **State**          | Global            | Per channel          |
| **Cost**           | Gas fee           | Infrastructure only  |
| **Upgrade**        | 困難（immutable） | 簡単（versioning）   |
| **Access Control** | Code-based        | Identity-based       |

---

#### 🏗️ 4. Smart Contract アーキテクチャ

**Ethereum Smart Contract:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private value;

    // State が blockchain に保存される
    // すべての nodes が execute
    // 各 operation に Gas fee

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
  // State が channel ledger に保存される
  // endorsing peers のみが execute
  // Gas fee なし

  async setValue(ctx, newValue) {
    // Identity を確認
    const clientId = ctx.clientIdentity.getID();

    // 権限を確認（ACL）
    const org = ctx.clientIdentity.getMSPID();
    if (org !== "Org1MSP") {
      throw new Error("Unauthorized");
    }

    await ctx.stub.putState("myValue", Buffer.from(newValue));

    // Event を emit
    ctx.stub.setEvent("ValueChanged", Buffer.from(newValue));
  }

  async getValue(ctx) {
    const valueBytes = await ctx.stub.getState("myValue");
    return valueBytes.toString();
  }
}

// Deploy: Free（approve のみ必要）
// Write: Free
// Read: Free
```

**主な違い:**

| **Aspect**         | **Ethereum**      | **Fabric**           |
| ------------------ | ----------------- | -------------------- |
| **Language**       | Solidity          | Go, Node.js, Java    |
| **Execution**      | All nodes         | Endorsing peers only |
| **State**          | Global            | Per channel          |
| **Cost**           | Gas fee           | Infrastructure only  |
| **Upgrade**        | 困難（immutable） | 簡単（versioning）   |
| **Access Control** | Code-based        | Identity-based       |

---

### 7.4. どのプラットフォームをいつ使うか？

#### 🎯 Ethereum を選択する場合:

**✅ 適した Use Cases:**

**1. Token & Cryptocurrency**

```
Example: プロジェクト向け Token 発行
- ICO/IDO
- Utility token
- Governance token
- Stablecoin

理由: Ethereum は最強の token エコシステムを持つ
```

**2. DeFi (Decentralized Finance)**

```
Example: DEX、Lending、Staking
- Uniswap: AMM DEX
- Aave: Lending protocol
- Compound: Money market
- Curve: Stablecoin swap

理由: Decentralization と composability が必要
```

**3. NFT & Digital Assets**

```
Example: NFT marketplace、Game items
- OpenSea: NFT trading
- Axie Infinity: GameFi
- Decentraland: Metaverse
- Art collectibles

理由: Ownership verification と liquidity が必要
```

**4. DAO & Governance**

```
Example: Decentralized organizations
- MakerDAO: Decentralized governance
- Aragon: DAO framework
- Snapshot: Voting

理由: Transparency と trustless voting が必要
```

**5. Public Crowdfunding**

```
Example: Community fundraising
- ICO/IDO
- NFT presale
- Public fundraising

理由: Global audience へのアクセス
```

**6. Cross-border Payments**

```
Example: 国際送金
- USDT/USDC transfers
- Remittance
- Micropayments

理由: 仲介銀行が不要
```

---

#### 🏢 Hyperledger Fabric を選択する場合:

**✅ 適した Use Cases:**

**1. Supply Chain Management**

```
Example: 製品の出所追跡
- IBM Food Trust (Walmart)
- TradeLens (Maersk shipping)
- Everledger (Diamond tracking)

理由:
- パートナー間の privacy が必要
- 機密データ（価格、契約）
- High throughput
- Compliance 要件

Code example:
```

```javascript
// Fabric: 価格用の Private data
async function createShipment(ctx, shipmentId, product, quantity) {
  // Public data（すべての channel メンバーに表示）
  const shipment = {
    shipmentId,
    product,
    quantity,
    status: "created",
    timestamp: new Date().toISOString(),
  };
  await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));

  // Private data（buyer と seller のみ）
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
- we.trade（14 の欧州銀行）
- Contour（Letter of Credit）
- Marco Polo（Trade finance）

理由:
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

✅ すべてのステップが Fabric に記録される
✅ 関係者のみがデータを閲覧
✅ Immediate settlement
```

**3. Healthcare Records**

```
Example: 電子健康記録
- MedRec (MIT)
- Guardtime（エストニアの healthcare）
- BurstIQ（Health data marketplace）

理由:
- HIPAA compliance（US）
- GDPR compliance（EU）
- Patient privacy
- Granular access control
- Audit trail

Example:
```

```javascript
// 認可された医師のみが閲覧可能
async function getPatientRecord(ctx, patientId) {
  // Caller が認可されているか確認
  const doctorId = ctx.clientIdentity.getID();

  // ACL で permission を確認
  const permissionKey = `permission_${patientId}_${doctorId}`;
  const permissionBytes = await ctx.stub.getState(permissionKey);

  if (!permissionBytes || permissionBytes.length === 0) {
    throw new Error("Unauthorized: No permission to access this record");
  }

  // Patient record を返す
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
- Sovrin（Self-sovereign identity）
- uPort（Digital identity）
- Civic（Identity verification）

理由:
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

理由:
- High transaction volume
- Low latency
- Private data
- Enterprise systems との統合
```

**6. Insurance Claims**

```
Example: 保険金請求処理
- B3i（Blockchain Insurance Industry Initiative）
- RiskBlock Alliance

理由:
- Multi-party process
- Fraud prevention
- Automated claims processing
- Regulatory compliance
```

---

### 7.5. Decision Matrix（意思決定マトリックス）

#### 📋 プラットフォーム選択のための質問表:

| **質問**                                     | **Ethereum** | **Fabric** |
| -------------------------------------------- | ------------ | ---------- |
| データは公開可能か？                         | ✅ Yes       | ❌ No      |
| Cryptocurrency/token が必要か？              | ✅ Yes       | ❌ No      |
| 最大限の decentralization が必要か？         | ✅ Yes       | ❌ No      |
| ユーザーは public/anonymous か？             | ✅ Yes       | ❌ No      |
| KYC/AML compliance が必要か？                | ❌ No        | ✅ Yes     |
| データは機密/秘密か？                        | ❌ No        | ✅ Yes     |
| High throughput（>1000 TPS）が必要か？       | ❌ No        | ✅ Yes     |
| Immediate finality が必要か？                | ❌ No        | ✅ Yes     |
| Consortium/partnership があるか？            | ❌ No        | ✅ Yes     |
| Gas fee の予算が限られているか？             | ❌ No        | ✅ Yes     |
| Contract を頻繁に upgrade する必要があるか？ | ❌ No        | ✅ Yes     |
| Regulatory requirements が厳しいか？         | ❌ No        | ✅ Yes     |

**使用方法:**

- 各列の ✅ の数を数える
- ✅ が多い列 → そのプラットフォームを選択

---

### 📝 パート 7 のまとめ

**Key Takeaways:**

**1. Ethereum:**

- ✅ Public、permissionless、decentralized
- ✅ 適している: Token、DeFi、NFT、DAO
- ✅ Global reach、large ecosystem
- ❌ 遅い、高い、private ではない

**2. Hyperledger Fabric:**

- ✅ Private、permissioned、modular
- ✅ 適している: Supply chain、Banking、Healthcare
- ✅ 速い、安い、private
- ❌ 複雑、consortium が必要

**3. Decision Framework:**

```
Public + token が必要？ → Ethereum
Private + compliance が必要？ → Fabric
両方が必要？ → Hybrid approach
```

**4. 「最良のプラットフォーム」は存在しない:**

- 「最も適したプラットフォーム」のみが存在
- 具体的な use case に依存
- 選択前に requirements を慎重に検討

**5. Future Trends:**

- **Ethereum**: Layer 2 scaling、privacy solutions（zk-SNARKs）
- **Fabric**: Better tooling、easier deployment
- **Interoperability**: Cross-chain bridges

---
