import { WalletConnect } from './components/WalletConnect';
import { SIWEAuth } from './components/SIWEAuth';
import './App.css';

/**
 * Main App Component
 * 
 * Demo MetaMask connection, wallet state management and SIWE authentication
 */
function App() {
  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🦊 Part 2: Wallet, Signing and Authentication</h1>
          <p className="subtitle">
            Learn how to connect MetaMask, manage wallet state and SIWE authentication
          </p>
        </header>

        <main className="main">
          <section className="section">
            <h2>🔌 Connect Wallet</h2>
            <p className="section-description">
              Connect your MetaMask wallet to get started. The app will automatically
              detect account changes and network changes.
            </p>
            <WalletConnect />
          </section>

          <section className="section">
            <h2>🔐 SIWE Authentication</h2>
            <p className="section-description">
              Sign-In With Ethereum (SIWE) allows you to authenticate with your wallet
              without a password. This is the EIP-4361 standard.
            </p>
            <SIWEAuth />
          </section>

          <section className="section">
            <h2>📚 What You've Learned</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h3>Connect MetaMask</h3>
                <p>Use <code>eth_requestAccounts</code> to connect wallet</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎣</div>
                <h3>Custom Hook</h3>
                <p>Create <code>useWallet</code> and <code>useAuth</code> hooks</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📡</div>
                <h3>Event Listeners</h3>
                <p>Listen to <code>accountsChanged</code>, <code>chainChanged</code></p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔄</div>
                <h3>Auto-reconnect</h3>
                <p>Automatically reconnect if previously connected</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📖</div>
                <h3>Provider & Signer</h3>
                <p>Understand the difference and when to use each</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <h3>SIWE Auth</h3>
                <p>Authenticate with EIP-4361 and JWT tokens</p>
              </div>
            </div>
          </section>

          <section className="section">
            <h2>🔗 Resources</h2>
            <div className="resources">
              <a 
                href="https://docs.metamask.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                📚 MetaMask Docs
              </a>
              <a 
                href="https://docs.ethers.org/v6/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                📖 Ethers.js v6 Docs
              </a>
              <a 
                href="https://eips.ethereum.org/EIPS/eip-1193" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                📄 EIP-1193 Spec
              </a>
              <a 
                href="https://login.xyz/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                🔐 Sign-In With Ethereum
              </a>
              <a 
                href="https://eips.ethereum.org/EIPS/eip-4361" 
                target="_blank" 
                rel="noopener noreferrer"
                className="resource-link"
              >
                📜 EIP-4361 Spec
              </a>
            </div>
          </section>
        </main>

        <footer className="footer">
          <p>
            💡 <strong>Tip:</strong> Open DevTools Console to see detailed logs
          </p>
          <p className="copyright">
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

