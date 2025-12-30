import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';
import {
  requestNonce,
  createSiweMessage,
  verifySiweMessage,
  getCurrentUser,
  logoutUser,
  saveToken,
  getToken,
  removeToken,
  hasToken
} from '../utils/siwe';

/**
 * Custom Hook: useAuth
 * 
 * Manage SIWE authentication
 * 
 * Returns:
 * - isAuthenticated: Whether user is logged in
 * - isAuthenticating: Authenticating status
 * - user: User information
 * - error: Error if any
 * - signIn: Function to sign in with SIWE
 * - signOut: Function to sign out
 */
export function useAuth() {
  const { account, chainId, signer, isConnected } = useWallet();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Sign in with SIWE
   */
  const signIn = useCallback(async () => {
    if (!isConnected || !account || !signer || !chainId) {
      setError('Please connect wallet first');
      return false;
    }

    try {
      setIsAuthenticating(true);
      setError(null);

      console.log('🔐 Starting SIWE authentication...');

      // Step 1: Request nonce from backend
      console.log('📝 Step 1: Requesting nonce...');
      const nonce = await requestNonce();
      console.log('✅ Nonce received:', nonce);

      // Step 2: Create SIWE message
      console.log('📝 Step 2: Creating SIWE message...');
      const message = createSiweMessage(account, chainId, nonce);
      console.log('✅ Message created');

      // Step 3: Sign message
      console.log('📝 Step 3: Signing message...');
      const signature = await signer.signMessage(message);
      console.log('✅ Message signed');

      // Step 4: Verify with backend
      console.log('📝 Step 4: Verifying with backend...');
      const result = await verifySiweMessage(message, signature);
      console.log('✅ Verification successful');

      // Step 5: Save token
      saveToken(result.token);
      
      // Step 6: Get user info
      const userInfo = await getCurrentUser(result.token);
      setUser(userInfo);
      setIsAuthenticated(true);

      console.log('🎉 Sign-In completed!');
      return true;

    } catch (err) {
      console.error('❌ Sign-In error:', err);
      
      if (err.code === 4001) {
        setError('You rejected signing the message');
      } else {
        setError(err.message || 'Authentication error');
      }
      
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [account, chainId, signer, isConnected]);

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    try {
      const token = getToken();
      
      if (token) {
        // Call logout API
        await logoutUser(token);
      }
      
      // Clear state
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      console.log('👋 Signed out successfully');
      
    } catch (err) {
      console.error('❌ Sign-Out error:', err);
      // Still clear local state even if API call fails
      removeToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  /**
   * Check authentication status khi mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      if (!hasToken()) {
        return;
      }

      try {
        const token = getToken();
        const userInfo = await getCurrentUser(token);
        
        setUser(userInfo);
        setIsAuthenticated(true);
        console.log('✅ Already authenticated:', userInfo.address);
        
      } catch (err) {
        console.error('❌ Auth check failed:', err);
        // Token invalid or expired
        removeToken();
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuth();
  }, []);

  /**
   * Auto sign out when account or chain changes
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if account changed
      if (account && account.toLowerCase() !== user.address.toLowerCase()) {
        console.log('👤 Account changed, signing out...');
        signOut();
      }
      
      // Check if chain changed
      if (chainId && chainId !== user.chainId) {
        console.log('🌐 Chain changed, signing out...');
        signOut();
      }
    }
  }, [account, chainId, isAuthenticated, user, signOut]);

  /**
   * Auto sign out khi disconnect wallet
   */
  useEffect(() => {
    if (!isConnected && isAuthenticated) {
      console.log('🔌 Wallet disconnected, signing out...');
      signOut();
    }
  }, [isConnected, isAuthenticated, signOut]);

  return {
    isAuthenticated,
    isAuthenticating,
    user,
    error,
    signIn,
    signOut
  };
}

