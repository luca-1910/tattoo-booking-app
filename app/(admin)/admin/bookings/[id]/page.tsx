import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import BookingActions from "./BookingActions";
import type { Booking, AvailableSlot, BookingStatus } from "@/types/database";

export const dynamic = "force-dynamic";

type BookingWithSlot = Booking & { available_slots: AvailableSlot };

const STATUS_STYLE: Record<BookingStatus, { color: string; bg: string }> = {
  pending:   { color: "var(--color-pending)",   bg: "var(--color-pending-bg)" },
  approved:  { color: "var(--color-approved)",  bg: "var(--color-approved-bg)" },
  rejected:  { color: "var(--color-rejected)",  bg: "var(--color-rejected-bg)" },
  cancelled: { color: "var(--color-cancelled)", bg: "var(--color-cancelled-bg)" },
};

const SIZE_LABEL: Record<string, string> = {
  small: "Small", medium: "Medium", large: "Large", full_piece: "Full piece",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatTime(t: string): string {
  const [h, min] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h, min, 0);
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

async function getBooking(id: string): Promise<BookingWithSlot | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("bookings")
    .select("*, available_slots(*)")
    .eq("id", id)
    .single();
  return (data as BookingWithSlot) ?? null;
}

async function getSignedUrl(path: string): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase.storage
    .from("payment-proofs")
    .createSignedUrl(path, 3600);
  return data?.signedUrl ?? "";
}

export default async function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const booking = await getBooking(params.id);
  if (!booking) notFound();

  const slot = booking.available_slots;
  const proofUrl = await getSignedUrl(booking.payment_proof_url);
  const slotDisplay = `${formatDate(slot.date)}, ${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`;
  const s = STATUS_STYLE[booking.status];

  return (
    <>
      <AdminNav />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
        {/* Back + header */}
        <Link
          href="/admin"
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            color: "var(--color-fg-muted)",
            textDecoration: "none",
            display: "inline-block",
            marginBottom: 16,
          }}
        >
          ← Back to bookings
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-3xl)",
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
          }}>
            {booking.client_name}
          </h1>
          <span style={{
            display: "inline-block",
            padding: "4px 12px",
            borderRadius: 4,
            background: s.bg,
            color: s.color,
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: "var(--text-sm)",
            textTransform: "capitalize",
          }}>
            {booking.status}
          </span>
        </div>

        {/* Two-column layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "60fr 40fr",
          gap: 24,
          alignItems: "start",
        }}
          className="booking-detail-grid"
        >
          {/* LEFT — details */}
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}>
            <Section title="Client">
              <Row label="Name">{booking.client_name}</Row>
              <Row label="Email">
                <a href={`mailto:${booking.client_email}`} style={{ color: "var(--color-accent)" }}>
                  {booking.client_email}
                </a>
              </Row>
              <Row label="Phone">
                <a href={`tel:${booking.client_phone}`} style={{ color: "var(--color-fg)" }}>
                  {booking.client_phone}
                </a>
              </Row>
              <Row label="Instagram">
                <a
                  href={`https://instagram.com/${booking.client_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--color-accent)" }}
                >
                  {booking.client_instagram}
                </a>
              </Row>
            </Section>

            <Section title="Appointment">
              <Row label="Date">{formatDate(slot.date)}</Row>
              <Row label="Time">{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</Row>
            </Section>

            <Section title="Tattoo">
              <Row label="Description">{booking.tattoo_description}</Row>
              <Row label="Placement">{booking.body_placement}</Row>
              <Row label="Size">{SIZE_LABEL[booking.size]}</Row>
              <Row label="Agreed price">R$ {Number(booking.agreed_price).toFixed(2)}</Row>
            </Section>

            {booking.notes && (
              <Section title="Notes">
                <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg)" }}>
                  {booking.notes}
                </p>
              </Section>
            )}

            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: "var(--color-fg-subtle)" }}>
              Submitted {new Date(booking.created_at).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}{" "}
              at {new Date(booking.created_at).toLocaleTimeString("en-GB", {
                hour: "numeric", minute: "2-digit", hour12: true,
              })}
            </p>
          </div>

          {/* RIGHT — proof + actions */}
          <BookingActions
            bookingId={booking.id}
            status={booking.status}
            googleEventId={booking.google_event_id}
            slotDisplay={slotDisplay}
            rejectionReason={booking.rejection_reason}
            proofUrl={proofUrl}
          />
        </div>

        <style>{`
          @media (max-width: 700px) {
            .booking-detail-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </main>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: "var(--text-xs)",
        color: "var(--color-fg-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 12,
      }}>
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, alignItems: "baseline" }}>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg)" }}>
        {children}
      </span>
    </div>
  );
}
