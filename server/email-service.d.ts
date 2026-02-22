export function initEmailService(): Promise<boolean>;
export function sendOTP(email: string, otp: string): Promise<any>;
export function sendScheduledSlotNotification(recipientEmail: string, slotName: string, accessLink: string): Promise<any>;
export function sendInactivityConfirmationEmail(email: string, confirmationLink: string): Promise<any>;
export function sendDeathVaultNotification(recipientEmail: string, senderName: string, accessLink: string): Promise<any>;
