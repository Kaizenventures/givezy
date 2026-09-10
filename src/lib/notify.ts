import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional email. Entirely optional: with no SMTP_* configuration every
 * call becomes a logged no-op, so a missing mail account can never break a
 * donation. Callers should still not await these on the critical path.
 */

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER;
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || "";
const SITE_URL = process.env.NEXTAUTH_URL || "https://givezy.in";

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  const tx = getTransporter();
  if (!tx || !to) {
    console.log(`[notify] skipped (email not configured): ${subject} -> ${to || "no recipient"}`);
    return;
  }
  try {
    await tx.sendMail({ from: MAIL_FROM, to, subject, html, text });
    console.log(`[notify] sent: ${subject} -> ${to}`);
  } catch (err) {
    // Never let a mail failure surface to the donor
    console.error(`[notify] failed: ${subject} -> ${to}`, err);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}

function layout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
  <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(heading)}</h1>
  ${bodyHtml}
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:12px;color:#6b7280;margin:0">Givezy · <a href="${SITE_URL}" style="color:#059669">givezy.in</a></p>
</div>`;
}

export interface DonationNotice {
  donationId: string;
  donorName: string;
  donorPhone: string;
  donorEmail: string | null;
  donorAddress: string;
  donorPincode: string;
  bucketLabel: string;
  maxKg: number;
  amountPaise: number;
  isDemo: boolean;
}

/** Tells the team a pickup has been paid for and needs a bag posted out. */
export async function notifyAdminOfDonation(d: DonationNotice): Promise<void> {
  const ref = d.donationId.slice(0, 8).toUpperCase();
  const amount = `₹${(d.amountPaise / 100).toFixed(0)}`;
  const rows: [string, string][] = [
    ["Reference", ref],
    ["Donor", d.donorName],
    ["Phone", d.donorPhone],
    ["Email", d.donorEmail || "—"],
    ["Address", `${d.donorAddress}, ${d.donorPincode}`],
    ["Bag size", `${d.bucketLabel} (up to ${d.maxKg} kg)`],
    ["Paid", d.isDemo ? `${amount} (DEMO — no real payment)` : amount],
  ];

  const html = layout(
    d.isDemo ? "New DEMO donation" : "New donation paid",
    `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:6px 0;color:#6b7280;width:110px">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`,
      )
      .join("")}</table>
    <p style="margin:20px 0 0"><a href="${SITE_URL}/admin/donations/${d.donationId}" style="background:#059669;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Open in admin</a></p>
    <p style="font-size:13px;color:#6b7280;margin-top:20px">Next step: post the de-clutter bag, then book the Shiprocket pickup once they confirm it's packed.</p>`,
  );

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${SITE_URL}/admin/donations/${d.donationId}`;

  await send(
    ADMIN_NOTIFY_EMAIL,
    `${d.isDemo ? "[DEMO] " : ""}New Givezy donation — ${d.donorName} (${amount})`,
    html,
    text,
  );
}

/** Confirms to the donor what happens next. */
export async function notifyDonorOfDonation(d: DonationNotice): Promise<void> {
  if (!d.donorEmail) return;
  const ref = d.donationId.slice(0, 8).toUpperCase();

  const html = layout(
    "Thank you — your pickup is booked",
    `<p style="font-size:14px;line-height:1.6">Hi ${escapeHtml(d.donorName)}, we've received your payment${d.isDemo ? " (demo — no money was charged)" : ""}. Your reference is <strong>${ref}</strong>.</p>
     <p style="font-size:14px;line-height:1.6;margin-top:16px"><strong>What happens next</strong></p>
     <ol style="font-size:14px;line-height:1.8;padding-left:20px;margin:8px 0">
       <li>You'll receive a de-clutter bag from Givezy.</li>
       <li>Pack it with up to <strong>${d.maxKg} kg</strong> (${escapeHtml(d.bucketLabel)}).</li>
       <li>Ping us on WhatsApp and we'll arrange the pickup.</li>
     </ol>`,
  );

  const text = `Hi ${d.donorName}, your Givezy pickup is booked. Reference ${ref}.

What happens next:
1. You'll receive a de-clutter bag from Givezy.
2. Pack it with up to ${d.maxKg} kg (${d.bucketLabel}).
3. Ping us on WhatsApp and we'll arrange the pickup.`;

  await send(d.donorEmail, `Your Givezy pickup is booked — ${ref}`, html, text);
}

/** Fire-and-forget both notices without blocking the caller. */
export function sendDonationNotices(d: DonationNotice): void {
  void Promise.allSettled([notifyAdminOfDonation(d), notifyDonorOfDonation(d)]);
}
