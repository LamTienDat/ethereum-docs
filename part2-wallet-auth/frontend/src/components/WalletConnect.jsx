import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { formatEther } from 'ethers';
import './WalletConnect.css';

/**
 * Component: WalletConnect
 * 
 * Hiển thị button kết nối MetaMask và thông tin wallet
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

  // Lấy số dư khi connect
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

  // Lấy tên network
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

  // Format địa chỉ
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(38)}`;
  };

  // Nếu chưa cài MetaMask
  if (!isMetaMaskInstalled) {
    return (
      <div className="wallet-connect">
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-content">
            <strong>MetaMask chưa được cài đặt!</strong>
            <p>Vui lòng cài đặt MetaMask extension để tiếp tục.</p>
          </div>
        </div>
        <a 
          href="https://metamask.io/download/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          Cài đặt MetaMask
        </a>
      </div>
    );
  }

  // Nếu chưa connect
  if (!isConnected) {
    return (
      <div className="wallet-connect">
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            <div className="alert-content">
              <strong>Lỗi kết nối</strong>
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
              Đang kết nối...
            </>
          ) : (
            <>
              🦊 Kết nối MetaMask
            </>
          )}
        </button>
        
        <p className="hint">
          Nhấn để kết nối ví MetaMask của bạn
        </p>
      </div>
    );
  }

  // Đã connect
  return (
    <div className="wallet-connect">
      <div className="wallet-card">
        <div className="wallet-header">
          <div className="wallet-status">
            <span className="status-dot"></span>
            <span>Đã kết nối</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={disconnect}
          >
            Ngắt kết nối
          </button>
        </div>

        <div className="wallet-info">
          <div className="info-row">
            <span className="info-label">📍 Địa chỉ:</span>
            <span className="info-value" title={account}>
              {formatAddress(account)}
            </span>
          </div>

          <div className="info-row">
            <span className="info-label">💰 Số dư:</span>
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
              alert('Đã copy địa chỉ!');
            }}
          >
            📋 Copy địa chỉ
          </button>
          
          <a
            href={`https://sepolia.etherscan.io/address/${account}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            🔍 Xem trên Etherscan
          </a>
        </div>
      </div>
    </div>
  );
}

