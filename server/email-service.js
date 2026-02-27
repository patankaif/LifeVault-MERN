import nodemailer from 'nodemailer';

let transporter = null;
let fallbackTransporter = null;

// Initialize fallback transporter (using Ethereal or other service)
async function initFallbackTransporter() {
  try {
    // Using Ethereal for testing (replace with production service)
    fallbackTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    });
    console.log('[Email Service] Fallback transporter initialized');
  } catch (error) {
    console.warn('[Email Service] Fallback transporter failed:', error.message);
  }
}

export async function initEmailService() {
  try {
    console.log('[Email Service] Initializing with config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPassword: !!process.env.SMTP_PASSWORD
    });

    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    console.log('[Email Service] SMTP connection verified successfully');
    
    // Initialize fallback
    await initFallbackTransporter();
    
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP connection failed:', {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Initialize fallback as backup
    await initFallbackTransporter();
    throw error;
  }
}

export async function sendOTP(email, otp, purpose = 'signup') {
  try {
    if (!transporter) {
      await initEmailService();
    }

    let subject, htmlContent;

    if (purpose === 'delete-account') {
      subject = 'Life Vault - Account Deletion OTP';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Life Vault - Account Deletion Request</h2>
          <p>You requested to permanently delete your Life Vault account.</p>
          <p style="color: #dc2626; font-weight: bold;">⚠️ This action is permanent and cannot be undone.</p>
          <p>Your One-Time Password (OTP) for account deletion is:</p>
          <div style="background-color: #fef2f2; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0; border: 2px solid #dc2626;">
            <h1 style="color: #dc2626; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666;">This OTP is valid for 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this deletion, please secure your account immediately.</p>
        </div>
      `;
    } else {
      subject = 'Life Vault - Your OTP Verification Code';
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Life Vault OTP Verification</h2>
          <p>Your One-Time Password (OTP) for Life Vault is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #007bff; letter-spacing: 5px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666;">This OTP is valid for 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] ${purpose} OTP sent to`, email);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send OTP:', error);
    throw error;
  }
}

export async function sendScheduledSlotNotification(recipientEmail, slotName, accessLink) {
  try {

    // ✅ EMAIL VALIDATION ADDED HERE
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      console.log('[Email Service] Invalid recipient email:', recipientEmail);
      return;
    }

    if (!transporter) {
      await initEmailService();
    }

    console.log('[Email Service] sendScheduledSlotNotification called with:', {
      recipientEmail,
      slotName,
      accessLink
    });

    // Convert shared-vault link to schedule-slot link
    const scheduleLink = accessLink.replace('/shared-vault/', '/schedule-slot/');

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipientEmail,
      subject: `Life Vault - New Memory Shared: ${slotName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #333;">Hello!</h2>
          <p>Someone has shared a special memory slot titled "<strong>${slotName}</strong>" with you on Life Vault.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${scheduleLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Memory Slot</a>
          </div>
          <p style="color: #007bff; word-break: break-all;">${scheduleLink}</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Notification sent to', recipientEmail);
    return result;

  } catch (error) {
    console.error('[Email Service] Failed to send notification:', error);
    throw error;
  }
}

export async function sendInactivityConfirmationEmail(email, confirmationLink) {
  try {
    if (!transporter) {
      await initEmailService();
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Life Vault - Are You Still With Us?',
      html: `<a href="${confirmationLink}">Confirm I'm Active</a>`,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed:', error);
    throw error;
  }
}

export async function sendDeathVaultNotification(recipientEmail, senderName, accessLink) {
  try {
    if (!transporter) {
      await initEmailService();
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: recipientEmail,
      subject: `Life Vault - Important Message from ${senderName}`,
      html: `<a href="${accessLink}">View Message</a>`,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email, name) {
  try {
    if (!transporter) {
      await initEmailService();
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to Life Vault!',
      html: `<h2>Welcome ${name}</h2>`,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed:', error);
    throw error;
  }
}

export async function sendSlotDeliveryConfirmation(email, slotName, recipientEmail) {
  try {
    if (!transporter) {
      await initEmailService();
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: `Slot Delivered: ${slotName}`,
      html: `<p>Delivered to ${recipientEmail}</p>`,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed:', error);
    throw error;
  }
}

export default {
  initEmailService,
  sendOTP,
  sendScheduledSlotNotification,
  sendInactivityConfirmationEmail,
  sendDeathVaultNotification,
  sendWelcomeEmail,
  sendSlotDeliveryConfirmation,
};