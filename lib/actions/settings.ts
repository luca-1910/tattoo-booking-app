"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthUrl } from "@/lib/google/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const settingsSchema = z.object({
  studio_name: z.string().min(1, "Studio name is required"),
  studio_address: z.string().min(1, "Studio address is required"),
  notification_email: z.string().email("Invalid email address"),
  instagram_url: z.string().min(1, "Instagram URL is required"),
  default_duration_min: z.coerce
    .number()
    .min(30, "Minimum duration is 30 minutes"),
});

export async function saveSettings(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = settingsSchema.safeParse({
    studio_name: formData.get("studio_name"),
    studio_address: formData.get("studio_address"),
    notification_email: formData.get("notification_email"),
    instagram_url: formData.get("instagram_url"),
    default_duration_min: formData.get("default_duration_min"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { error } = await supabase
    .from("settings")
    .update(parsed.data)
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return { success: false, error: "Failed to save settings." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}

export async function connectGoogleCalendar(): Promise<never> {
  const url = getAuthUrl();
  redirect(url);
}

export async function disconnectGoogle(): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from("settings")
    .update({ google_refresh_token: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return { success: false, error: "Failed to disconnect Google Calendar." };
  }

  revalidatePath("/admin/settings");
  return { success: true };
}
