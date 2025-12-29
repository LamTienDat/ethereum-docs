import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { getUserProfile } from '../utils/siwe';
import './SIWEAuth.css';

/**
 * Component: SIWEAuth
 * 
 * Hiển thị SIWE authentication UI
 */
export function SIWEAuth() {
  const { isConnected } = useWallet();
  const { isAuthenticated, isAuthenticating, user, error, signIn, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  /**
   * Handle Sign In
   */
  const handleSignIn = async () => {
    const success = await signIn();
    if (success) {
      console.log('✅ Signed in successfully');
    }
  };

  /**
   * Handle Sign Out
   */
  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
    console.log('👋 Signed out');
  };

  /**
   * Load user profile (example protected route)
   */
  const handleLoadProfile = async () => {
    try {
      setLoadingProfile(true);
      const token = localStorage.getItem('siwe_token');
      const profileData = await getUserProfile(token);
      setProfile(profileData);
      console.log('✅ Profile loaded:', profileData);
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      alert('Lỗi khi tải profile: ' + err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Nếu chưa connect wallet
  if (!isConnected) {
    return (
      <div className="siwe-auth">
        <div className="alert alert-info">
          <span className="alert-icon">ℹ️</span>
          <div className="alert-content">
            <strong>Vui lòng kết nối ví trước</strong>
            <p>Bạn cần kết nối MetaMask để sử dụng SIWE authentication</p>
          </div>
        </div>
      </div>
    );
  }

  // Nếu chưa authenticate
  if (!isAuthenticated) {
    return (
      <div className="siwe-auth">
        <div className="auth-card">
          <div className="auth-header">
            <h3>🔐 Sign-In With Ethereum</h3>
            <p>Xác thực bằng ví của bạn - không cần password!</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">❌</span>
              <div className="alert-content">
                <strong>Lỗi xác thực</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="auth-body">
            <div className="info-box">
              <h4>📝 SIWE hoạt động như thế nào?</h4>
              <ol>
                <li>Backend tạo một nonce ngẫu nhiên</li>
                <li>Frontend tạo message theo format EIP-4361</li>
                <li>Bạn ký message bằng private key</li>
                <li>Backend verify signature</li>
                <li>Nhận JWT token để truy cập protected routes</li>
              </ol>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={handleSignIn}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <span className="spinner"></span>
                  Đang xác thực...
                </>
              ) : (
                <>
                  🔐 Sign-In với Ethereum
                </>
              )}
            </button>

            <p className="hint">
              Bạn sẽ được yêu cầu ký một message để chứng minh ownership
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Đã authenticate
  return (
    <div className="siwe-auth">
      <div className="auth-card success">
        <div className="auth-header">
          <div className="success-badge">
            <span className="status-dot"></span>
            <span>Đã xác thực</span>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSignOut}
          >
            👋 Sign Out
          </button>
        </div>

        <div className="auth-body">
          <div className="user-info">
            <h4>👤 Thông tin người dùng</h4>
            
            <div className="info-row">
              <span className="info-label">📍 Địa chỉ:</span>
              <span className="info-value" title={user.address}>
                {user.address.substring(0, 10)}...{user.address.substring(user.address.length - 8)}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">🌐 Chain ID:</span>
              <span className="info-value">{user.chainId}</span>
            </div>

            <div className="info-row">
              <span className="info-label">⏰ Issued At:</span>
              <span className="info-value">
                {new Date(user.iat * 1000).toLocaleString('vi-VN')}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">⏳ Expires At:</span>
              <span className="info-value">
                {new Date(user.exp * 1000).toLocaleString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="protected-route-demo">
            <h4>🔒 Protected Route Demo</h4>
            <p>Thử truy cập một protected route:</p>
            
            <button
              className="btn btn-outline"
              onClick={handleLoadProfile}
              disabled={loadingProfile}
            >
              {loadingProfile ? (
                <>
                  <span className="spinner"></span>
                  Đang tải...
                </>
              ) : (
                'Tải Profile'
              )}
            </button>

            {profile && (
              <div className="profile-data">
                <h5>✅ Profile Data:</h5>
                <pre>{JSON.stringify(profile, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="success-message">
            <p>
              ✅ <strong>Xác thực thành công!</strong>
            </p>
            <p>
              Bạn đã đăng nhập bằng SIWE. Token JWT của bạn được lưu trong localStorage
              và sẽ được gửi kèm trong các requests đến protected routes.
            </p>
          </div>
        </div>
      </div>

      <div className="info-card">
        <h4>💡 Lưu ý</h4>
        <ul>
          <li>Token sẽ tự động expire sau 24 giờ</li>
          <li>Nếu bạn đổi account hoặc network, sẽ tự động sign out</li>
          <li>Trong production, nên implement refresh token mechanism</li>
          <li>SIWE cho phép authentication không cần password</li>
        </ul>
      </div>
    </div>
  );
}

