import { v4 as uuidv4 } from 'uuid';
import { getDB } from './db-mongo.js';
import { sendScheduledSlotNotification, sendDeathVaultNotification, sendSlotDeliveryConfirmation } from './email-service.js';

const PRESENT_VAULT_LIMIT_DAYS = 30;
const FUTURE_VAULT_LIMIT_DAYS = 270; // 9 months
const SHARE_LINK_VALIDITY_DAYS = 30;

export async function getVault(userId, vaultType) {
  try {
    const db = await getDB();
    const vault = await db.collection('vaults').findOne({
      userId,
      type: vaultType,
    });
    return vault;
  } catch (error) {
    console.error('[Vault] Failed to get vault:', error);
    throw error;
  }
}

export async function createSlot(userId, vaultId, slotName, parentSlotId = null) {
  try {
    const db = await getDB();

    // Check if slot name already exists at this level
    const existingSlot = await db.collection('slots').findOne({
      vaultId,
      parentSlotId,
      name: slotName,
    });

    if (existingSlot) {
      return { success: false, message: 'Slot with this name already exists at this level' };
    }

    const slot = {
      _id: uuidv4(),
      vaultId,
      userId,
      name: slotName,
      parentSlotId,
      media: [],
      texts: [],
      scheduledEmails: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('slots').insertOne(slot);

    return {
      success: true,
      message: 'Slot created successfully',
      slot,
    };
  } catch (error) {
    console.error('[Vault] Failed to create slot:', error);
    throw error;
  }
}

export async function getSlots(vaultId, parentSlotId = null) {
  try {
    const db = await getDB();
    const slots = await db.collection('slots')
      .find({
        vaultId,
        parentSlotId,
      })
      .toArray();
    return slots;
  } catch (error) {
    console.error('[Vault] Failed to get slots:', error);
    throw error;
  }
}

export async function addMediaToSlot(slotId, mediaUrl, mediaType) {
  try {
    const db = await getDB();

    const media = {
      _id: uuidv4(),
      url: mediaUrl,
      type: mediaType, // 'image', 'video'
      uploadedAt: new Date(),
    };

    await db.collection('slots').updateOne(
      { _id: slotId },
      { $push: { media }, $set: { updatedAt: new Date() } }
    );

    return {
      success: true,
      message: 'Media added successfully',
      media,
    };
  } catch (error) {
    console.error('[Vault] Failed to add media:', error);
    throw error;
  }
}

export async function addTextToSlot(slotId, textContent) {
  try {
    const db = await getDB();

    const text = {
      _id: uuidv4(),
      content: textContent,
      createdAt: new Date(),
    };

    await db.collection('slots').updateOne(
      { _id: slotId },
      { $push: { texts: text }, $set: { updatedAt: new Date() } }
    );

    return {
      success: true,
      message: 'Text added successfully',
      text,
    };
  } catch (error) {
    console.error('[Vault] Failed to add text:', error);
    throw error;
  }
}

export async function deleteSlot(slotId, vaultType) {
  try {
    const db = await getDB();

    // Get the slot to check if it has children
    const slot = await db.collection('slots').findOne({ _id: slotId });
    if (!slot) {
      return { success: false, message: 'Slot not found' };
    }

    // For Death Vault, allow deletion of slots
    // if (vaultType === 'death') {
    //   return { success: false, message: 'Cannot delete Death Vault slots' };
    // }

    // Delete all nested slots recursively
    const nestedSlots = await db.collection('slots').find({ parentSlotId: slotId }).toArray();
    for (const nestedSlot of nestedSlots) {
      await deleteSlot(nestedSlot._id, vaultType);
    }

    // Delete the slot
    await db.collection('slots').deleteOne({ _id: slotId });

    return { success: true, message: 'Slot deleted successfully' };
  } catch (error) {
    console.error('[Vault] Failed to delete slot:', error);
    throw error;
  }
}

export async function deleteMediaFromSlot(slotId, mediaId) {
  try {
    const db = await getDB();

    await db.collection('slots').updateOne(
      { _id: slotId },
      { $pull: { media: { _id: mediaId } }, $set: { updatedAt: new Date() } }
    );

    return { success: true, message: 'Media deleted successfully' };
  } catch (error) {
    console.error('[Vault] Failed to delete media:', error);
    throw error;
  }
}

export async function deleteTextFromSlot(slotId, textId) {
  try {
    const db = await getDB();

    await db.collection('slots').updateOne(
      { _id: slotId },
      { $pull: { texts: { _id: textId } }, $set: { updatedAt: new Date() } }
    );

    return { success: true, message: 'Text deleted successfully' };
  } catch (error) {
    console.error('[Vault] Failed to delete text:', error);
    throw error;
  }
}

export async function updateTextInSlot(slotId, textId, newContent) {
  try {
    const db = await getDB();

    await db.collection('slots').updateOne(
      { _id: slotId, 'texts._id': textId },
      { $set: { 'texts.$.content': newContent, updatedAt: new Date() } }
    );

    return { success: true, message: 'Text updated successfully' };
  } catch (error) {
    console.error('[Vault] Failed to update text:', error);
    throw error;
  }
}

export async function scheduleSlot(slotId, recipientEmail, scheduledDate, vaultType) {
  try {
    const db = await getDB();

    // Validate scheduling date based on vault type
    const now = new Date();
    const maxDate = new Date(now.getTime() + (vaultType === 'present' ? PRESENT_VAULT_LIMIT_DAYS : FUTURE_VAULT_LIMIT_DAYS) * 24 * 60 * 60 * 1000);

    if (new Date(scheduledDate) > maxDate) {
      return { success: false, message: `Cannot schedule beyond ${vaultType === 'present' ? '1 month' : '9 months'}` };
    }

    console.log(`[Vault] scheduleSlot called with:`, {
      slotId,
      recipientEmail,
      scheduledDate,
      vaultType
    });

    const scheduling = {
      _id: uuidv4(),
      slotId,
      recipientEmail,
      scheduledDate: new Date(scheduledDate),
      accessToken: uuidv4(),
      accessTokenExpiresAt: new Date(Date.now() + SHARE_LINK_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
      sent: false,
      createdAt: new Date(),
    };

    console.log(`[Vault] Creating scheduling record:`, JSON.stringify(scheduling, null, 2));

    // Insert scheduling record
    await db.collection('scheduling').insertOne(scheduling);

    // Add to slot's scheduledEmails array AND update slot with scheduling info
    console.log(`[Vault] Updating slot ${slotId} with:`, {
      recipientEmail,
      scheduledDate: new Date(scheduledDate)
    });

    await db.collection('slots').updateOne(
      { _id: slotId },
      { 
        $push: { scheduledEmails: scheduling._id },
        $set: { 
          scheduledDate: new Date(scheduledDate),
          scheduledEmail: recipientEmail,
          updatedAt: new Date()
        }
      }
    );

    // Return the updated slot
    const updatedSlot = await db.collection('slots').findOne({ _id: slotId });

    console.log(`[Vault] Updated slot in database:`, JSON.stringify(updatedSlot, null, 2));

    return {
      success: true,
      message: 'Slot scheduled successfully',
      slot: updatedSlot,
    };
  } catch (error) {
    console.error('[Vault] Failed to schedule slot:', error);
    throw error;
  }
}

export async function getNextScheduledSlot(userId) {
  try {
    const db = await getDB();

    const scheduling = await db.collection('scheduling')
      .aggregate([
        {
          $lookup: {
            from: 'slots',
            localField: 'slotId',
            foreignField: '_id',
            as: 'slot',
          },
        },
        {
          $match: {
            'slot.userId': userId,
            scheduledDate: { $gte: new Date() },
            sent: false,
          },
        },
        {
          $sort: { scheduledDate: 1 },
        },
        {
          $limit: 1,
        },
      ])
      .toArray();

    return scheduling.length > 0 ? scheduling[0] : null;
  } catch (error) {
    console.error('[Vault] Failed to get next scheduled slot:', error);
    throw error;
  }
}

export async function getDeliveryStatus(slotId) {
  try {
    const db = await getDB();

    // Get the scheduling record for this slot
    const scheduling = await db.collection('scheduling').findOne({ slotId });
    
    if (!scheduling) {
      return { delivered: false };
    }

    // Check if the scheduling has been sent (delivered)
    return { delivered: scheduling.sent || false };
  } catch (error) {
    console.error('[Vault] Failed to get delivery status:', error);
    throw error;
  }
}

export async function sendScheduledSlots() {
  try {
    const db = await getDB();
    const now = new Date();
    console.log(`[Vault] Current server time: ${now.toISOString()}`);

    // Find all scheduled slots that are due to be sent
    const dueSchedulings = await db.collection('scheduling')
      .find({
        scheduledDate: { $lte: now },
        sent: false,
      })
      .toArray();

    console.log(`[Vault] Found ${dueSchedulings.length} due scheduled slots to send`);

    for (const scheduling of dueSchedulings) {
      const slot = await db.collection('slots').findOne({ _id: scheduling.slotId });
      
      // Delete slot if not found
      if (!slot) {
        console.log(`[Vault] Deleting unscheduled slot ${scheduling._id}...`);
        await db.collection('scheduling').deleteOne({ _id: scheduling._id });
        await db.collection('slots').deleteOne({ _id: scheduling.slotId });
        console.log(`[Vault] Deleted unscheduled slot ${scheduling._id}`);
        continue;
      }
      
      const user = await db.collection('users').findOne({ _id: slot.userId });
      
      // Skip if user not found
      if (!user) {
        console.warn(`[Vault] User not found for slot ${slot._id}, skipping...`);
        continue;
      }

      // Create access link
      const accessLink = `${process.env.FRONTEND_URL}/shared-vault/${scheduling.accessToken}`;

      console.log(`[Vault] Sending email to ${scheduling.recipientEmail} for slot "${slot.name}"`);
      
      try {
        // Send the email
        await sendScheduledSlotNotification(scheduling.recipientEmail, slot.name, accessLink);
        
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

        // Send confirmation to the sender (user)
        await sendSlotDeliveryConfirmation(user.email, slot.name, scheduling.recipientEmail);

        console.log(`[Vault] Successfully sent scheduled slot "${slot.name}" to ${scheduling.recipientEmail}`);
      } catch (emailError) {
        console.error(`[Vault] Failed to send email for scheduling ${scheduling._id}:`, emailError);
      }
    }
  } catch (error) {
    console.error('[Vault] Failed to send scheduled slots:', error);
  }
}

export async function getSharedSlot(accessToken) {
  try {
    const db = await getDB();

    const scheduling = await db.collection('scheduling').findOne({
      accessToken,
      accessTokenExpiresAt: { $gt: new Date() },
    });

    if (!scheduling) {
      return null;
    }

    const slot = await db.collection('slots').findOne({ _id: scheduling.slotId });
    return { slot, scheduling };
  } catch (error) {
    console.error('[Vault] Failed to get shared slot:', error);
    throw error;
  }
}

export async function updateSlotName(slotId, slotName) {
  try {
    const db = await getDB();

    const result = await db.collection('slots').updateOne(
      { _id: slotId },
      { $set: { name: slotName, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return { success: false, message: 'Slot not found' };
    }

    return { success: true, message: 'Slot name updated successfully' };
  } catch (error) {
    console.error('[Vault] Failed to update slot name:', error);
    throw error;
  }
}

export default {
  getVault,
  createSlot,
  getSlots,
  addMediaToSlot,
  addTextToSlot,
  deleteSlot,
  deleteMediaFromSlot,
  deleteTextFromSlot,
  updateTextInSlot,
  updateSlotName,
  scheduleSlot,
  getNextScheduledSlot,
  getDeliveryStatus,
  sendScheduledSlots,
  getSharedSlot,
};
