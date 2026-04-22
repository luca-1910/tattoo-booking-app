import { createClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";
import BookingsDashboard, { type BookingWithSlot } from "./BookingsDashboard";

export const dynamic = "force-dynamic";

async function getBookings(): Promise<BookingWithSlot[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("bookings")
    .select("*, available_slots(*)")
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as BookingWithSlot[];
}

export default async function AdminDashboardPage() {
  const bookings = await getBookings();

  return (
    <>
      <AdminNav />
      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 900,
            fontSize: "var(--text-3xl)",
            color: "var(--color-fg)",
            letterSpacing: "-0.02em",
            marginBottom: 32,
          }}
        >
          Bookings
        </h1>

        <BookingsDashboard bookings={bookings} />
      </main>
    </>
  );
}
