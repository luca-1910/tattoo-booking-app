export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";
import SlotsClient from "./SlotsClient";

export default async function SlotsPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: slots } = await supabase
    .from("available_slots")
    .select("id, date, start_time, end_time, status, source, bookings(client_name, status)")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  return (
    <>
      <AdminNav />
      <SlotsClient slots={slots ?? []} />
    </>
  );
}
