import nodemailer from 'nodemailer';

let transporter = null;
let fallbackTransporter = null;

// Initialize fallback transporter (using Resend API)
async function initFallbackTransporter() {
  try {
    // Use Resend API for reliable email delivery
    const { Resend } = await import('resend');
    
    if (!process.env.RESEND_API_KEY) {
      console.log('[Email Service] RESEND_API_KEY not found, using fallback');
      fallbackTransporter = {
        sendMail: async (mailOptions) => {
          console.log('[Email Service] Fallback: Would send email via HTTP API');
          console.log('[Email Service] Fallback details:', {
            to: mailOptions.to,
            subject: mailOptions.subject,
            hasHtml: !!mailOptions.html
          });
          
          return {
            messageId: 'fallback-' + Date.now(),
            response: 'Email logged (no API available)'
          };
        }
      };
    } else {
      console.log('[Email Service] Initializing Resend API');
      fallbackTransporter = new Resend(process.env.RESEND_API_KEY);
    }
    console.log('[Email Service] Fallback transporter initialized (Resend API mode)');
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

    // Try SendGrid first (better for cloud platforms)
    if (process.env.SMTP_HOST === 'smtp.sendgrid.net') {
      transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER, // 'apikey'
          pass: process.env.SMTP_PASSWORD, // SendGrid API key
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 20000,
        greetingTimeout: 10000,
        socketTimeout: 20000,
        pool: true,
        maxConnections: 1,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      });
    } else {
      // Try Gmail with fallback
      let transporterConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '465'),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 15000,
        greetingTimeout: 8000,
        socketTimeout: 15000,
        pool: true,
        maxConnections: 1,
        maxMessages: 100,
        rateDelta: 1000,
        rateLimit: 5
      };

      try {
        transporter = nodemailer.createTransport(transporterConfig);
        await transporter.verify();
        console.log('[Email Service] SMTP connection verified successfully (port 465)');
      } catch (port465Error) {
        console.log('[Email Service] Port 465 failed, trying port 587...', port465Error.message);
        
        transporterConfig.port = 587;
        transporterConfig.secure = false;
        
        transporter = nodemailer.createTransport(transporterConfig);
        await transporter.verify();
        console.log('[Email Service] SMTP connection verified successfully (port 587)');
      }
    }
    
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

export async function testEmailService() {
  try {
    if (!transporter) {
      await initEmailService();
    }
    
    const testMailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to self for testing
      subject: 'Life Vault - Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #333;">Email Service Test</h2>
          <p>This is a test email from Life Vault to verify the email service is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    };
    
    const result = await transporter.sendMail(testMailOptions);
    console.log('[Email Service] Test email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email Service] Test email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendScheduledSlotNotification(recipientEmail, slotName, accessLink) {
  try {
    console.log('[Email Service] sendScheduledSlotNotification called with:', {
      recipientEmail,
      slotName,
      accessLink,
      transporterExists: !!transporter,
      fallbackExists: !!fallbackTransporter,
      smtpConfig: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        hasPassword: !!process.env.SMTP_PASSWORD
      }
    });

    // EMAIL VALIDATION ADDED HERE
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
      console.log('[Email Service] Invalid recipient email:', recipientEmail);
      return;
    }

    if (!transporter) {
      await initEmailService();
    }

    console.log('[Email Service] Using transporter:', transporter ? 'SMTP' : 'Fallback');

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

    console.log('[Email Service] Attempting to send email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html
    });

    const result = await transporter.sendMail(mailOptions);
    console.log('[Email Service] SUCCESS: Notification sent to', recipientEmail, 'Result:', result);
    return result;

  } catch (error) {
    console.error('[Email Service] FAILED: Failed to send notification:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      recipientEmail,
      slotName
    });
    
    // Try fallback transporter if primary fails
    if (fallbackTransporter && !error.message.includes('fallback')) {
      console.log('[Email Service] Trying fallback transporter...');
      try {
        // Use Resend API format
        const resendData = {
          from: process.env.SMTP_USER,
          to: mailOptions.to,
          subject: mailOptions.subject,
          html: mailOptions.html,
        };
        
        const fallbackResult = await fallbackTransporter.emails.send(resendData);
        console.log('[Email Service] FALLBACK SUCCESS: Notification sent via Resend to', mailOptions.to, 'Result:', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] FALLBACK FAILED:', fallbackError);
        throw fallbackError;
      }
    } else {
      throw error;
    }
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