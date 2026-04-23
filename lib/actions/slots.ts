"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getFreeBusy } from "@/lib/google/calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Create manual slot ────────────────────────────────────────────────────────

const createSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export async function createSlot(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const parsed = createSchema.safeParse({
    date: formData.get("date"),
    start_time: formData.get("start_time"),
    end_time: formData.get("end_time"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { date, start_time, end_time } = parsed.data;

  const { error } = await supabase.from("available_slots").insert({
    date,
    start_time,
    end_time,
    status: "available",
    source: "manual",
  });

  if (error) {
    return { success: false, error: "Failed to create slot." };
  }

  revalidatePath("/admin/slots");
  return { success: true };
}

// ── Delete slot ───────────────────────────────────────────────────────────────

export async function deleteSlot(
  slotId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: slot, error: fetchError } = await supabase
    .from("available_slots")
    .select("status")
    .eq("id", slotId)
    .single();

  if (fetchError || !slot) {
    return { success: false, error: "Slot not found." };
  }

  if (slot.status !== "available") {
    return { success: false, error: "Only available slots can be deleted." };
  }

  const { error } = await supabase
    .from("available_slots")
    .delete()
    .eq("id", slotId);

  if (error) {
    return { success: false, error: "Failed to delete slot." };
  }

  revalidatePath("/admin/slots");
  return { success: true };
}

// ── Sync from Google Calendar ─────────────────────────────────────────────────

const syncSchema = z
  .object({
    from: z.string().min(1, "Start date is required"),
    to: z.string().min(1, "End date is required"),
  })
  .refine((d) => d.to >= d.from, {
    message: "End date must be on or after start date",
    path: ["to"],
  });

export async function syncSlotsFromCalendar(
  from: string,
  to: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  const parsed = syncSchema.safeParse({ from, to });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Fetch settings for default_duration_min
  const { data: settings } = await supabase
    .from("settings")
    .select("default_duration_min")
    .single();

  const durationMin = settings?.default_duration_min ?? 60;

  // Fetch existing slots in range (for overlap check)
  const { data: existingSlots } = await supabase
    .from("available_slots")
    .select("date, start_time, end_time")
    .gte("date", from)
    .lte("date", to);

  const existing = existingSlots ?? [];

  let busyIntervals: Awaited<ReturnType<typeof getFreeBusy>> = [];
  try {
    busyIntervals = await getFreeBusy(from, to);
  } catch (err) {
    console.error("[sync] getFreeBusy failed:", err);
    return { success: false, error: "Could not reach Google Calendar. Make sure it is connected." };
  }

  const days = getDaysInRange(from, to);
  const newSlots: Array<{ date: string; start_time: string; end_time: string; status: string; source: string }> = [];

  const WORK_START = 9 * 60;  // 09:00 in minutes
  const WORK_END = 18 * 60;   // 18:00 in minutes

  for (const day of days) {
    // Map busy intervals that overlap this day to minutes-within-day
    const dayBusy = busyIntervals
      .map((b) => ({
        start: isoToMinutesOnDay(b.start, day),
        end: isoToMinutesOnDay(b.end, day),
      }))
      .filter((b) => b.end > WORK_START && b.start < WORK_END);

    const freeBlocks = subtractBusy(WORK_START, WORK_END, dayBusy);

    for (const block of freeBlocks) {
      if (block.end - block.start < durationMin) continue;

      const startTime = minutesToTime(block.start);
      const endTime = minutesToTime(block.end);

      // Skip if overlaps any existing slot on this day
      const overlaps = existing.some(
        (s) =>
          s.date === day &&
          s.start_time < endTime &&
          s.end_time > startTime
      );
      if (overlaps) continue;

      newSlots.push({
        date: day,
        start_time: startTime,
        end_time: endTime,
        status: "available",
        source: "google_calendar",
      });
    }
  }

  if (newSlots.length === 0) {
    revalidatePath("/admin/slots");
    return { success: true, count: 0 };
  }

  const { error: insertError } = await supabase
    .from("available_slots")
    .insert(newSlots);

  if (insertError) {
    return { success: false, error: "Failed to save synced slots." };
  }

  revalidatePath("/admin/slots");
  return { success: true, count: newSlots.length };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInRange(from: string, to: string): string[] {
  const days: string[] = [];
  const current = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (current <= end) {
    days.push(current.toISOString().split("T")[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

// Convert an ISO timestamp to minutes elapsed since midnight of the given day (UTC)
function isoToMinutesOnDay(iso: string, day: string): number {
  const isoMs = new Date(iso).getTime();
  const dayMs = new Date(day + "T00:00:00Z").getTime();
  return Math.round((isoMs - dayMs) / 60_000);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
}

function subtractBusy(
  windowStart: number,
  windowEnd: number,
  busy: Array<{ start: number; end: number }>
): Array<{ start: number; end: number }> {
  const sorted = [...busy].sort((a, b) => a.start - b.start);
  const free: Array<{ start: number; end: number }> = [];
  let cursor = windowStart;

  for (const block of sorted) {
    const s = Math.max(block.start, windowStart);
    const e = Math.min(block.end, windowEnd);
    if (s > cursor) free.push({ start: cursor, end: s });
    cursor = Math.max(cursor, e);
  }

  if (cursor < windowEnd) free.push({ start: cursor, end: windowEnd });
  return free;
}
