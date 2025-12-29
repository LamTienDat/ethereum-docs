import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { SiweMessage } from 'siwe';
import { ethers } from 'ethers';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// In-memory storage cho nonces (Production nên dùng Redis)
const nonces = new Map();

// Cleanup old nonces mỗi 5 phút
setInterval(() => {
  const now = Date.now();
  for (const [nonce, timestamp] of nonces.entries()) {
    if (now - timestamp > 5 * 60 * 1000) { // 5 minutes
      nonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

/**
 * GET /api/auth/nonce
 * Generate nonce cho SIWE
 */
app.get('/api/auth/nonce', (req, res) => {
  try {
    // Generate random nonce
    const nonce = ethers.hexlify(ethers.randomBytes(16));
    
    // Lưu nonce với timestamp
    nonces.set(nonce, Date.now());
    
    console.log('✅ Generated nonce:', nonce);
    
    res.json({ 
      nonce,
      message: 'Nonce generated successfully'
    });
  } catch (error) {
    console.error('❌ Error generating nonce:', error);
    res.status(500).json({ 
      error: 'Failed to generate nonce',
      message: error.message 
    });
  }
});

/**
 * POST /api/auth/verify
 * Verify SIWE message và issue JWT token
 * 
 * Body: {
 *   message: string,  // SIWE message
 *   signature: string // Signature từ wallet
 * }
 */
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { message, signature } = req.body;
    
    if (!message || !signature) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Both message and signature are required'
      });
    }

    console.log('📝 Verifying SIWE message...');
    console.log('Message:', message);
    console.log('Signature:', signature.substring(0, 20) + '...');

    // Parse SIWE message
    const siweMessage = new SiweMessage(message);
    console.log('Parsed SIWE:', {
      address: siweMessage.address,
      domain: siweMessage.domain,
      nonce: siweMessage.nonce
    });

    // Verify nonce exists và chưa expired
    if (!nonces.has(siweMessage.nonce)) {
      console.log('❌ Invalid or expired nonce:', siweMessage.nonce);
      return res.status(400).json({ 
        error: 'Invalid or expired nonce',
        message: 'Please request a new nonce'
      });
    }

    // Verify signature
    const fields = await siweMessage.verify({ signature });
    console.log('✅ Signature verified!');
    console.log('Verified address:', fields.data.address);

    // Xóa nonce đã sử dụng
    nonces.delete(siweMessage.nonce);

    // Generate JWT token
    const token = jwt.sign(
      {
        address: fields.data.address,
        chainId: fields.data.chainId,
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'tl-auth-server'
      }
    );

    console.log('✅ JWT token generated');

    res.json({
      success: true,
      token,
      address: fields.data.address,
      message: 'Authentication successful'
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    
    // Handle specific errors
    if (error.message.includes('Signature')) {
      return res.status(401).json({ 
        error: 'Invalid signature',
        message: 'Signature verification failed'
      });
    }
    
    res.status(500).json({ 
      error: 'Verification failed',
      message: error.message 
    });
  }
});

/**
 * Middleware: Verify JWT token
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'No token provided'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
}

/**
 * GET /api/auth/me
 * Get current user info (Protected route)
 */
app.get('/api/auth/me', verifyToken, (req, res) => {
  console.log('✅ User authenticated:', req.user.address);
  
  res.json({
    address: req.user.address,
    chainId: req.user.chainId,
    iat: req.user.iat,
    exp: req.user.exp
  });
});

/**
 * POST /api/auth/logout
 * Logout (client should delete token)
 */
app.post('/api/auth/logout', verifyToken, (req, res) => {
  console.log('👋 User logged out:', req.user.address);
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/profile
 * Example protected route
 */
app.get('/api/profile', verifyToken, (req, res) => {
  // Trong thực tế, query database để lấy profile
  res.json({
    address: req.user.address,
    chainId: req.user.chainId,
    // Mock data
    username: `User ${req.user.address.substring(0, 6)}`,
    joinedAt: new Date(req.user.iat * 1000).toISOString(),
    level: 5,
    points: 1250
  });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Server started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.substring(0, 10)}...`);
  console.log('\n📋 Available endpoints:');
  console.log('   GET  /health');
  console.log('   GET  /api/auth/nonce');
  console.log('   POST /api/auth/verify');
  console.log('   GET  /api/auth/me (protected)');
  console.log('   POST /api/auth/logout (protected)');
  console.log('   GET  /api/profile (protected)');
  console.log('\n✅ Server ready!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

