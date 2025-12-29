import { useState } from 'react'
import './App.css'
import WalletConnect from './components/WalletConnect'
import TokenInfo from './components/TokenInfo'
import TransferForm from './components/TransferForm'
import TransactionHistory from './components/TransactionHistory'

// ⚠️ IMPORTANT: Replace YOUR_CONTRACT_ADDRESS with actual contract address
// From deployment: 0xE4e0429D16f174E36D966806569aD800eD6F5B12
const CONTRACT_ADDRESS = '0xE4e0429D16f174E36D966806569aD800eD6F5B12'

function App() {
  const [wallet, setWallet] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleConnect = (walletData) => {
    setWallet(walletData)
    console.log('Wallet connected:', walletData)
  }

  const handleDisconnect = () => {
    setWallet(null)
    console.log('Wallet disconnected')
  }

  const handleTransferComplete = () => {
    // Refresh token info and transaction history
    setRefreshKey(prev => prev + 1)
  }

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
                <li>Get testnet ETH from <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer">faucet</a></li>
                <li>Click "Connect Wallet" button above</li>
              </ol>
            </div>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p className="contract-info">
          Contract: <a 
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App

