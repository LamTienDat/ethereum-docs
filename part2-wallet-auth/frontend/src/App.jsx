import { WalletConnect } from './components/WalletConnect';
import { SIWEAuth } from './components/SIWEAuth';
import './App.css';

/**
 * Main App Component
 * 
 * Demo kết nối MetaMask, quản lý wallet state và SIWE authentication
 */
function App() {
  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🦊 Phần 2: Ví, Ký và Xác thực</h1>
          <p className="subtitle">
            Học cách kết nối MetaMask, quản lý wallet state và SIWE authentication
          </p>
        </header>

        <main className="main">
          <section className="section">
            <h2>🔌 Kết nối Ví</h2>
            <p className="section-description">
              Kết nối ví MetaMask của bạn để bắt đầu. Ứng dụng sẽ tự động
              detect account changes và network changes.
            </p>
            <WalletConnect />
          </section>

          <section className="section">
            <h2>🔐 SIWE Authentication</h2>
            <p className="section-description">
              Sign-In With Ethereum (SIWE) cho phép bạn xác thực bằng ví
              mà không cần password. Đây là chuẩn EIP-4361.
            </p>
            <SIWEAuth />
          </section>

          <section className="section">
            <h2>📚 Những gì bạn đã học</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">✅</div>
                <h3>Kết nối MetaMask</h3>
                <p>Sử dụng <code>eth_requestAccounts</code> để kết nối ví</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🎣</div>
                <h3>Custom Hook</h3>
                <p>Tạo <code>useWallet</code> và <code>useAuth</code> hooks</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📡</div>
                <h3>Event Listeners</h3>
                <p>Lắng nghe <code>accountsChanged</code>, <code>chainChanged</code></p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔄</div>
                <h3>Auto-reconnect</h3>
                <p>Tự động kết nối lại nếu đã connect trước đó</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">📖</div>
                <h3>Provider & Signer</h3>
                <p>Hiểu rõ sự khác biệt và khi nào dùng</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">🔐</div>
                <h3>SIWE Auth</h3>
                <p>Xác thực với EIP-4361 và JWT tokens</p>
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
            💡 <strong>Tip:</strong> Mở DevTools Console để xem logs chi tiết
          </p>
          <p className="copyright">
            Tài liệu được biên soạn bởi Kaopiz Team - © 2025
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;

