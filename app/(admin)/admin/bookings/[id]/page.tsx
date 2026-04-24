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
  pending:   { bg: "var(--color-pending-bg)",   color: "var(--color-pending)"   },
  approved:  { bg: "var(--color-approved-bg)",  color: "var(--color-approved)"  },
  rejected:  { bg: "var(--color-rejected-bg)",  color: "var(--color-rejected)"  },
  cancelled: { bg: "var(--color-cancelled-bg)", color: "var(--color-cancelled)" },
};

const sectionLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: 11,
  color: "var(--color-fg-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  marginBottom: 16,
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--color-fg-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 3,
      }}>
        {label}
      </p>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 400,
        fontSize: 15,
        color: "var(--color-fg)",
        lineHeight: 1.5,
      }}>
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

  const { data: signedData } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(booking.payment_proof_url, 3600);

  const proofUrl = signedData?.signedUrl ?? null;

  const badge = statusColors[booking.status] ?? statusColors.pending;

  return (
    <>
      <AdminNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
          }}>
            {booking.client_name}
          </h1>
          <span style={{
            fontFamily: "var(--font-ui)",
            fontSize: 13,
            fontWeight: 500,
            padding: "4px 12px",
            borderRadius: 4,
            background: badge.bg,
            color: badge.color,
          }}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* Two-column layout */}
        <div
          style={{ display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", gap: 32, alignItems: "start" }}
          className="booking-detail-grid"
        >
          {/* Left: booking details */}
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 24,
          }}>
            {/* Appointment section */}
            <p style={sectionLabelStyle}>Appointment</p>
            {slot && (
              <Field
                label="Date & Time"
                value={`${formatDate(slot.date)} · ${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`}
              />
            )}

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />

            {/* Client section */}
            <p style={sectionLabelStyle}>Client</p>
            <Field label="Name" value={booking.client_name} />
            <Field label="Email" value={booking.client_email} />
            <Field label="Phone" value={booking.client_phone} />
            <Field label="Instagram" value={booking.client_instagram} />

            <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: "20px 0" }} />

            {/* Tattoo section */}
            <p style={sectionLabelStyle}>Tattoo</p>
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

            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: 12,
              color: "var(--color-fg-subtle)",
              marginTop: 24,
            }}>
              Submitted {new Date(booking.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Right: actions + payment proof */}
          <BookingActions booking={booking} proofUrl={proofUrl} />
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .booking-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
