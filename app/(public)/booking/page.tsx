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

export default async function BookingPage() {
  const slots = await getAvailableSlots();

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "48px 24px",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 900,
          fontSize: "var(--text-4xl)",
          color: "var(--color-fg)",
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          marginBottom: 8,
        }}
      >
        Book your session
      </h1>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
          color: "var(--color-fg-muted)",
          marginBottom: 40,
        }}
      >
        Select an available slot, then fill in your details below.
      </p>

      <BookingForm slots={slots} />
    </main>
  );
}
