import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './TokenInfo.css'

// Minimal ABI to read token information
const TOKEN_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function MAX_SUPPLY() view returns (uint256)',
  'function paused() view returns (bool)',
  'function getTokenInfo() view returns (string, string, uint8, uint256, uint256, bool)'
]

function TokenInfo({ wallet, contractAddress }) {
  const [tokenData, setTokenData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (wallet && contractAddress) {
      loadTokenInfo()
    }
  }, [wallet, contractAddress])

  const loadTokenInfo = async () => {
    setLoading(true)
    setError('')

    try {
      const contract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        wallet.provider
      )

      // Load token info
      const [name, symbol, decimals, totalSupply, maxSupply, isPaused] = 
        await contract.getTokenInfo()

      // Load user balance
      const balance = await contract.balanceOf(wallet.account)

      setTokenData({
        name,
        symbol,
        decimals,
        totalSupply: ethers.formatUnits(totalSupply, decimals),
        maxSupply: ethers.formatUnits(maxSupply, decimals),
        userBalance: ethers.formatUnits(balance, decimals),
        isPaused
      })

    } catch (err) {
      console.error('Error loading token info:', err)
      setError('Failed to load token information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="token-info">
        <h2>📊 Token Information</h2>
        <div className="loading">Loading...</div>
      </div>
    )
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
    )
  }

  if (!tokenData) {
    return null
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
          <div className="value">{parseFloat(tokenData.decimals).toLocaleString()}</div>
        </div>

        <div className="info-card highlight">
          <div className="label">Your Balance</div>
          <div className="value big">
            {parseFloat(tokenData.userBalance).toLocaleString()} {tokenData.symbol}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Total Supply</div>
          <div className="value">
            {parseFloat(tokenData.totalSupply).toLocaleString()} {tokenData.symbol}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Max Supply</div>
          <div className="value">
            {parseFloat(tokenData.maxSupply).toLocaleString()} {tokenData.symbol}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Contract Status</div>
          <div className={`value ${tokenData.isPaused ? 'paused' : 'active'}`}>
            {tokenData.isPaused ? '⏸️ Paused' : '✅ Active'}
          </div>
        </div>

        <div className="info-card">
          <div className="label">Supply Percentage</div>
          <div className="value">
            {((parseFloat(tokenData.totalSupply) / parseFloat(tokenData.maxSupply)) * 100).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  )
}

export default TokenInfo

