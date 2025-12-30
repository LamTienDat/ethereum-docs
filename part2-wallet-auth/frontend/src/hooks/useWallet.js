import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

/**
 * Custom Hook: useWallet
 * 
 * Manage MetaMask connection and wallet state
 * 
 * Returns:
 * - account: Current wallet address
 * - chainId: Current chain ID
 * - provider: Ethers provider
 * - signer: Ethers signer
 * - isConnected: Connection status
 * - isConnecting: Connecting status
 * - error: Error if any
 * - connect: Function to connect
 * - disconnect: Function to disconnect
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const isConnected = !!account;

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window.ethereum !== 'undefined';

  /**
   * Connect wallet
   */
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      setError('MetaMask is not installed!');
      return false;
    }

    try {
      setIsConnecting(true);
      setError(null);

      console.log('🔄 Connecting to MetaMask...');

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get chain ID
      const chainIdHex = await window.ethereum.request({
        method: 'eth_chainId'
      });
      const chainIdNum = parseInt(chainIdHex, 16);

      // Create provider and signer
      const ethersProvider = new BrowserProvider(window.ethereum);
      const ethersSigner = await ethersProvider.getSigner();

      // Update state
      setAccount(accounts[0]);
      setChainId(chainIdNum);
      setProvider(ethersProvider);
      setSigner(ethersSigner);

      console.log('✅ Connected:', accounts[0]);
      console.log('🌐 Chain ID:', chainIdNum);

      return true;
    } catch (err) {
      console.error('❌ Connection error:', err);
      
      if (err.code === 4001) {
        setError('You rejected the connection');
      } else if (err.code === -32002) {
        setError('Please check MetaMask, there is a pending request');
      } else {
        setError(err.message);
      }
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskInstalled]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setAccount(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
    setError(null);
    console.log('👋 Disconnected');
  }, []);

  /**
   * Handle account change
   */
  const handleAccountsChanged = useCallback((accounts) => {
    console.log('👤 Accounts changed:', accounts);
    
    if (accounts.length === 0) {
      // User disconnected
      disconnect();
    } else if (accounts[0] !== account) {
      // Account changed
      setAccount(accounts[0]);
      console.log('✅ Switched to:', accounts[0]);
    }
  }, [account, disconnect]);

  /**
   * Handle chain change
   */
  const handleChainChanged = useCallback((chainIdHex) => {
    const chainIdNum = parseInt(chainIdHex, 16);
    console.log('🌐 Chain changed:', chainIdNum);
    setChainId(chainIdNum);
    
    // Reload provider and signer
    if (window.ethereum) {
      const ethersProvider = new BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
      ethersProvider.getSigner().then(setSigner);
    }
  }, []);

  /**
   * Handle disconnect
   */
  const handleDisconnect = useCallback(() => {
    console.log('🔌 Disconnected');
    disconnect();
  }, [disconnect]);

  /**
   * Setup event listeners
   */
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [isMetaMaskInstalled, handleAccountsChanged, handleChainChanged, handleDisconnect]);

  /**
   * Auto-connect if previously connected
   */
  useEffect(() => {
    if (!isMetaMaskInstalled) return;

    // Check if already connected
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          console.log('✅ Already connected, auto-connecting...');
          connect();
        }
      })
      .catch(err => {
        console.error('❌ Auto-connect error:', err);
      });
  }, [isMetaMaskInstalled]); // Only run once on mount

  return {
    account,
    chainId,
    provider,
    signer,
    isConnected,
    isConnecting,
    isMetaMaskInstalled,
    error,
    connect,
    disconnect
  };
}

