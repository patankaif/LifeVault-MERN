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

// Simple forgot password endpoint (mock OTP)
router.post('/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    console.log('[Simple API] Forgot password request for:', email);
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Generate a mock OTP for testing
    const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[Simple API] Mock OTP for', email, ':', mockOTP);
    
    res.json({ 
      success: true, 
      message: 'OTP sent to email (testing mode - check console)',
      mockOTP: mockOTP, // Include for testing
      email: email
    });
  } catch (error) {
    console.error('[Simple API] Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simple verify OTP endpoint (mock verification)
router.post('/auth/verify-otp', (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log('[Simple API] Verify OTP for:', email, 'OTP:', otp);
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // Mock verification - accept any 6-digit OTP
    if (otp.length === 6 && /^\d+$/.test(otp)) {
      res.json({ 
        success: true, 
        message: 'OTP verified successfully (testing mode)',
        email: email
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP format' });
    }
  } catch (error) {
    console.error('[Simple API] Verify OTP error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Simple reset password endpoint
router.post('/auth/reset-password', (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log('[Simple API] Reset password for:', email);
    
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Mock password reset
    res.json({ 
      success: true, 
      message: 'Password reset successfully (testing mode)',
      email: email
    });
  } catch (error) {
    console.error('[Simple API] Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
