import express from 'express';

const router = express.Router();

// Health check endpoint for Render
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'life-vault-api',
    version: '1.0.0'
  });
});

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Simple API routes working',
    timestamp: new Date().toISOString()
  });
});

// Simple forgot password endpoint (without email for now)
router.post('/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    console.log('[Simple API] Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Just return success for now (without email)
    res.json({ success: true, message: 'OTP would be sent to email (testing mode)' });
  } catch (error) {
    console.error('[Simple API] Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
