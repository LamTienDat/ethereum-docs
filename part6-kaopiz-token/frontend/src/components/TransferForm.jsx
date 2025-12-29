import { useState } from 'react'
import { ethers } from 'ethers'
import './TransferForm.css'

const TOKEN_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)'
]

function TransferForm({ wallet, contractAddress, onTransferComplete }) {
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleTransfer = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      // Validation
      if (!ethers.isAddress(recipient)) {
        throw new Error('Invalid recipient address')
      }

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Invalid amount')
      }

      // Create contract instance with signer
      const contract = new ethers.Contract(
        contractAddress,
        TOKEN_ABI,
        wallet.signer
      )

      // Get decimals
      const decimals = await contract.decimals()

      // Convert amount to wei
      const amountWei = ethers.parseUnits(amount, decimals)

      // Check balance
      const balance = await contract.balanceOf(wallet.account)
      if (balance < amountWei) {
        throw new Error('Insufficient balance')
      }

      console.log('Sending transaction...')
      console.log('To:', recipient)
      console.log('Amount:', amount)

      // Send transaction
      const tx = await contract.transfer(recipient, amountWei)
      
      setSuccess(`Transaction sent! Hash: ${tx.hash.slice(0, 10)}...`)
      console.log('Transaction hash:', tx.hash)

      // Wait for confirmation
      console.log('Waiting for confirmation...')
      const receipt = await tx.wait()
      
      console.log('Transaction confirmed!', receipt)
      setSuccess(
        `✅ Transfer successful! ${amount} KPC sent to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`
      )

      // Reset form
      setRecipient('')
      setAmount('')

      // Notify parent to refresh
      if (onTransferComplete) {
        onTransferComplete()
      }

    } catch (err) {
      console.error('Transfer error:', err)
      
      // Handle specific errors
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user')
      } else if (err.message.includes('insufficient funds')) {
        setError('Insufficient ETH for gas fee')
      } else if (err.message.includes('Pausable: paused')) {
        setError('Contract is paused')
      } else {
        setError(err.reason || err.message || 'Transfer failed')
      }
    } finally {
      setLoading(false)
    }
  }

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
          {loading ? '⏳ Sending...' : '🚀 Send Transfer'}
        </button>
      </form>

      {error && <div className="error-message">❌ {error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  )
}

export default TransferForm

