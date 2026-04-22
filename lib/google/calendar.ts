// TODO: implement Google Calendar operations

export async function createCalendarEvent() {
  // create event for approved booking, return google_event_id
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function deleteCalendarEvent(googleEventId: string) {
  // delete event; handle 404 gracefully (event may already be gone)
}

export async function getFreeBusy() {
  // read free/busy blocks for slot sync (setup convenience only)
}
