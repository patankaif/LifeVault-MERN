import express from 'express';
import { storagePut, storageGet } from './storage.ts';
import * as authUtils from './auth-utils.js';
import * as vaultUtils from './vault-utils.js';
import * as inactivityUtils from './inactivity-utils.js';
import { connectDB, getDB } from './db-mongo.js';

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authUtils.verifyToken(token);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    req.user = result.user;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during authentication' });
  }
};

// ==================== AUTHENTICATION ROUTES ====================

// Send OTP for signup
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authUtils.sendOTPToEmail(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await authUtils.verifyOTP(email, otp);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Register user
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: 'Email, password, and name are required' });
    }

    const result = await authUtils.registerUser(email, password, name);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login user
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const result = await authUtils.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send password reset OTP
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await authUtils.sendOTPToEmail(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset password with OTP
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email and new password are required' });
    }

    // Reset password (OTP was already verified in previous step)
    const result = await authUtils.resetPassword(email, newPassword);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send OTP for account deletion
router.post('/auth/send-delete-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Check if user exists
    const db = await getDB();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await authUtils.sendOTPToEmail(email, 'delete-account');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP for account deletion
router.post('/auth/verify-delete-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const result = await authUtils.verifyOTP(email, otp, 'delete-account');
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete account permanently
router.post('/auth/delete-account', async (req, res) => {
  try {
    console.log('[Delete Account] Request body:', req.body);
    console.log('[Delete Account] Headers:', req.headers);
    
    const { email, otp } = req.body;
    if (!email || !otp) {
      console.log('[Delete Account] Missing email or OTP:', { email, otp });
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    console.log('[Delete Account] Verifying OTP for:', email);
    // Verify OTP first
    const otpResult = await authUtils.verifyOTP(email, otp, 'delete-account');
    console.log('[Delete Account] OTP result:', otpResult);
    if (!otpResult.success) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const db = await getDB();
    
    // Find user
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete user's slots and media
    const slots = await db.collection('slots').find({ userId: user._id }).toArray();
    
    for (const slot of slots) {
      // Delete media files from filesystem
      if (slot.media && slot.media.length > 0) {
        for (const media of slot.media) {
          try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const filePath = path.join(process.cwd(), media.url.replace('/uploads/', 'uploads/'));
            await fs.unlink(filePath);
          } catch (err) {
            console.error('Failed to delete media file:', media.url, err);
          }
        }
      }
    }

    // Delete user's slots from database
    await db.collection('slots').deleteMany({ userId: user._id });
    
    // Delete user's scheduling records
    await db.collection('scheduling').deleteMany({ 
      slotId: { $in: slots.map(s => s._id) } 
    });
    
    // Delete user's inactivity records
    await db.collection('inactivity').deleteMany({ userId: user._id });
    
    // Delete user account
    await db.collection('users').deleteOne({ _id: user._id });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user
router.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await authUtils.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== VAULT ROUTES ====================

// Get vault
router.get('/vaults/:type', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    const vault = await vaultUtils.getVault(req.user.userId, type);
    if (!vault) {
      return res.status(404).json({ success: false, message: 'Vault not found' });
    }
    res.json({ success: true, vault });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get slots in vault
router.get('/vaults/:type/slots', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    const vault = await vaultUtils.getVault(req.user.userId, type);
    if (!vault) {
      return res.status(404).json({ success: false, message: 'Vault not found' });
    }

    const slots = await vaultUtils.getSlots(vault._id);
    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get nested slots
router.get('/slots/:slotId/children', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const slots = await vaultUtils.getSlots(null, slotId);
    res.json({ success: true, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create slot
router.post('/vaults/:type/slots', verifyToken, async (req, res) => {
  try {
    const { type } = req.params;
    const { slotName, parentSlotId, recipientEmail } = req.body;

    if (!slotName) {
      return res.status(400).json({ success: false, message: 'Slot name is required' });
    }

    // Death Vault can now have user-added slots
    // if (type === 'death') {
    //   return res.status(400).json({ success: false, message: 'Cannot create slots in Death Vault' });
    // }

    const vault = await vaultUtils.getVault(req.user.userId, type);
    if (!vault) {
      return res.status(404).json({ success: false, message: 'Vault not found' });
    }

    const result = await vaultUtils.createSlot(req.user.userId, vault._id, slotName, parentSlotId || null, recipientEmail || null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Death Vault rules acceptance status
router.get('/vaults/death/rules-status', verifyToken, async (req, res) => {
  try {
    const db = await getDB();
    const user = await db.collection('users').findOne({ 
      email: req.user.email 
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has accepted Death Vault rules
    const rulesAccepted = user.deathVaultRulesAccepted || false;
    
    res.json({ success: true, rulesAccepted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Accept Death Vault rules
router.post('/vaults/death/accept-rules', verifyToken, async (req, res) => {
  try {
    const db = await getDB();
    const user = await db.collection('users').findOne({ 
      email: req.user.email 
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Mark rules as accepted
    await db.collection('users').updateOne(
      { email: req.user.email },
      { 
        $set: { 
          deathVaultRulesAccepted: true,
          deathVaultRulesAcceptedAt: new Date()
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Death Vault rules accepted successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete slot
router.delete('/slots/:slotId', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { vaultType } = req.body;

    const result = await vaultUtils.deleteSlot(slotId, vaultType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update slot name
router.put('/slots/:slotId', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { slotName } = req.body;

    if (!slotName) {
      return res.status(400).json({ success: false, message: 'Slot name is required' });
    }

    const result = await vaultUtils.updateSlotName(slotId, slotName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== MEDIA ROUTES ====================

// Add media to slot
router.post('/slots/:slotId/media', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { file, mediaType } = req.body;

    if (!file || !mediaType) {
      return res.status(400).json({ success: false, message: 'File and media type are required' });
    }

    try {
      // Use the updated storage system
      const fileBuffer = Buffer.from(file, 'base64');
      const fileKey = `${req.user.userId}/slots/${slotId}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const result = await storagePut(fileKey, fileBuffer, mediaType === 'image' ? 'image/jpeg' : 'video/mp4');
      
      // Add to slot
      const vaultResult = await vaultUtils.addMediaToSlot(slotId, result.url, mediaType);
      return res.json(vaultResult);
    } catch (storageError) {
      console.error('Storage upload failed:', storageError);
      // Provide more specific error messages for deployment issues
      let errorMessage = 'Upload failed';
      if (storageError.message.includes('ENOENT')) {
        errorMessage = 'Storage directory not found - please check server configuration';
      } else if (storageError.message.includes('EACCES')) {
        errorMessage = 'Permission denied - unable to save file';
      } else if (storageError.message.includes('ENOSPC')) {
        errorMessage = 'Storage full - unable to upload file';
      } else {
        errorMessage = storageError.message || 'Upload failed';
      }
      return res.status(500).json({ success: false, message: errorMessage });
    }
  } catch (error) {
    console.error('Media upload error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// Delete media from slot
router.delete('/slots/:slotId/media/:mediaId', verifyToken, async (req, res) => {
  try {
    const { slotId, mediaId } = req.params;
    const result = await vaultUtils.deleteMediaFromSlot(slotId, mediaId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== TEXT ROUTES ====================

// Add text to slot
router.post('/slots/:slotId/text', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { textContent } = req.body;

    if (!textContent) {
      return res.status(400).json({ success: false, message: 'Text content is required' });
    }

    const result = await vaultUtils.addTextToSlot(slotId, textContent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete text from slot
router.delete('/slots/:slotId/text/:textId', verifyToken, async (req, res) => {
  try {
    const { slotId, textId } = req.params;
    const result = await vaultUtils.deleteTextFromSlot(slotId, textId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update text in slot
router.put('/slots/:slotId/text/:textId', verifyToken, async (req, res) => {
  try {
    const { slotId, textId } = req.params;
    const { textContent } = req.body;
    if (!textContent) {
      return res.status(400).json({ success: false, message: 'Text content is required' });
    }
    const result = await vaultUtils.updateTextInSlot(slotId, textId, textContent);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== SCHEDULING ROUTES ====================

// Schedule slot
router.post('/slots/:slotId/schedule', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const { recipientEmail, scheduledDate, vaultType } = req.body;

    if (!recipientEmail || !scheduledDate || !vaultType) {
      return res.status(400).json({ success: false, message: 'Recipient email, scheduled date, and vault type are required' });
    }

    const result = await vaultUtils.scheduleSlot(slotId, recipientEmail, scheduledDate, vaultType);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check delivery status
router.get('/slots/:slotId/delivery-status', verifyToken, async (req, res) => {
  try {
    const { slotId } = req.params;
    const result = await vaultUtils.getDeliveryStatus(slotId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get next scheduled slot
router.get('/next-scheduled', verifyToken, async (req, res) => {
  try {
    const scheduling = await vaultUtils.getNextScheduledSlot(req.user.userId);
    res.json({ success: true, scheduling });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get shared slot
router.get('/shared-vault/:accessToken', async (req, res) => {
  try {
    const { accessToken } = req.params;
    const result = await vaultUtils.getSharedSlot(accessToken);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Shared slot not found or link expired' });
    }
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[API] Shared vault error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== INACTIVITY ROUTES ====================

// Confirm user is alive
router.post('/confirm-alive/:confirmationToken', async (req, res) => {
  try {
    const { confirmationToken } = req.params;
    const result = await inactivityUtils.confirmUserAlive(confirmationToken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get inactivity status
router.get('/inactivity-status', verifyToken, async (req, res) => {
  try {
    const status = await inactivityUtils.getInactivityStatus(req.user.userId);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user account with OTP verification
router.post('/auth/delete-account', verifyToken, async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required' });
    }

    const result = await authUtils.deleteUserAccount(req.user.userId, req.user.email, otp);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test email service endpoint
router.post('/test-email', async (req, res) => {
  try {
    const emailService = await import('./email-service.js');
    const result = await emailService.testEmailService();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
