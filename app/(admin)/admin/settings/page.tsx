export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import AdminNav from "@/components/AdminNav";
import SettingsClient from "./SettingsClient";
import type { Settings } from "@/types/database";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string };
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase.from("settings").select("*").single();
  const settings: Settings | null = data ?? null;

  return (
    <>
      <AdminNav active="settings" />
      <SettingsClient
        settings={settings}
        googleConnected={!!data?.google_refresh_token}
        oauthConnected={searchParams.connected === "true"}
        oauthError={searchParams.error === "google"}
      />
    </>
  );
}
