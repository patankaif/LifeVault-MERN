import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db-mongo.js';
import { sendOTP, sendWelcomeEmail } from './email-service.js';

const OTP_EXPIRY_TIME = 10 * 60 * 1000; // 10 minutes
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPToEmail(email, purpose = 'signup') {
  try {
    const db = await getDB();
    const otp = await generateOTP();
    
    // Store OTP in database with expiry and purpose
    await db.collection('otps').insertOne({
      email,
      otp,
      purpose,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_TIME),
    });
    
    // Send OTP via email with appropriate message
    if (purpose === 'delete-account') {
      await sendOTP(email, otp, 'delete-account');
    } else {
      await sendOTP(email, otp);
    }
    
    return { success: true, message: 'OTP sent to email' };
  } catch (error) {
    console.error('[Auth] Failed to send OTP:', error);
    throw error;
  }
}

export async function verifyOTP(email, otp, purpose = 'signup') {
  try {
    const db = await getDB();
    
    const otpRecord = await db.collection('otps').findOne({
      email,
      otp,
      purpose,
      expiresAt: { $gt: new Date() },
    });
    if (!otpRecord) {
      return { success: false, message: 'Invalid or expired OTP' };
    }
    // Delete OTP after verification
    await db.collection('otps').deleteOne({ _id: otpRecord._id });
    
    return { success: true, message: 'OTP verified' };
  } catch (error) {
    console.error('[Auth] Failed to verify OTP:', error);
    throw error;
  }
}

export async function registerUser(email, password, name) {
  try {
    const db = await getDB();
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return { success: false, message: 'User already exists' };
    }
    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);
    // Create user
    const userId = uuidv4();
    const user = {
      _id: userId,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: new Date(),
      inactivityWarningsSent: 0,
      deathVaultTriggered: false,
    };
    await db.collection('users').insertOne(user);
    // Create vaults for user
    const presentVault = {
      _id: uuidv4(),
      userId,
      type: 'present',
      createdAt: new Date(),
    };
    const futureVault = {
      _id: uuidv4(),
      userId,
      type: 'future',
      createdAt: new Date(),
    };
    const deathVault = {
      _id: uuidv4(),
      userId,
      type: 'death',
      createdAt: new Date(),
    };
    await db.collection('vaults').insertMany([presentVault, futureVault, deathVault]);
    // Death Vault slots are now added by the user manually
    // const momSlot = { ... };
    // const dadSlot = { ... };
    // await db.collection('slots').insertMany([momSlot, dadSlot]);
    
    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
    } catch (emailError) {
      console.error('[Auth] Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return {
      success: true,
      message: 'User registered successfully',
      user: {
        _id: userId,
        email,
        name,
      },
    };
  } catch (error) {
    console.error('[Auth] Registration failed:', error);
    throw error;
  }
}

export async function loginUser(email, password) {
  try {
    const db = await getDB();
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }
    // Update last login
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
    };
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    throw error;
  }
}

export async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, user: decoded };
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message);
    return { success: false, message: 'Invalid or expired token' };
  }
}

export async function resetPassword(email, newPassword) {
  try {
    const db = await getDB();

    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    const result = await db.collection('users').updateOne(
      { email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, message: 'Password reset successfully' };
  } catch (error) {
    console.error('[Auth] Password reset failed:', error);
    throw error;
  }
}

export async function getUserById(userId) {
  try {
    const db = await getDB();
    const user = await db.collection('users').findOne({ _id: userId });
    
    if (!user) {
      return null;
    }

    // Remove password from response
    delete user.password;
    return user;
  } catch (error) {
    console.error('[Auth] Failed to get user:', error);
    throw error;
  }
}

export async function deleteUserAccount(userId, email, otp) {
  try {
    const db = await getDB();
    
    // Verify OTP
    const otpRecord = await db.collection('otps').findOne({
      email,
      otp,
      expiresAt: { $gt: new Date() },
    });
    
    if (!otpRecord) {
      return { success: false, message: 'Invalid or expired OTP' };
    }
    
    // Delete OTP after verification
    await db.collection('otps').deleteOne({ _id: otpRecord._id });
    
    // Get all vaults for the user
    const vaults = await db.collection('vaults').find({ userId }).toArray();
    const vaultIds = vaults.map(v => v._id);
    
    // Delete all slots in the vaults
    if (vaultIds.length > 0) {
      await db.collection('slots').deleteMany({ vaultId: { $in: vaultIds } });
    }
    
    // Delete all scheduling records for the user's slots
    const userSlots = await db.collection('slots').find({ userId }).toArray();
    const slotIds = userSlots.map(s => s._id);
    if (slotIds.length > 0) {
      await db.collection('scheduling').deleteMany({ slotId: { $in: slotIds } });
    }
    
    // Delete vaults
    await db.collection('vaults').deleteMany({ userId });
    
    // Delete inactivity logs
    await db.collection('inactivityLogs').deleteMany({ userId });
    
    // Delete the user
    await db.collection('users').deleteOne({ _id: userId });
    
    return { success: true, message: 'Account deleted successfully' };
  } catch (error) {
    console.error('[Auth] Failed to delete user account:', error);
    throw error;
  }
}

export default {
  generateOTP,
  sendOTPToEmail,
  verifyOTP,
  registerUser,
  loginUser,
  verifyToken,
  resetPassword,
  getUserById,
  deleteUserAccount,
};
