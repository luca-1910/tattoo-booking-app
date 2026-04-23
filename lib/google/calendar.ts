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
      timeMin: new Date(startDate + "T00:00:00Z").toISOString(),
      timeMax: new Date(endDate + "T23:59:59Z").toISOString(),
      items: [{ id: "primary" }],
    },
  });

  const busy = data.calendars?.["primary"]?.busy ?? [];
  return busy
    .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
    .map((b) => ({ start: b.start!, end: b.end! }));
}
