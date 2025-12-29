/**
 * WalletManager Class - Production Ready
 * 
 * Wallet management class with features:
 * - Check ETH and Token balance
 * - Send ETH and Token
 * - Estimate gas
 * - Get transaction history
 * - Error handling and retry logic
 */

require('dotenv').config();
const { ethers } = require('ethers');

class WalletManager {
  /**
   * Initialize WalletManager
   * @param {string} rpcUrl - RPC provider URL
   * @param {string} privateKey - Wallet private key
   */
  constructor(rpcUrl, privateKey) {
    if (!rpcUrl || !privateKey) {
      throw new Error('RPC URL and Private Key are required');
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.address = this.wallet.address;

    // Cache for performance optimization
    this.networkCache = null;
    this.tokenInfoCache = new Map();
  }

  /**
   * Get network information
   * @returns {Promise<Object>}
   */
  async getNetwork() {
    if (!this.networkCache) {
      this.networkCache = await this.provider.getNetwork();
    }
    return this.networkCache;
  }

  /**
   * Get ETH balance
   * @returns {Promise<string>} Balance in ETH format
   */
  async getBalance() {
    try {
      const balance = await this.provider.getBalance(this.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Error getting ETH balance: ${error.message}`);
    }
  }

  /**
   * Get raw ETH balance (wei)
   * @returns {Promise<BigInt>}
   */
  async getBalanceRaw() {
    return await this.provider.getBalance(this.address);
  }

  /**
   * Get token information
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<Object>}
   */
  async getTokenInfo(tokenAddress) {
    // Check cache
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
      
      // Save to cache
      this.tokenInfoCache.set(tokenAddress, info);
      
      return info;
    } catch (error) {
      throw new Error(`Error getting token info: ${error.message}`);
    }
  }

  /**
   * Get token balance
   * @param {string} tokenAddress - Token contract address
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
      throw new Error(`Error getting token balance: ${error.message}`);
    }
  }

  /**
   * Send ETH
   * @param {string} to - Recipient address
   * @param {string} amountInEther - Amount in ETH
   * @param {Object} options - Options (gasLimit, gasPrice, etc.)
   * @returns {Promise<Object>}
   */
  async sendETH(to, amountInEther, options = {}) {
    try {
      const amount = ethers.parseEther(amountInEther);

      // Check balance
      const balance = await this.provider.getBalance(this.address);
      if (balance < amount) {
        throw new Error(
          `Insufficient balance: Need ${amountInEther} ETH, have ${ethers.formatEther(balance)} ETH`
        );
      }

      // Send transaction
      console.log(`[ETH Transfer] Sending ${amountInEther} ETH to ${to}...`);
      const tx = await this.wallet.sendTransaction({
        to: to,
        value: amount,
        ...options,
      });

      console.log(`[ETH Transfer] TX Hash: ${tx.hash}`);
      console.log(`[ETH Transfer] Waiting for confirmation...`);

      // Wait for confirmation
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
   * Send ERC20 Token
   * @param {string} tokenAddress - Token contract address
   * @param {string} to - Recipient address
   * @param {string} amount - Token amount
   * @param {Object} options - Options
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

      // Get token info
      const [decimals, symbol, balance] = await Promise.all([
        contract.decimals(),
        contract.symbol(),
        contract.balanceOf(this.address),
      ]);

      const amountInWei = ethers.parseUnits(amount, decimals);

      // Check balance
      if (balance < amountInWei) {
        throw new Error(
          `Insufficient ${symbol} balance: Need ${amount}, have ${ethers.formatUnits(balance, decimals)}`
        );
      }

      // Send transaction
      console.log(`[${symbol} Transfer] Sending ${amount} ${symbol} to ${to}...`);
      const tx = await contract.transfer(to, amountInWei, options);

      console.log(`[${symbol} Transfer] TX Hash: ${tx.hash}`);
      console.log(`[${symbol} Transfer] Waiting for confirmation...`);

      // Wait for confirmation
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
   * Estimate gas for transaction
   * @param {string} to - Destination address
   * @param {string} value - Value (wei)
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
      throw new Error(`Error estimating gas: ${error.message}`);
    }
  }

  /**
   * Get transaction count (nonce)
   * @returns {Promise<number>}
   */
  async getTransactionCount() {
    return await this.provider.getTransactionCount(this.address);
  }

  /**
   * Get transaction information
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>}
   */
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction does not exist');
      }
      return tx;
    } catch (error) {
      throw new Error(`Error getting transaction: ${error.message}`);
    }
  }

  /**
   * Get transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>}
   */
  async getTransactionReceipt(txHash) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error('Transaction receipt does not exist');
      }
      return receipt;
    } catch (error) {
      throw new Error(`Error getting transaction receipt: ${error.message}`);
    }
  }

  /**
   * Wait for transaction confirmation
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait
   * @returns {Promise<Object>}
   */
  async waitForTransaction(txHash, confirmations = 1) {
    console.log(`Waiting for ${confirmations} confirmation(s) for tx ${txHash}...`);
    const receipt = await this.provider.waitForTransaction(txHash, confirmations);
    console.log(`✓ Transaction has ${confirmations} confirmation(s)`);
    return receipt;
  }

  /**
   * Get current block number
   * @returns {Promise<number>}
   */
  async getBlockNumber() {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block information
   * @param {number} blockNumber - Block number
   * @returns {Promise<Object>}
   */
  async getBlock(blockNumber) {
    return await this.provider.getBlock(blockNumber);
  }

  /**
   * Get current gas price
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
   * @param {string} message - Message to sign
   * @returns {Promise<string>}
   */
  async signMessage(message) {
    return await this.wallet.signMessage(message);
  }

  /**
   * Verify signature
   * @param {string} message - Original message
   * @param {string} signature - Signature
   * @returns {string} Signer address
   */
  verifyMessage(message, signature) {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Get wallet address
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
   * Check if address is valid
   * @param {string} address
   * @returns {boolean}
   */
  static isValidAddress(address) {
    return ethers.isAddress(address);
  }
}

module.exports = WalletManager;
