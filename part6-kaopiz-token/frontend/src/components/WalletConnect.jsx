import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './WalletConnect.css'

function WalletConnect({ onConnect, onDisconnect, currentWallet }) {
  const [account, setAccount] = useState(null)
  const [chainId, setChainId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already connected
    if (window.ethereum) {
      checkConnection()
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
          window.ethereum.removeListener('chainChanged', handleChainChanged)
        }
      }
    }
  }, [])

  const checkConnection = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.listAccounts()
      
      if (accounts.length > 0) {
        const signer = await provider.getSigner()
        const address = await signer.getAddress()
        const network = await provider.getNetwork()
        
        setAccount(address)
        setChainId(Number(network.chainId))
        
        onConnect({
          account: address,
          signer: signer,
          provider: provider,
          chainId: Number(network.chainId)
        })
      }
    } catch (err) {
      console.error('Error checking connection:', err)
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      setAccount(null)
      setChainId(null)
      onDisconnect()
    } else {
      // Account changed
      window.location.reload()
    }
  }

  const handleChainChanged = () => {
    // Reload page when chain changes
    window.location.reload()
  }

  const connectWallet = async () => {
    setError('')
    
    if (!window.ethereum) {
      setError('Please install MetaMask!')
      return
    }

    try {
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const networkChainId = Number(network.chainId)
      
      setAccount(address)
      setChainId(networkChainId)
      
      // Check if on correct network (Sepolia = 11155111)
      if (networkChainId !== 11155111) {
        setError('⚠️ Please switch to Sepolia Testnet')
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
          })
        } catch (switchError) {
          console.error('Error switching network:', switchError)
        }
      }
      
      onConnect({
        account: address,
        signer: signer,
        provider: provider,
        chainId: networkChainId
      })
      
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError(err.message || 'Failed to connect wallet')
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setChainId(null)
    setError('')
    onDisconnect()
  }

  const getNetworkName = (chainId) => {
    const networks = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      97: 'BSC Testnet',
      31337: 'Localhost'
    }
    return networks[chainId] || `Chain ID: ${chainId}`
  }

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
              <span className={`network ${chainId === 11155111 ? 'correct' : 'wrong'}`}>
                {getNetworkName(chainId)}
              </span>
            </div>
          </div>
          <button onClick={disconnectWallet} className="disconnect-btn">
            Disconnect
          </button>
          {chainId !== 11155111 && (
            <div className="warning">
              ⚠️ Please switch to Sepolia Testnet
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WalletConnect

