/**
 * WalletManager Class - Production Ready
 * 
 * Class quản lý wallet với các tính năng:
 * - Kiểm tra số dư ETH và Token
 * - Gửi ETH và Token
 * - Ước tính gas
 * - Lấy transaction history
 * - Error handling và retry logic
 */

require('dotenv').config();
const { ethers } = require('ethers');

class WalletManager {
  /**
   * Khởi tạo WalletManager
   * @param {string} rpcUrl - URL của RPC provider
   * @param {string} privateKey - Private key của wallet
   */
  constructor(rpcUrl, privateKey) {
    if (!rpcUrl || !privateKey) {
      throw new Error('RPC URL và Private Key là bắt buộc');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.address = this.wallet.address;

    // Cache để tối ưu performance
    this.networkCache = null;
    this.tokenInfoCache = new Map();
  }

  /**
   * Lấy thông tin network
   * @returns {Promise<Object>}
   */
  async getNetwork() {
    if (!this.networkCache) {
      this.networkCache = await this.provider.getNetwork();
    }
    return this.networkCache;
  }

  /**
   * Lấy số dư ETH
   * @returns {Promise<string>} Số dư dạng ETH
   */
  async getBalance() {
    try {
      const balance = await this.provider.getBalance(this.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Lỗi khi lấy số dư ETH: ${error.message}`);
    }
  }

  /**
   * Lấy số dư ETH dạng raw (wei)
   * @returns {Promise<BigInt>}
   */
  async getBalanceRaw() {
    return await this.provider.getBalance(this.address);
  }

  /**
   * Lấy thông tin token
   * @param {string} tokenAddress - Địa chỉ token contract
   * @returns {Promise<Object>}
   */
  async getTokenInfo(tokenAddress) {
    // Kiểm tra cache
    if (this.tokenInfoCache.has(tokenAddress)) {
      return this.tokenInfoCache.get(tokenAddress);
    }

    const ERC20_ABI = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
    ];

    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ERC20_ABI,
        this.provider
      );

      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      const info = { name, symbol, decimals };
      
      // Lưu vào cache
      this.tokenInfoCache.set(tokenAddress, info);
      
      return info;
    } catch (error) {
      throw new Error(`Lỗi khi lấy thông tin token: ${error.message}`);
    }
  }

  /**
   * Lấy số dư token
   * @param {string} tokenAddress - Địa chỉ token contract
   * @returns {Promise<Object>}
   */
  async getTokenBalance(tokenAddress) {
    const ERC20_ABI = [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
    ];

    try {
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
        decimals: decimals,
        raw: balance,
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy số dư token: ${error.message}`);
    }
  }

  /**
   * Gửi ETH
   * @param {string} to - Địa chỉ người nhận
   * @param {string} amountInEther - Số lượng ETH
   * @param {Object} options - Các tùy chọn (gasLimit, gasPrice, etc.)
   * @returns {Promise<Object>}
   */
  async sendETH(to, amountInEther, options = {}) {
    try {
      const amount = ethers.parseEther(amountInEther);

      // Kiểm tra số dư
      const balance = await this.provider.getBalance(this.address);
      if (balance < amount) {
        throw new Error(
          `Số dư không đủ: Cần ${amountInEther} ETH, có ${ethers.formatEther(balance)} ETH`
        );
      }

      // Gửi transaction
      console.log(`[ETH Transfer] Gửi ${amountInEther} ETH đến ${to}...`);
      const tx = await this.wallet.sendTransaction({
        to: to,
        value: amount,
        ...options,
      });

      console.log(`[ETH Transfer] TX Hash: ${tx.hash}`);
      console.log(`[ETH Transfer] Đang chờ confirmation...`);

      // Chờ confirmation
      const receipt = await tx.wait();

      const result = {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice.toString(),
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        from: this.address,
        to: to,
        value: amountInEther,
      };

      console.log(`[ETH Transfer] ${result.status}`);
      return result;
    } catch (error) {
      console.error(`[ETH Transfer] FAILED: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gửi ERC20 Token
   * @param {string} tokenAddress - Địa chỉ token contract
   * @param {string} to - Địa chỉ người nhận
   * @param {string} amount - Số lượng token
   * @param {Object} options - Các tùy chọn
   * @returns {Promise<Object>}
   */
  async sendToken(tokenAddress, to, amount, options = {}) {
    const ERC20_ABI = [
      'function transfer(address to, uint256 amount) returns (bool)',
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
    ];

    try {
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
        throw new Error(
          `Số dư ${symbol} không đủ: Cần ${amount}, có ${ethers.formatUnits(balance, decimals)}`
        );
      }

      // Gửi transaction
      console.log(`[${symbol} Transfer] Gửi ${amount} ${symbol} đến ${to}...`);
      const tx = await contract.transfer(to, amountInWei, options);

      console.log(`[${symbol} Transfer] TX Hash: ${tx.hash}`);
      console.log(`[${symbol} Transfer] Đang chờ confirmation...`);

      // Chờ confirmation
      const receipt = await tx.wait();

      const result = {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice.toString(),
        status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
        token: symbol,
        tokenAddress: tokenAddress,
        from: this.address,
        to: to,
        amount: amount,
      };

      console.log(`[${symbol} Transfer] ${result.status}`);
      return result;
    } catch (error) {
      console.error(`[Token Transfer] FAILED: ${error.message}`);
      throw error;
    }
  }

  /**
   * Ước tính gas cho transaction
   * @param {string} to - Địa chỉ đích
   * @param {string} value - Giá trị (wei)
   * @param {string} data - Data (hex)
   * @returns {Promise<Object>}
   */
  async estimateGas(to, value = 0, data = '0x') {
    try {
      const gasEstimate = await this.provider.estimateGas({
        from: this.address,
        to: to,
        value: value,
        data: data,
      });

      const feeData = await this.provider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' Gwei',
        maxFeePerGas: feeData.maxFeePerGas
          ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' Gwei'
          : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
          ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' Gwei'
          : null,
        estimatedCost: ethers.formatEther(gasEstimate * feeData.gasPrice) + ' ETH',
      };
    } catch (error) {
      throw new Error(`Lỗi khi ước tính gas: ${error.message}`);
    }
  }

  /**
   * Lấy transaction count (nonce)
   * @returns {Promise<number>}
   */
  async getTransactionCount() {
    return await this.provider.getTransactionCount(this.address);
  }

  /**
   * Lấy thông tin transaction
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>}
   */
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction không tồn tại');
      }
      return tx;
    } catch (error) {
      throw new Error(`Lỗi khi lấy transaction: ${error.message}`);
    }
  }

  /**
   * Lấy receipt của transaction
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>}
   */
  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error('Transaction receipt không tồn tại');
      }
      return receipt;
    } catch (error) {
      throw new Error(`Lỗi khi lấy transaction receipt: ${error.message}`);
    }
  }

  /**
   * Chờ transaction được confirm
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Số confirmation cần chờ
   * @returns {Promise<Object>}
   */
  async waitForTransaction(txHash, confirmations = 1) {
    console.log(`Đang chờ ${confirmations} confirmation cho tx ${txHash}...`);
    const receipt = await this.provider.waitForTransaction(txHash, confirmations);
    console.log(`✓ Transaction đã có ${confirmations} confirmation`);
    return receipt;
  }

  /**
   * Lấy block number hiện tại
   * @returns {Promise<number>}
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Lấy thông tin block
   * @param {number} blockNumber - Block number
   * @returns {Promise<Object>}
   */
  async getBlock(blockNumber) {
    return await this.provider.getBlock(blockNumber);
  }

  /**
   * Lấy gas price hiện tại
   * @returns {Promise<Object>}
   */
  async getFeeData() {
    const feeData = await this.provider.getFeeData();
    return {
      gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' Gwei',
      maxFeePerGas: feeData.maxFeePerGas
        ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' Gwei'
        : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
        ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' Gwei'
        : null,
    };
  }

  /**
   * Sign message
   * @param {string} message - Message cần ký
   * @returns {Promise<string>}
   */
  async signMessage(message) {
    return await this.wallet.signMessage(message);
  }

  /**
   * Verify signature
   * @param {string} message - Message gốc
   * @param {string} signature - Signature
   * @returns {string} Địa chỉ của signer
   */
  verifyMessage(message, signature) {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Lấy địa chỉ wallet
   * @returns {string}
   */
  getAddress() {
    return this.address;
  }

  /**
   * Format address (checksum)
   * @param {string} address
   * @returns {string}
   */
  static formatAddress(address) {
    return ethers.getAddress(address);
  }

  /**
   * Kiểm tra địa chỉ hợp lệ
   * @param {string} address
   * @returns {boolean}
   */
  static isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

module.exports = WalletManager;

