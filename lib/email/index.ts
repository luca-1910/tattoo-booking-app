import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type { Booking, AvailableSlot, Settings } from "@/types/database";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatSlotDateTime(slot: AvailableSlot): string {
  const [year, month, day] = slot.date.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  const dateStr = d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = formatTime(slot.start_time);
  return `${dateStr} at ${timeStr}`;
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0);
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatPrice(price: number): string {
  return `R$ ${price.toFixed(2)}`;
}

function formatSize(size: string): string {
  const labels: Record<string, string> = {
    small: "Small",
    medium: "Medium",
    large: "Large",
    full_piece: "Full piece",
  };
  return labels[size] ?? size;
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0];
}

async function getSettings(): Promise<Settings | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.from("settings").select("*").single();
  return data ?? null;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

// ── 1. Booking confirmation → client ─────────────────────────────────────────

export async function sendBookingConfirmationToClient(
  booking: Booking,
  slot: AvailableSlot
): Promise<void> {
  try {
    const settings = await getSettings();
    const studioName = settings?.studio_name ?? "the studio";

    const html = `
      <p>Hi ${firstName(booking.client_name)},</p>
      <p>We've received your booking request for
         <strong>${formatSlotDateTime(slot)}</strong>.
         We'll review it and get back to you shortly.</p>
      <table cellpadding="6" style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="color:#6B6560;font-size:14px">Description</td>
            <td>${booking.tattoo_description}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Placement</td>
            <td>${booking.body_placement}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Size</td>
            <td>${formatSize(booking.size)}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Agreed price</td>
            <td>${formatPrice(booking.agreed_price)}</td></tr>
      </table>
      <p style="margin-top:24px">
        <a href="${siteUrl}/status/${booking.status_token}"
           style="background:#C0392B;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:14px">
          View booking status
        </a>
      </p>
      <p style="margin-top:32px;color:#6B6560;font-size:14px">
        ${studioName}
      </p>
    `;

    await resend.emails.send({
      from: `${studioName} <noreply@${extractDomain(siteUrl)}>`,
      to: booking.client_email,
      subject: "Booking received — we'll be in touch soon",
      html,
    });
  } catch (err) {
    console.error("[email] sendBookingConfirmationToClient failed:", err);
  }
}

// ── 2. Booking notification → artist ─────────────────────────────────────────

export async function sendBookingNotificationToArtist(
  booking: Booking,
  slot: AvailableSlot
): Promise<void> {
  try {
    const settings = await getSettings();
    if (!settings?.notification_email) return;

    const studioName = settings.studio_name ?? "Studio";

    const html = `
      <p>A new booking has been submitted.</p>
      <table cellpadding="6" style="border-collapse:collapse;width:100%;max-width:560px">
        <tr><td style="color:#6B6560;font-size:14px;white-space:nowrap">Client</td>
            <td>${booking.client_name}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Email</td>
            <td>${booking.client_email}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Phone</td>
            <td>${booking.client_phone}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Instagram</td>
            <td>${booking.client_instagram}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Slot</td>
            <td>${formatSlotDateTime(slot)}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Description</td>
            <td>${booking.tattoo_description}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Placement</td>
            <td>${booking.body_placement}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Size</td>
            <td>${formatSize(booking.size)}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Agreed price</td>
            <td>${formatPrice(booking.agreed_price)}</td></tr>
        ${booking.notes ? `<tr><td style="color:#6B6560;font-size:14px">Notes</td><td>${booking.notes}</td></tr>` : ""}
      </table>
      <p style="margin-top:24px">
        <a href="${siteUrl}/admin/bookings/${booking.id}"
           style="background:#C0392B;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:14px">
          Review in dashboard
        </a>
      </p>
    `;

    await resend.emails.send({
      from: `${studioName} <noreply@${extractDomain(siteUrl)}>`,
      to: settings.notification_email,
      subject: `New booking from ${booking.client_name} — ${formatSlotDateTime(slot)}`,
      html,
    });
  } catch (err) {
    console.error("[email] sendBookingNotificationToArtist failed:", err);
  }
}

// ── 3. Approval → client ──────────────────────────────────────────────────────

export async function sendApprovalEmail(
  booking: Booking,
  slot: AvailableSlot
): Promise<void> {
  try {
    const settings = await getSettings();
    const studioName = settings?.studio_name ?? "the studio";
    const studioAddress = settings?.studio_address ?? "";

    const html = `
      <p>Hi ${firstName(booking.client_name)},</p>
      <p>Great news — your appointment is confirmed! We're looking forward to seeing you.</p>
      <table cellpadding="6" style="border-collapse:collapse;width:100%;max-width:480px">
        <tr><td style="color:#6B6560;font-size:14px">Date &amp; time</td>
            <td><strong>${formatSlotDateTime(slot)}</strong></td></tr>
        ${studioAddress ? `<tr><td style="color:#6B6560;font-size:14px">Location</td><td>${studioAddress}</td></tr>` : ""}
        <tr><td style="color:#6B6560;font-size:14px">Description</td>
            <td>${booking.tattoo_description}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Placement</td>
            <td>${booking.body_placement}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Size</td>
            <td>${formatSize(booking.size)}</td></tr>
        <tr><td style="color:#6B6560;font-size:14px">Agreed price</td>
            <td>${formatPrice(booking.agreed_price)}</td></tr>
      </table>
      <p style="margin-top:24px;color:#6B6560;font-size:14px">
        If you have any questions, reach out on Instagram.<br/><br/>
        See you soon,<br/>${studioName}
      </p>
    `;

    await resend.emails.send({
      from: `${studioName} <noreply@${extractDomain(siteUrl)}>`,
      to: booking.client_email,
      subject: "Your appointment is confirmed!",
      html,
    });
  } catch (err) {
    console.error("[email] sendApprovalEmail failed:", err);
  }
}

// ── 4. Rejection → client ─────────────────────────────────────────────────────

export async function sendRejectionEmail(
  booking: Booking,
  reason?: string
): Promise<void> {
  try {
    const settings = await getSettings();
    const studioName = settings?.studio_name ?? "the studio";
    const instagramUrl = settings?.instagram_url ?? "";

    const html = `
      <p>Hi ${firstName(booking.client_name)},</p>
      <p>Thank you for reaching out. Unfortunately we're unable to confirm your booking request at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
      <p>We'd love to stay in touch — feel free to reach out via Instagram and we can find a time that works.</p>
      ${instagramUrl ? `<p><a href="${instagramUrl}" style="color:#C0392B">${instagramUrl}</a></p>` : ""}
      <p style="margin-top:32px;color:#6B6560;font-size:14px">${studioName}</p>
    `;

    await resend.emails.send({
      from: `${studioName} <noreply@${extractDomain(siteUrl)}>`,
      to: booking.client_email,
      subject: "Update on your booking request",
      html,
    });
  } catch (err) {
    console.error("[email] sendRejectionEmail failed:", err);
  }
}

// ── 5. Cancellation → client ──────────────────────────────────────────────────

export async function sendCancellationEmail(
  booking: Booking,
  slot: AvailableSlot
): Promise<void> {
  try {
    const settings = await getSettings();
    const studioName = settings?.studio_name ?? "the studio";
    const instagramUrl = settings?.instagram_url ?? "";

    const html = `
      <p>Hi ${firstName(booking.client_name)},</p>
      <p>We're writing to let you know that your appointment on
         <strong>${formatSlotDateTime(slot)}</strong> has been cancelled.</p>
      <p>We're sorry for any inconvenience. If you'd like to rebook, visit our website or reach out on Instagram and we'll find a new time for you.</p>
      ${instagramUrl ? `<p><a href="${instagramUrl}" style="color:#C0392B">${instagramUrl}</a></p>` : ""}
      <p style="margin-top:32px;color:#6B6560;font-size:14px">${studioName}</p>
    `;

    await resend.emails.send({
      from: `${studioName} <noreply@${extractDomain(siteUrl)}>`,
      to: booking.client_email,
      subject: "Your appointment has been cancelled",
      html,
    });
  } catch (err) {
    console.error("[email] sendCancellationEmail failed:", err);
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "example.com";
  }
}
