import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './TransactionHistory.css'

const TOKEN_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function decimals() view returns (uint8)'
]

function TransactionHistory({ wallet, contractAddress }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (wallet && contractAddress) {
      loadTransactions()
    }
  }, [wallet, contractAddress])

  const loadTransactions = async () => {
    setLoading(true)
    setError('')

    try {
      const contract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        wallet.provider
      )

      // Get decimals
      const decimals = await contract.decimals()

      // Get current block
      const currentBlock = await wallet.provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 10000) // Last ~10000 blocks

      console.log(`Querying events from block ${fromBlock} to ${currentBlock}`)

      // Get Transfer events
      const filterFrom = contract.filters.Transfer(wallet.account, null)
      const filterTo = contract.filters.Transfer(null, wallet.account)

      const [eventsFrom, eventsTo] = await Promise.all([
        contract.queryFilter(filterFrom, fromBlock, currentBlock),
        contract.queryFilter(filterTo, fromBlock, currentBlock),
      ])

      console.log('Events from:', eventsFrom.length)
      console.log('Events to:', eventsTo.length)

      // Combine and sort events
      const allEvents = [...eventsFrom, ...eventsTo]
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, 20) // Show last 20 transactions

      // Format transactions
      const formattedTxs = await Promise.all(
        allEvents.map(async (event) => {
          try {
            const block = await event.getBlock()
            return {
              hash: event.transactionHash,
              from: event.args.from,
              to: event.args.to,
              value: ethers.formatUnits(event.args.value, decimals),
              timestamp: new Date(block.timestamp * 1000).toLocaleString(),
              blockNumber: event.blockNumber,
              type:
                event.args.from.toLowerCase() === wallet.account.toLowerCase()
                  ? 'sent'
                  : 'received',
            }
          } catch (err) {
            console.error('Error formatting tx:', err)
            return null
          }
        })
      )

      setTransactions(formattedTxs.filter(tx => tx !== null))

    } catch (err) {
      console.error('Error loading transactions:', err)
      setError('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }

  const getExplorerUrl = (txHash) => {
    if (wallet.chainId === 11155111) {
      return `https://sepolia.etherscan.io/tx/${txHash}`
    } else if (wallet.chainId === 97) {
      return `https://testnet.bscscan.com/tx/${txHash}`
    }
    return '#'
  }

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
          {loading ? '⏳' : '🔄'}
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
            <div key={`${tx.hash}-${index}`} className={`transaction-item ${tx.type}`}>
              <div className="tx-header">
                <span className={`tx-type ${tx.type}`}>
                  {tx.type === 'sent' ? '📤 Sent' : '📥 Received'}
                </span>
                <span className="tx-amount">
                  {parseFloat(tx.value).toFixed(4)} KPC
                </span>
              </div>
              <div className="tx-details">
                <div className="tx-address">
                  <span className="label">
                    {tx.type === 'sent' ? 'To:' : 'From:'}
                  </span>
                  <span className="address">
                    {tx.type === 'sent'
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
  )
}

export default TransactionHistory

