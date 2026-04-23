import { google } from "googleapis";
import { getAuthorizedClient } from "./auth";
import type { Booking, AvailableSlot } from "@/types/database";

// ── Create event ──────────────────────────────────────────────────────────────

export async function createCalendarEvent(
  booking: Booking,
  slot: AvailableSlot
): Promise<string | null> {
  try {
    const auth = await getAuthorizedClient();
    const calendar = google.calendar({ version: "v3", auth });

    // slot.date = "2025-07-14", slot.start_time = "10:00:00"
    const startDateTime = `${slot.date}T${slot.start_time}`;
    const endDateTime = `${slot.date}T${slot.end_time}`;

    const { data: event } = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `${booking.client_name} — Tattoo appointment`,
        description: [
          `Tattoo: ${booking.tattoo_description}`,
          `Placement: ${booking.body_placement}`,
          `Size: ${booking.size}`,
          `Price: R$${Number(booking.agreed_price).toFixed(2)}`,
          `Instagram: ${booking.client_instagram}`,
        ].join("\n"),
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
        attendees: [{ email: booking.client_email }],
      },
    });

    return event.id ?? null;
  } catch (err) {
    console.error("[calendar] createCalendarEvent error:", err);
    return null;
  }
}

// ── Delete event ──────────────────────────────────────────────────────────────

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  try {
    await calendar.events.delete({ calendarId: "primary", eventId });
  } catch (err: unknown) {
    const status = (err as { code?: number })?.code;
    if (status === 404) {
      console.warn(`[calendar] Event ${eventId} not found — already deleted`);
      return;
    }
    throw err;
  }
}

// ── Free/busy (slot sync only) ────────────────────────────────────────────────

export interface BusyInterval {
  start: string;
  end: string;
}

export async function getFreeBusy(
  startDate: string,
  endDate: string
): Promise<BusyInterval[]> {
  const auth = await getAuthorizedClient();
  const calendar = google.calendar({ version: "v3", auth });

  const { data } = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      items: [{ id: "primary" }],
    },
  });

  const busy = data.calendars?.["primary"]?.busy ?? [];
  return busy
    .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
    .map((b) => ({ start: b.start!, end: b.end! }));
}
