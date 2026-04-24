import { createClient } from "@supabase/supabase-js";
import type { AvailableSlot } from "@/types/database";
import BookingForm from "./BookingForm";

export const dynamic = "force-dynamic";

async function getAvailableSlots(): Promise<AvailableSlot[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("available_slots")
    .select("*")
    .eq("status", "available")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return [];
  return data ?? [];
}

const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/missmay.tattoos";

const bullets = [
  "Discuss your design and price with Phoebe on Instagram first.",
  "Payment is via bank transfer upfront. Upload a screenshot as proof.",
  "Slots are held pending until Phoebe confirms.",
];

function InfoPanel() {
  return (
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
          fontSize: 20,
          letterSpacing: "-0.01em",
          color: "var(--color-fg)",
          marginBottom: 20,
        }}
      >
        Before you book
      </h2>

      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
        {bullets.map((text) => (
          <li key={text} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <span
              style={{
                color: "var(--color-accent)",
                fontSize: 18,
                lineHeight: 1.4,
                flexShrink: 0,
              }}
            >
              •
            </span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 14,
                color: "var(--color-fg-muted)",
                lineHeight: 1.6,
              }}
            >
              {text}
            </span>
          </li>
        ))}
      </ul>

      <div
        style={{ height: 1, background: "var(--color-border)", marginBottom: 20 }}
      />

      <a
        href={INSTAGRAM_URL}
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
        Reach out on Instagram →
      </a>
    </div>
  );
}

export default async function BookingPage() {
  const slots = await getAvailableSlots();

  return (
    <main
      style={{
        background: "var(--color-bg)",
        minHeight: "100vh",
        padding: "48px 24px 80px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr] items-start gap-8 md:gap-12">

          {/* LEFT: heading + form — second on mobile, first on desktop */}
          <div className="order-2 md:order-1">
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 36,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: "var(--color-fg)",
                marginBottom: 12,
              }}
            >
              Book an appointment
            </h1>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 400,
                fontSize: 16,
                color: "var(--color-fg-muted)",
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 480,
              }}
            >
              Fill in your details below. You&apos;ll receive a confirmation
              email once Phoebe reviews your request.
            </p>
            <BookingForm slots={slots} />
          </div>

          {/* RIGHT: info panel — first on mobile, sticky on desktop */}
          <div className="order-1 md:order-2 md:sticky md:top-20">
            <InfoPanel />
          </div>

        </div>
      </div>
    </main>
  );
}
