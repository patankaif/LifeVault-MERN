import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db-mongo.js';
import { sendInactivityConfirmationEmail, sendDeathVaultNotification } from './email-service.js';

const INACTIVITY_THRESHOLD_MS = 9 * 30 * 24 * 60 * 60 * 1000; // 9 months
const CONFIRMATION_VALIDITY_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

export async function checkInactivity() {
  try {
    const db = await getDB();
    const now = new Date();
    const inactivityThreshold = new Date(now.getTime() - INACTIVITY_THRESHOLD_MS);

    // Find users who haven't logged in for 9 months
    const inactiveUsers = await db.collection('users')
      .find({
        lastLogin: { $lt: inactivityThreshold },
        deathVaultTriggered: false,
      })
      .toArray();

    console.log(`[Inactivity] Found ${inactiveUsers.length} inactive users`);

    for (const user of inactiveUsers) {
      // Check if we already sent a confirmation email
      const existingLog = await db.collection('inactivityLogs').findOne({
        userId: user._id,
        confirmationSent: true,
        confirmationExpiresAt: { $gt: now },
      });

      if (existingLog) {
        console.log(`[Inactivity] Confirmation already sent to ${user.email}`);
        continue;
      }

      // Create inactivity log
      const confirmationToken = uuidv4();
      const confirmationExpiresAt = new Date(now.getTime() + CONFIRMATION_VALIDITY_MS);

      const inactivityLog = {
        _id: uuidv4(),
        userId: user._id,
        email: user.email,
        confirmationToken,
        confirmationSent: true,
        confirmationExpiresAt,
        confirmed: false,
        createdAt: now,
      };

      await db.collection('inactivityLogs').insertOne(inactivityLog);

      // Create confirmation link
      const confirmationLink = `${process.env.FRONTEND_URL}/confirm-alive/${confirmationToken}`;

      // Send confirmation email
      await sendInactivityConfirmationEmail(user.email, confirmationLink);

      console.log(`[Inactivity] Confirmation email sent to ${user.email}`);
    }
  } catch (error) {
    console.error('[Inactivity] Failed to check inactivity:', error);
  }
}

export async function confirmUserAlive(confirmationToken) {
  try {
    const db = await getDB();
    const now = new Date();

    const inactivityLog = await db.collection('inactivityLogs').findOne({
      confirmationToken,
      confirmationExpiresAt: { $gt: now },
      confirmed: false,
    });

    if (!inactivityLog) {
      return { success: false, message: 'Invalid or expired confirmation token' };
    }

    // Mark as confirmed
    await db.collection('inactivityLogs').updateOne(
      { _id: inactivityLog._id },
      { $set: { confirmed: true, confirmedAt: now } }
    );

    // Update user's lastLogin to reset the inactivity timer
    await db.collection('users').updateOne(
      { _id: inactivityLog.userId },
      { $set: { lastLogin: now } }
    );

    return { success: true, message: 'Confirmation successful. Your Death Vault timer has been reset.' };
  } catch (error) {
    console.error('[Inactivity] Failed to confirm user alive:', error);
    throw error;
  }
}

export async function triggerDeathVault() {
  try {
    const db = await getDB();
    const now = new Date();

    // Find users with expired confirmation windows
    const expiredLogs = await db.collection('inactivityLogs')
      .find({
        confirmationSent: true,
        confirmed: false,
        confirmationExpiresAt: { $lt: now },
      })
      .toArray();

    console.log(`[DeathVault] Found ${expiredLogs.length} users with expired confirmations`);

    for (const log of expiredLogs) {
      const user = await db.collection('users').findOne({ _id: log.userId });

      if (user.deathVaultTriggered) {
        console.log(`[DeathVault] Already triggered for ${user.email}`);
        continue;
      }

      // Get Death Vault
      const deathVault = await db.collection('vaults').findOne({
        userId: user._id,
        type: 'death',
      });

      // Get all slots in Death Vault
      const deathSlots = await db.collection('slots').find({
        vaultId: deathVault._id
      }).toArray();

      // Send Death Vault notifications for all slots
      for (const slot of deathSlots) {
        const scheduledEmails = slot.scheduledEmails || [];
        for (const emailId of scheduledEmails) {
          const scheduling = await db.collection('scheduling').findOne({ _id: emailId });
          if (scheduling) {
            const accessLink = `${process.env.FRONTEND_URL}/death-vault/${scheduling.accessToken}`;
            try {
              await sendDeathVaultNotification(scheduling.recipientEmail, user.name, accessLink);
              
              // Mark as sent in scheduling collection
              await db.collection('scheduling').updateOne(
                { _id: scheduling._id },
                { $set: { sent: true, sentAt: new Date() } }
              );

              // Update slot delivery status
              await db.collection('slots').updateOne(
                { _id: slot._id },
                { $set: { delivered: true, deliveredAt: new Date() } }
              );
            } catch (emailError) {
              console.error(`[DeathVault] Failed to send email for scheduling ${scheduling._id}:`, emailError);
            }
          }
        }
      }

      // Mark Death Vault as triggered
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { deathVaultTriggered: true } }
      );

      console.log(`[DeathVault] Triggered for ${user.email}`);
    }
  } catch (error) {
    console.error('[DeathVault] Failed to trigger Death Vault:', error);
  }
}

export async function getInactivityStatus(userId) {
  try {
    const db = await getDB();

    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      return null;
    }

    const now = new Date();
    const inactivityThreshold = new Date(now.getTime() - INACTIVITY_THRESHOLD_MS);
    const isInactive = user.lastLogin < inactivityThreshold;

    let confirmationStatus = null;
    if (isInactive) {
      const inactivityLog = await db.collection('inactivityLogs')
        .findOne({
          userId,
          confirmationSent: true,
        })
        .sort({ createdAt: -1 });

      if (inactivityLog) {
        confirmationStatus = {
          sent: true,
          confirmed: inactivityLog.confirmed,
          expiresAt: inactivityLog.confirmationExpiresAt,
          daysRemaining: Math.ceil((inactivityLog.confirmationExpiresAt - now) / (24 * 60 * 60 * 1000)),
        };
      }
    }

    return {
      isInactive,
      lastLogin: user.lastLogin,
      deathVaultTriggered: user.deathVaultTriggered,
      confirmationStatus,
    };
  } catch (error) {
    console.error('[Inactivity] Failed to get inactivity status:', error);
    throw error;
  }
}

export default {
  checkInactivity,
  confirmUserAlive,
  triggerDeathVault,
  getInactivityStatus,
};
