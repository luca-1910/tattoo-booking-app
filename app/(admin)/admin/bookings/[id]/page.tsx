export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import BookingActions from "./BookingActions";

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

const statusColors: Record<string, { bg: string; color: string }> = {
  pending: { bg: "var(--color-pending-bg)", color: "var(--color-pending)" },
  approved: { bg: "var(--color-approved-bg)", color: "var(--color-approved)" },
  rejected: { bg: "var(--color-rejected-bg)", color: "var(--color-rejected)" },
  cancelled: { bg: "var(--color-cancelled-bg)", color: "var(--color-cancelled)" },
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          color: "var(--color-fg-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 2,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
          color: "var(--color-fg)",
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: booking } = await supabase
    .from("bookings")
    .select("*, available_slots(*)")
    .eq("id", params.id)
    .single();

  if (!booking) notFound();

  const slot = booking.available_slots;

  // Generate signed URL for payment proof (private bucket)
  const { data: signedData } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(booking.payment_proof_url, 3600);

  const proofUrl = signedData?.signedUrl ?? null;

  const badge = statusColors[booking.status] ?? statusColors.pending;

  return (
    <>
      <AdminNav />
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "var(--text-3xl)",
              color: "var(--color-fg)",
              letterSpacing: "-0.02em",
            }}
          >
            {booking.client_name}
          </h1>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              padding: "4px 12px",
              borderRadius: 4,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
            gap: 32,
            alignItems: "start",
          }}
          className="flex-col sm:grid"
        >
          {/* Left: booking details */}
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
                color: "var(--color-fg)",
                marginBottom: 24,
              }}
            >
              Appointment
            </h2>

            {slot && (
              <Field
                label="Date & Time"
                value={`${formatDate(slot.date)} at ${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`}
              />
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
                color: "var(--color-fg)",
                marginBottom: 20,
              }}
            >
              Client
            </h2>
            <Field label="Name" value={booking.client_name} />
            <Field label="Email" value={booking.client_email} />
            <Field label="Phone" value={booking.client_phone} />
            <Field label="Instagram" value={booking.client_instagram} />

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
                color: "var(--color-fg)",
                marginBottom: 20,
              }}
            >
              Tattoo
            </h2>
            <Field label="Description" value={booking.tattoo_description} />
            <Field label="Placement" value={booking.body_placement} />
            <Field label="Size" value={sizeLabels[booking.size] ?? booking.size} />
            <Field label="Agreed Price" value={`R$ ${Number(booking.agreed_price).toFixed(2)}`} />

            {booking.notes && (
              <Field label="Notes" value={booking.notes} />
            )}

            {booking.rejection_reason && (
              <Field label="Rejection Reason" value={booking.rejection_reason} />
            )}

            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-xs)",
                color: "var(--color-fg-subtle)",
                marginTop: 24,
              }}
            >
              Submitted {new Date(booking.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Right: actions + payment proof */}
          <BookingActions
            booking={booking}
            proofUrl={proofUrl}
          />
        </div>
      </div>
    </>
  );
}
