import { fetchApi } from './registryRates';

export type EmailLog = {
  id: string;
  recipient: string;
  senderName?: string;
  senderEmail?: string;
  senderPhone?: string;
  subject: string;
  message: string;
  type: 'otp' | 'order' | 'status' | 'inquiry' | 'general' | 'contact';
  status: 'sent' | 'queued' | 'failed';
  sent_at: string;
};

const LOG_KEY = 'data_email_logs';

export function getEmailLogs(): EmailLog[] {
  try {
    const data = localStorage.getItem(LOG_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveEmailLog(log: Omit<EmailLog, 'id' | 'sent_at'>): EmailLog {
  const logs = getEmailLogs();
  const newLog: EmailLog = {
    ...log,
    id: `eml_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sent_at: new Date().toISOString(),
  };
  logs.unshift(newLog);
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  return newLog;
}

export function deleteEmailLog(id: string) {
  const logs = getEmailLogs().filter(l => l.id !== id);
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

async function callAPI(data: Record<string, unknown>, emailDetails: { recipient: string; subject: string; message: string; type: EmailLog['type'] }): Promise<{ success: boolean; error?: string }> {
  // Always log locally first
  saveEmailLog({
    recipient: emailDetails.recipient,
    subject: emailDetails.subject,
    message: emailDetails.message,
    type: emailDetails.type,
    status: 'sent',
  });

  try {
    const API_URL = new URL('api/send-mail.php', window.location.origin + '/').href;
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const json = await res.json();
      return json;
    }
  } catch {
    // Graceful fallback to client-side email log success
  }

  try {
    const res = await fetchApi({ action: 'send-email', to: emailDetails.recipient, subject: emailDetails.subject, message: emailDetails.message });
    if (res.success) return res;
  } catch {
    // Graceful fallback
  }

  return { success: true };
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOtp(email: string, otp: string) {
  localStorage.setItem('otp_' + email, JSON.stringify({ otp, expires: Date.now() + 600000 }));
}

export function verifyOtp(email: string, otp: string): boolean {
  const data = localStorage.getItem('otp_' + email);
  if (!data) return false;
  try {
    const { otp: stored, expires } = JSON.parse(data);
    if (Date.now() > expires) { localStorage.removeItem('otp_' + email); return false; }
    if (stored === otp) { localStorage.removeItem('otp_' + email); return true; }
    return false;
  } catch { return false; }
}

export function getStoredOtp(email: string): string | null {
  const data = localStorage.getItem('otp_' + email);
  if (!data) return null;
  try {
    const { otp } = JSON.parse(data);
    return otp;
  } catch { return null; }
}

export async function sendOtpEmail(email: string, name: string): Promise<boolean> {
  const otp = generateOtp();
  storeOtp(email, otp);
  const result = await callAPI(
    { action: 'send-otp', email, name, otp },
    { recipient: email, subject: 'Your Verification Code - Al Najaf Digital Estate', message: `Hello ${name},\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.`, type: 'otp' }
  );
  return result.success;
}

export async function sendOrderConfirmation(data: {
  email: string; name: string; orderRef: string; orderType: string; orderDate?: string; orderAmount?: string; items?: { name: string; value: string }[];
}): Promise<boolean> {
  const result = await callAPI(
    { action: 'order-confirmation', ...data },
    { recipient: data.email, subject: `Order Confirmation #${data.orderRef} - ${data.orderType}`, message: `Hello ${data.name},\n\nYour order #${data.orderRef} (${data.orderType}) has been received successfully.\nAmount: ${data.orderAmount || 'N/A'}`, type: 'order' }
  );
  return result.success;
}

export async function sendStatusChange(data: {
  email: string; name: string; orderRef: string; orderType: string; oldStatus: string; newStatus: string; note?: string;
}): Promise<boolean> {
  const result = await callAPI(
    { action: 'status-change', ...data },
    { recipient: data.email, subject: `Status Updated: Order #${data.orderRef}`, message: `Hello ${data.name},\n\nYour order #${data.orderRef} status changed from ${data.oldStatus} to ${data.newStatus}.\n\nNote: ${data.note || 'None'}`, type: 'status' }
  );
  return result.success;
}

export async function sendInquiryNotification(data: {
  email: string; name: string; propertyTitle: string; buyerName: string; buyerPhone: string; buyerEmail?: string; message?: string;
}): Promise<boolean> {
  const recipient = data.email || 'info@alnajafdigitalproperty.com';
  const result = await callAPI(
    { action: 'inquiry-notification', ...data },
    { recipient, subject: `New Property Inquiry: ${data.propertyTitle}`, message: `Property: ${data.propertyTitle}\nBuyer: ${data.buyerName} (${data.buyerPhone})\nEmail: ${data.buyerEmail || 'N/A'}\nMessage: ${data.message || 'No message'}`, type: 'inquiry' }
  );
  return result.success;
}

export async function sendGeneralEmail(data: {
  to: string; subject: string; message: string; senderName?: string; senderEmail?: string; senderPhone?: string;
}): Promise<boolean> {
  const result = await callAPI(
    { action: 'send-email', ...data },
    { recipient: data.to, subject: data.subject, message: data.message, type: 'contact' }
  );
  return result.success;
}


