/**
 * SIWE (Sign-In With Ethereum) Utilities
 * 
 * Các hàm helper để làm việc với SIWE authentication
 */

import { getAddress } from 'ethers';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Tạo SIWE message theo format EIP-4361
 * 
 * @param {string} address - Ethereum address
 * @param {number} chainId - Chain ID
 * @param {string} nonce - Random nonce từ backend
 * @returns {string} SIWE message
 */
export function createSiweMessage(address, chainId, nonce) {
  const domain = window.location.host;
  const origin = window.location.origin;
  const issuedAt = new Date().toISOString();

  // Đảm bảo address có checksum đúng theo EIP-55
  const checksumAddress = getAddress(address);

  const message = `${domain} wants you to sign in with your Ethereum account:
${checksumAddress}

I accept the Terms of Service: ${origin}/tos

URI: ${origin}
Version: 1
Chain ID: ${chainId}
Nonce: ${nonce}
Issued At: ${issuedAt}`;

  return message;
}

/**
 * Request nonce từ backend
 * 
 * @returns {Promise<string>} Nonce
 */
export async function requestNonce() {
  try {
    const response = await fetch(`${API_URL}/api/auth/nonce`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.nonce;
  } catch (error) {
    console.error('❌ Error requesting nonce:', error);
    throw error;
  }
}

/**
 * Verify SIWE message và signature với backend
 * 
 * @param {string} message - SIWE message
 * @param {string} signature - Signature từ wallet
 * @returns {Promise<{token: string, address: string}>} JWT token và address
 */
export async function verifySiweMessage(message, signature) {
  try {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, signature }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error verifying message:', error);
    throw error;
  }
}

/**
 * Get current user info từ backend (protected route)
 * 
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User info
 */
export async function getCurrentUser(token) {
  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    throw error;
  }
}

/**
 * Logout user
 * 
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export async function logoutUser(token) {
  try {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error logging out:', error);
    throw error;
  }
}

/**
 * Get user profile (example protected route)
 * 
 * @param {string} token - JWT token
 * @returns {Promise<Object>} User profile
 */
export async function getUserProfile(token) {
  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    throw error;
  }
}

/**
 * Save token to localStorage
 * 
 * @param {string} token - JWT token
 */
export function saveToken(token) {
  localStorage.setItem('siwe_token', token);
}

/**
 * Get token from localStorage
 * 
 * @returns {string|null} JWT token
 */
export function getToken() {
  return localStorage.getItem('siwe_token');
}

/**
 * Remove token from localStorage
 */
export function removeToken() {
  localStorage.removeItem('siwe_token');
}

/**
 * Check if token exists
 * 
 * @returns {boolean}
 */
export function hasToken() {
  return !!getToken();
}

