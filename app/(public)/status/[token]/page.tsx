export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Calendar } from "lucide-react";

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

type BadgeCfg = { label: string; bg: string; color: string };
const badges: Record<string, BadgeCfg> = {
  pending:   { label: "Under review",   bg: "var(--color-pending-bg)",   color: "var(--color-pending)"   },
  approved:  { label: "Confirmed",      bg: "var(--color-approved-bg)",  color: "var(--color-approved)"  },
  rejected:  { label: "Not confirmed",  bg: "var(--color-rejected-bg)",  color: "var(--color-rejected)"  },
  cancelled: { label: "Cancelled",      bg: "var(--color-cancelled-bg)", color: "var(--color-cancelled)" },
};

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 12,
        color: "var(--color-fg-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 400,
        fontSize: 15,
        color: "var(--color-fg)",
        lineHeight: 1.4,
      }}>
        {value}
      </div>
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

  const instagramUrl = settingsRow?.instagram_url ?? process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "";

  if (!booking) {
    return (
      <main style={{
        minHeight: "100vh",
        background: "var(--color-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}>
            Booking not found
          </h1>
          <Link href="/booking" style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: "var(--text-sm)",
            color: "var(--color-accent)",
            textDecoration: "none",
          }}>
            Submit a new booking →
          </Link>
        </div>
      </main>
    );
  }

  const slot = booking.available_slots;
  const firstName = booking.client_name.split(" ")[0];
  const badge = badges[booking.status] ?? badges.pending;

  const dateLabel = slot ? formatDate(slot.date) : "";
  const startTimeLabel = slot ? formatTime(slot.start_time) : "";
  const endTimeLabel = slot ? formatTime(slot.end_time) : "";
  const slotLabel = slot ? `${dateLabel} · ${startTimeLabel} – ${endTimeLabel}` : "";

  return (
    <main style={{
      minHeight: "100vh",
      background: "var(--color-bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 24px",
    }}>
      <div style={{ width: "100%", maxWidth: 560 }}>

        {/* Status card */}
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: 32,
        }}>

          {/* Header row */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 16,
          }}>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 24,
              color: "var(--color-fg)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}>
              Booking for {firstName}
            </h1>
            <span style={{
              display: "inline-block",
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: "var(--text-sm)",
              padding: "4px 12px",
              borderRadius: 4,
              background: badge.bg,
              color: badge.color,
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}>
              {badge.label}
            </span>
          </div>

          {/* Slot row */}
          {slot && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 24,
            }}>
              <Calendar size={16} color="var(--color-fg-muted)" strokeWidth={1.75} />
              <span style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 16,
                color: "var(--color-fg)",
              }}>
                {slotLabel}
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", marginBottom: 24 }} />

          {/* Status message */}
          {booking.status === "pending" && (
            <div style={{
              borderLeft: "3px solid var(--color-pending)",
              background: "var(--color-pending-bg)",
              padding: 16,
              borderRadius: 4,
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-pending)",
                marginBottom: 6,
              }}>
                Under review
              </div>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 14,
                color: "var(--color-fg)",
                lineHeight: 1.6,
              }}>
                Phoebe has received your request and will be in touch via email shortly. This usually takes 1–2 business days.
              </div>
            </div>
          )}

          {booking.status === "approved" && (
            <div style={{
              borderLeft: "3px solid var(--color-approved)",
              background: "var(--color-approved-bg)",
              padding: 16,
              borderRadius: 4,
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-approved)",
                marginBottom: 6,
              }}>
                Confirmed!
              </div>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 14,
                color: "var(--color-fg)",
                lineHeight: 1.6,
              }}>
                See you at 270 Unley Road, Hyde Park on {dateLabel} at {startTimeLabel}.
              </div>
            </div>
          )}

          {booking.status === "rejected" && (
            <div style={{
              borderLeft: "3px solid var(--color-rejected)",
              background: "var(--color-rejected-bg)",
              padding: 16,
              borderRadius: 4,
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-rejected)",
                marginBottom: 6,
              }}>
                Not confirmed
              </div>
              {booking.rejection_reason && (
                <div style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 400,
                  fontSize: 14,
                  color: "var(--color-fg-muted)",
                  fontStyle: "italic",
                  lineHeight: 1.6,
                }}>
                  &ldquo;{booking.rejection_reason}&rdquo;
                </div>
              )}
            </div>
          )}

          {booking.status === "cancelled" && (
            <div style={{
              borderLeft: "3px solid var(--color-border-strong)",
              background: "var(--color-bg-inset)",
              padding: 16,
              borderRadius: 4,
              marginBottom: 24,
            }}>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-fg)",
                marginBottom: 6,
              }}>
                Cancelled
              </div>
              <div style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 14,
                color: "var(--color-fg-muted)",
                lineHeight: 1.6,
              }}>
                Reach out on Instagram to rebook.
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", marginBottom: 24 }} />

          {/* Booking summary grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px 24px",
          }}>
            <SummaryItem label="Tattoo" value={booking.tattoo_description} />
            <SummaryItem label="Placement" value={booking.body_placement} />
            <SummaryItem label="Size" value={sizeLabels[booking.size] ?? booking.size} />
            <SummaryItem label="Price" value={`R$ ${Number(booking.agreed_price).toFixed(2)}`} />
          </div>
        </div>

        {/* Help section */}
        <div style={{
          marginTop: 32,
          textAlign: "center",
        }}>
          <div style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: 14,
            color: "var(--color-fg-muted)",
            marginBottom: 6,
          }}>
            Have questions?
          </div>
          {instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: "var(--color-accent)",
                textDecoration: "none",
              }}
            >
              Message Phoebe on Instagram →
            </a>
          ) : (
            <span style={{
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              color: "var(--color-fg-muted)",
            }}>
              Message Phoebe on Instagram
            </span>
          )}
        </div>
      </div>
    </main>
  );
}
