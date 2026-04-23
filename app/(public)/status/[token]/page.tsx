export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

const sizeLabels: Record<string, string> = {
  small: "Small",
  medium: "Medium",
  large: "Large",
  full_piece: "Full piece",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 16,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)", flexShrink: 0 }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

export default async function StatusPage({ params }: { params: { token: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: booking }, { data: settingsRow }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*, available_slots(*)")
      .eq("status_token", params.token)
      .single(),
    supabase.from("settings").select("studio_address, instagram_url").single(),
  ]);

  const studioAddress = settingsRow?.studio_address ?? "";
  const instagramUrl = settingsRow?.instagram_url ?? "";

  // Not found
  if (!booking) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-2xl)", color: "var(--color-fg)", marginBottom: 12 }}>
            Booking not found
          </h1>
          <p style={{ fontFamily: "var(--font-ui)", color: "var(--color-fg-muted)", marginBottom: 24 }}>
            This link may be invalid or expired.
          </p>
          <Link href="/booking" style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "none" }}>
            Book an appointment →
          </Link>
        </div>
      </main>
    );
  }

  const slot = booking.available_slots;
  const firstName = booking.client_name.split(" ")[0];
  const dateLabel = slot ? `${formatDate(slot.date)} at ${formatTime(slot.start_time)}` : "";

  type BadgeCfg = { label: string; bg: string; color: string };
  const badges: Record<string, BadgeCfg> = {
    pending:   { label: "Under review", bg: "var(--color-pending-bg)",   color: "var(--color-pending)"   },
    approved:  { label: "Confirmed",    bg: "var(--color-approved-bg)",  color: "var(--color-approved)"  },
    rejected:  { label: "Not confirmed",bg: "var(--color-rejected-bg)",  color: "var(--color-rejected)"  },
    cancelled: { label: "Cancelled",    bg: "var(--color-cancelled-bg)", color: "var(--color-cancelled)" },
  };
  const badge = badges[booking.status] ?? badges.pending;

  return (
    <main style={{ minHeight: "100vh", background: "var(--color-bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
      <div style={{ width: "100%", maxWidth: 480, background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "28px 28px 20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-2xl)", color: "var(--color-fg)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            {firstName}&apos;s booking
          </h1>
          {slot && (
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)", marginBottom: 14 }}>
              {dateLabel}
            </p>
          )}

          {/* Status badge */}
          <span style={{ display: "inline-block", fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: "var(--text-sm)", padding: "4px 12px", borderRadius: 4, background: badge.bg, color: badge.color, marginBottom: 14 }}>
            {badge.label}
          </span>

          {/* Status message */}
          <div style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)", lineHeight: 1.6 }}>
            {booking.status === "pending" && (
              <p>We&apos;ve received your booking request and will confirm shortly.</p>
            )}
            {booking.status === "approved" && (
              <p>
                Your appointment is confirmed. See you on{" "}
                <strong style={{ color: "var(--color-fg)" }}>{dateLabel}</strong>{" "}
                at <strong style={{ color: "var(--color-fg)" }}>{studioAddress}</strong>.
              </p>
            )}
            {booking.status === "rejected" && (
              <div>
                <p>Unfortunately we couldn&apos;t confirm this booking.</p>
                {booking.rejection_reason && (
                  <p style={{ marginTop: 8, fontStyle: "italic" }}>
                    &ldquo;{booking.rejection_reason}&rdquo;
                  </p>
                )}
              </div>
            )}
            {booking.status === "cancelled" && (
              <p>This appointment has been cancelled.</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--color-border)" }} />

        {/* Booking details */}
        <div style={{ padding: "4px 28px" }}>
          <DetailRow label="Tattoo" value={booking.tattoo_description} />
          <DetailRow label="Placement" value={booking.body_placement} />
          <DetailRow label="Size" value={sizeLabels[booking.size] ?? booking.size} />
          <DetailRow label="Price" value={`R$ ${Number(booking.agreed_price).toFixed(2)}`} />
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px 24px", borderTop: "1px solid var(--color-border)", marginTop: 8 }}>
          {instagramUrl ? (
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)", textDecoration: "none" }}>
              Questions? Reach us on Instagram →
            </a>
          ) : (
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)" }}>
              Questions? Contact us directly.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
