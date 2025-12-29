import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWallet } from '../hooks/useWallet';
import { getUserProfile } from '../utils/siwe';
import './SIWEAuth.css';

/**
 * Component: SIWEAuth
 * 
 * Display SIWE authentication UI
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
      alert('Error loading profile: ' + err.message);
    } finally {
      setLoadingProfile(false);
    }
  };

  // If wallet not connected
  if (!isConnected) {
    return (
      <div className="siwe-auth">
        <div className="alert alert-info">
          <span className="alert-icon">ℹ️</span>
          <div className="alert-content">
            <strong>Please connect wallet first</strong>
            <p>You need to connect MetaMask to use SIWE authentication</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated
  if (!isAuthenticated) {
    return (
      <div className="siwe-auth">
        <div className="auth-card">
          <div className="auth-header">
            <h3>🔐 Sign-In With Ethereum</h3>
            <p>Authenticate with your wallet - no password needed!</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">❌</span>
              <div className="alert-content">
                <strong>Authentication Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="auth-body">
            <div className="info-box">
              <h4>📝 How does SIWE work?</h4>
              <ol>
                <li>Backend generates a random nonce</li>
                <li>Frontend creates message in EIP-4361 format</li>
                <li>You sign the message with your private key</li>
                <li>Backend verifies the signature</li>
                <li>Receive JWT token to access protected routes</li>
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
                  Authenticating...
                </>
              ) : (
                <>
                  🔐 Sign-In with Ethereum
                </>
              )}
            </button>

            <p className="hint">
              You will be asked to sign a message to prove ownership
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated
  return (
    <div className="siwe-auth">
      <div className="auth-card success">
        <div className="auth-header">
          <div className="success-badge">
            <span className="status-dot"></span>
            <span>Authenticated</span>
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
            <h4>👤 User Information</h4>
            
            <div className="info-row">
              <span className="info-label">📍 Address:</span>
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
                {new Date(user.iat * 1000).toLocaleString('en-US')}
              </span>
            </div>

            <div className="info-row">
              <span className="info-label">⏳ Expires At:</span>
              <span className="info-value">
                {new Date(user.exp * 1000).toLocaleString('en-US')}
              </span>
            </div>
          </div>

          <div className="protected-route-demo">
            <h4>🔒 Protected Route Demo</h4>
            <p>Try accessing a protected route:</p>
            
            <button
              className="btn btn-outline"
              onClick={handleLoadProfile}
              disabled={loadingProfile}
            >
              {loadingProfile ? (
                <>
                  <span className="spinner"></span>
                  Loading...
                </>
              ) : (
                'Load Profile'
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
              ✅ <strong>Authentication successful!</strong>
            </p>
            <p>
              You are signed in with SIWE. Your JWT token is stored in localStorage
              and will be sent with requests to protected routes.
            </p>
          </div>
        </div>
      </div>

      <div className="info-card">
        <h4>💡 Notes</h4>
        <ul>
          <li>Token will automatically expire after 24 hours</li>
          <li>If you change account or network, you will be automatically signed out</li>
          <li>In production, implement a refresh token mechanism</li>
          <li>SIWE allows authentication without passwords</li>
        </ul>
      </div>
    </div>
  );
}
