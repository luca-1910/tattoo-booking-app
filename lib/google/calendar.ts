import type { Booking, AvailableSlot } from "@/types/database";

export async function createCalendarEvent(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  booking: Booking,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  slot: AvailableSlot
): Promise<string | null> {
  // TODO: implement via Google Calendar API (Prompt 8)
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteCalendarEvent(googleEventId: string): Promise<void> {
  // TODO: implement — handle 404 gracefully (event may already be gone)
}

export async function getFreeBusy(): Promise<void> {
  // TODO: implement for slot sync (Prompt 8)
}
