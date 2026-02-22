import * as inactivityUtils from './inactivity-utils.js';
import * as vaultUtils from './vault-utils.js';

// Run inactivity checks every 24 hours
export function startInactivityCheckJob() {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

  setInterval(async () => {
    console.log('[Jobs] Running inactivity check...');
    try {
      await inactivityUtils.checkInactivity();
      await inactivityUtils.triggerDeathVault();
    } catch (error) {
      console.error('[Jobs] Inactivity check failed:', error);
    }
  }, INTERVAL_MS);

  console.log('[Jobs] Inactivity check job started (runs every 24 hours)');
}

// Run scheduled slot delivery check every 1 minute
export function startScheduledSlotDeliveryJob() {
  const INTERVAL_MS = 1 * 60 * 1000; // 1 minute

  setInterval(async () => {
    console.log('[Jobs] Running scheduled slot delivery check...');
    try {
      await vaultUtils.sendScheduledSlots();
    } catch (error) {
      console.error('[Jobs] Scheduled slot delivery failed:', error);
    }
  }, INTERVAL_MS);

  console.log('[Jobs] Scheduled slot delivery job started (runs every 1 minute)');
}

// Start all jobs
export function startAllJobs() {
  startInactivityCheckJob();
  startScheduledSlotDeliveryJob();
}

export default { startAllJobs, startInactivityCheckJob, startScheduledSlotDeliveryJob };
