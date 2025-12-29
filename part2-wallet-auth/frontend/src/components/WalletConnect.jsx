import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatEther } from 'ethers';
import './WalletConnect.css';

/**
 * Component: WalletConnect
 * 
 * Display MetaMask connection button and wallet information
 */
export function WalletConnect() {
  const {
    account,
    chainId,
    provider,
    isConnected,
    isConnecting,
    isMetaMaskInstalled,
    error,
    connect,
    disconnect
  } = useWallet();

  const [balance, setBalance] = useState(null);
  const [networkName, setNetworkName] = useState('');

  // Get balance when connected
  useEffect(() => {
    if (account && provider) {
      provider.getBalance(account)
        .then(bal => {
          setBalance(formatEther(bal));
        })
        .catch(err => {
          console.error('Error getting balance:', err);
        });
    } else {
      setBalance(null);
    }
  }, [account, provider]);

  // Get network name
  useEffect(() => {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Mumbai Testnet',
      56: 'BSC Mainnet',
      97: 'BSC Testnet'
    };
    setNetworkName(networks[chainId] || `Unknown (${chainId})`);
  }, [chainId]);

  // Format address
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  // If MetaMask not installed
  if (!isMetaMaskInstalled) {
    return (
      <div className="wallet-connect">
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>MetaMask is not installed!</strong>
            <p>Please install MetaMask extension to continue.</p>
          </div>
        </div>
        <a 
          href="https://metamask.io/download/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Install MetaMask
        </a>
      </div>
    );
  }

  // If not connected
  if (!isConnected) {
    return (
      <div className="wallet-connect">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <div className="alert-content">
              <strong>Connection Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}
        
        <button 
          className="btn btn-primary btn-lg"
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <span className="spinner"></span>
              Connecting...
            </>
          ) : (
            <>
              🦊 Connect MetaMask
            </>
          )}
        </button>
        
        <p className="hint">
          Click to connect your MetaMask wallet
        </p>
      </div>
    );
  }

  // Connected
  return (
    <div className="wallet-connect">
      <div className="wallet-card">
        <div className="wallet-header">
          <div className="wallet-status">
            <span className="status-dot"></span>
            <span>Connected</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={disconnect}
          >
            Disconnect
          </button>
        </div>

        <div className="wallet-info">
          <div className="info-row">
            <span className="info-label">📍 Address:</span>
            <span className="info-value" title={account}>
              {formatAddress(account)}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">💰 Balance:</span>
            <span className="info-value">
              {balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'Loading...'}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">🌐 Network:</span>
            <span className="info-value">{networkName}</span>
          </div>

          <div className="info-row">
            <span className="info-label">🔗 Chain ID:</span>
            <span className="info-value">{chainId}</span>
          </div>
        </div>

        <div className="wallet-actions">
          <button 
            className="btn btn-outline"
            onClick={() => {
              navigator.clipboard.writeText(account);
              alert('Address copied!');
            }}
          >
            📋 Copy Address
          </button>
          
          <a
            href={`https://sepolia.etherscan.io/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            🔍 View on Etherscan
          </a>
        </div>
      </div>
    </div>
  );
}

