import { Resend } from 'resend';
import nodemailer from 'nodemailer';

let transporter = null;
let resendClient = null;

// Initialize Resend client as primary email service
async function initResendClient() {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not found in environment variables');
    }
    
    console.log('[Email Service] Initializing Resend API as primary service');
    resendClient = new Resend(process.env.RESEND_API_KEY);
    console.log('[Email Service] Resend client initialized successfully');
    return true;
  } catch (error) {
    console.error('[Email Service] Resend initialization failed:', error.message);
    throw error;
  }
}

export async function initEmailService() {
  try {
    console.log('[Email Service] Initializing with Resend API');
    
    // Initialize Resend as primary service
    await initResendClient();
    
    // Initialize SMTP as fallback
    await initSMTPFallback();
    
    return true;
  } catch (error) {
    console.error('[Email Service] Email service initialization failed:', error.message);
    throw error;
  }
}

// Initialize SMTP as fallback service
async function initSMTPFallback() {
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      console.log('[Email Service] Initializing SMTP as fallback service');
      
      let transporterConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
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

      transporter = nodemailer.createTransport(transporterConfig);
      await transporter.verify();
      console.log('[Email Service] SMTP fallback initialized successfully');
    } else {
      console.log('[Email Service] SMTP configuration not found, skipping fallback');
    }
  } catch (error) {
    console.warn('[Email Service] SMTP fallback initialization failed:', error.message);
  }
}

export async function sendOTP(email, otp, purpose = 'signup') {
  try {
    if (!resendClient) {
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

    const emailData = {
      from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
      to: email,
      subject,
      html: htmlContent,
    };

    const result = await resendClient.emails.send(emailData);
    console.log(`[Email Service] ${purpose} OTP sent to`, email, 'via Resend');
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send OTP via Resend:', error);
    
    // Try SMTP fallback if available
    if (transporter) {
      console.log('[Email Service] Trying SMTP fallback for OTP...');
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: email,
          subject: purpose === 'delete-account' ? 'Life Vault - Account Deletion OTP' : 'Life Vault - Your OTP Verification Code',
          html: htmlContent,
        };
        const fallbackResult = await transporter.sendMail(mailOptions);
        console.log(`[Email Service] ${purpose} OTP sent via SMTP fallback`);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback also failed:', fallbackError);
      }
    }
    
    throw error;
  }
}

export async function testEmailService() {
  try {
    if (!resendClient) {
      await initEmailService();
    }
    
    const testEmailData = {
      from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
      to: 'lifevault09@gmail.com', // Test email
      subject: 'Life Vault - Email Service Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; padding: 20px;">
          <h2 style="color: #333;">Email Service Test</h2>
          <p>This is a test email from Life Vault to verify the Resend email service is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
          <p><strong>Service:</strong> Resend API</p>
        </div>
      `,
    };
    
    const result = await resendClient.emails.send(testEmailData);
    console.log('[Email Service] Test email sent successfully via Resend:', result);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('[Email Service] Test email failed:', error);
    
    // Try SMTP fallback
    if (transporter) {
      console.log('[Email Service] Trying SMTP fallback for test...');
      try {
        const testMailOptions = {
          from: process.env.SMTP_USER,
          to: process.env.SMTP_USER,
          subject: 'Life Vault - Email Service Test (SMTP Fallback)',
          html: `<p>Test email via SMTP fallback at ${new Date().toISOString()}</p>`,
        };
        const fallbackResult = await transporter.sendMail(testMailOptions);
        return { success: true, messageId: fallbackResult.messageId, service: 'SMTP fallback' };
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback test also failed:', fallbackError);
      }
    }
    
    return { success: false, error: error.message };
  }
}

export async function sendScheduledSlotNotification(recipientEmail, slotName, accessLink) {
  console.log('[Email Service] sendScheduledSlotNotification called with:', {
    recipientEmail,
    slotName,
    accessLink,
    resendClientExists: !!resendClient,
    smtpFallbackExists: !!transporter
  });

  // EMAIL VALIDATION ADDED HERE
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!recipientEmail || !emailRegex.test(recipientEmail)) {
    console.log('[Email Service] Invalid recipient email:', recipientEmail);
    return;
  }

  if (!resendClient) {
    await initEmailService();
  }

  console.log('[Email Service] Using service:', resendClient ? 'Resend' : 'SMTP Fallback');

  // Convert shared-vault link to schedule-slot link
  const scheduleLink = accessLink.replace('/shared-vault/', '/schedule-slot/');

  // Define email data for Resend
  const emailData = {
    from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
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

  console.log('[Email Service] Attempting to send email with data:', {
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    hasHtml: !!emailData.html
  });

  try {
    const result = await resendClient.emails.send(emailData);
    console.log('[Email Service] SUCCESS: Notification sent to', recipientEmail, 'via Resend. Result:', result);
    return result;
  } catch (error) {
    console.error('[Email Service] FAILED: Failed to send notification via Resend:', {
      error: error.message,
      code: error.code,
      stack: error.stack,
      recipientEmail,
      slotName
    });
    
    // Try SMTP fallback if available
    if (transporter) {
      console.log('[Email Service] Trying SMTP fallback for notification...');
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: recipientEmail,
          subject: emailData.subject,
          html: emailData.html,
        };
        const fallbackResult = await transporter.sendMail(mailOptions);
        console.log('[Email Service] FALLBACK SUCCESS: Notification sent via SMTP to', recipientEmail, 'Result:', fallbackResult);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback also failed:', fallbackError);
      }
    }
    
    throw error;
  }
}

export async function sendInactivityConfirmationEmail(email, confirmationLink) {
  try {
    if (!resendClient) {
      await initEmailService();
    }

    const emailData = {
      from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
      to: email,
      subject: 'Life Vault - Are You Still With Us?',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Life Vault - Are You Still With Us?</h2>
          <p>We haven't seen you in a while. Click the link below to confirm you're still active:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Confirm I'm Active</a>
          </div>
          <p style="color: #666; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    const result = await resendClient.emails.send(emailData);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send inactivity confirmation:', error);
    
    // Try SMTP fallback
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Life Vault - Are You Still With Us?',
          html: `<a href="${confirmationLink}">Confirm I'm Active</a>`,
        };
        const fallbackResult = await transporter.sendMail(mailOptions);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback failed:', fallbackError);
      }
    }
    
    throw error;
  }
}

export async function sendDeathVaultNotification(recipientEmail, senderName, accessLink) {
  try {
    if (!resendClient) {
      await initEmailService();
    }

    const emailData = {
      from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
      to: recipientEmail,
      subject: `Life Vault - Important Message from ${senderName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Important Message from ${senderName}</h2>
          <p>You have received an important message through Life Vault.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${accessLink}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Message</a>
          </div>
          <p style="color: #666; font-size: 12px;">This is an important message that requires your attention.</p>
        </div>
      `,
    };

    const result = await resendClient.emails.send(emailData);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send death vault notification:', error);
    
    // Try SMTP fallback
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: recipientEmail,
          subject: `Life Vault - Important Message from ${senderName}`,
          html: `<a href="${accessLink}">View Message</a>`,
        };
        const fallbackResult = await transporter.sendMail(mailOptions);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback failed:', fallbackError);
      }
    }
    
    throw error;
  }
}

export async function sendWelcomeEmail(email, name) {
  try {
    if (!resendClient) {
      await initEmailService();
    }

    const emailData = {
      from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
      to: email,
      subject: 'Welcome to Life Vault!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Life Vault, ${name}!</h2>
          <p>Thank you for joining Life Vault. We're excited to help you preserve your memories and share them with loved ones.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #007bff;">Getting Started:</h3>
            <ul>
              <li>Create your first memory vault</li>
              <li>Add precious memories and photos</li>
              <li>Share vaults with trusted contacts</li>
              <li>Set up scheduled deliveries</li>
            </ul>
          </div>
          <p>If you have any questions, don't hesitate to reach out to our support team.</p>
          <p style="color: #666;">Best regards,<br/>The Life Vault Team</p>
        </div>
      `,
    };

    const result = await resendClient.emails.send(emailData);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send welcome email:', error);
    
    // Try SMTP fallback
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: email,
          subject: 'Welcome to Life Vault!',
          html: `<h2>Welcome ${name}</h2>`,
        };
        const fallbackResult = await transporter.sendMail(mailOptions);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback failed:', fallbackError);
      }
    }
    
    throw error;
  }
}

export async function sendSlotDeliveryConfirmation(email, slotName, recipientEmail) {
  try {
    if (!resendClient) {
      await initEmailService();
    }

    const emailData = {
      from: 'Life Vault <noreply@life-vault-frontend-p200.onrender.com>',
      to: email,
      subject: `Slot Delivered: ${slotName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Memory Slot Successfully Delivered</h2>
          <p>Your memory slot "<strong>${slotName}</strong>" has been successfully delivered to <strong>${recipientEmail}</strong>.</p>
          <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #155724;">Delivery Details:</h3>
            <p><strong>Slot Name:</strong> ${slotName}</p>
            <p><strong>Recipient:</strong> ${recipientEmail}</p>
            <p><strong>Delivery Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>You can view the delivery status in your Life Vault dashboard.</p>
          <p style="color: #666;">Best regards,<br/>The Life Vault Team</p>
        </div>
      `,
    };

    const result = await resendClient.emails.send(emailData);
    return result;
  } catch (error) {
    console.error('[Email Service] Failed to send slot delivery confirmation:', error);
    
    // Try SMTP fallback
    if (transporter) {
      try {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: email,
          subject: `Slot Delivered: ${slotName}`,
          html: `<p>Delivered to ${recipientEmail}</p>`,
        };
        const fallbackResult = await transporter.sendMail(mailOptions);
        return fallbackResult;
      } catch (fallbackError) {
        console.error('[Email Service] SMTP fallback failed:', fallbackError);
      }
    }
    
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