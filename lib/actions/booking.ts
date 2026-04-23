"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  sendBookingConfirmationToClient,
  sendBookingNotificationToArtist,
  sendApprovalEmail,
  sendRejectionEmail,
  sendCancellationEmail,
} from "@/lib/email/index";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/google/calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const submitSchema = z.object({
  slot_id: z.string().uuid(),
  client_name: z.string().min(1),
  client_email: z.string().email(),
  client_phone: z.string().min(1),
  client_instagram: z.string().min(1),
  tattoo_description: z.string().min(20),
  body_placement: z.string().min(1),
  size: z.enum(["small", "medium", "large", "full_piece"]),
  agreed_price: z.number().positive(),
  payment_proof_url: z.string().min(1),
  notes: z.string().optional(),
});

export async function submitBooking(
  input: z.infer<typeof submitSchema>
): Promise<{ success: true; status_token: string } | { success: false; error: string }> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data." };
  }

  const data = parsed.data;

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      slot_id: data.slot_id,
      client_name: data.client_name,
      client_email: data.client_email,
      client_phone: data.client_phone,
      client_instagram: data.client_instagram,
      tattoo_description: data.tattoo_description,
      body_placement: data.body_placement,
      size: data.size,
      agreed_price: data.agreed_price,
      payment_proof_url: data.payment_proof_url,
      notes: data.notes ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (bookingError || !booking) {
    return { success: false, error: "Failed to create booking. Please try again." };
  }

  const { error: slotError } = await supabase
    .from("available_slots")
    .update({ status: "pending" })
    .eq("id", data.slot_id);

  if (slotError) {
    return { success: false, error: "Failed to reserve slot. Please try again." };
  }

  // Fetch slot for emails — failure here must not block the response
  const { data: slot } = await supabase
    .from("available_slots")
    .select("*")
    .eq("id", data.slot_id)
    .single();

  if (slot) {
    // Fire-and-forget — errors are caught inside each function
    void sendBookingConfirmationToClient(booking, slot);
    void sendBookingNotificationToArtist(booking, slot);
  }

  return { success: true, status_token: booking.status_token };
}

// ── Approve booking (admin) ───────────────────────────────────────────────────

export async function approveBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, available_slots(*)")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found." };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "approved" })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: "Failed to approve booking." };
  }

  await supabase
    .from("available_slots")
    .update({ status: "booked" })
    .eq("id", booking.slot_id);

  try {
    const eventId = await createCalendarEvent(booking, booking.available_slots);
    if (eventId) {
      await supabase
        .from("bookings")
        .update({ google_event_id: eventId })
        .eq("id", bookingId);
    }
  } catch (err) {
    console.error("[calendar] createCalendarEvent failed:", err);
  }

  void sendApprovalEmail(booking, booking.available_slots);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { success: true };
}

// ── Reject booking (admin) ────────────────────────────────────────────────────

export async function rejectBooking(
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, available_slots(*)")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found." };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "rejected", rejection_reason: reason ?? null })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: "Failed to reject booking." };
  }

  await supabase
    .from("available_slots")
    .update({ status: "available" })
    .eq("id", booking.slot_id);

  void sendRejectionEmail(booking, reason);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { success: true };
}

// ── Cancel booking (admin) ────────────────────────────────────────────────────

export async function cancelBooking(
  bookingId: string
): Promise<{ success: boolean; error?: string }> {
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("*, available_slots(*)")
    .eq("id", bookingId)
    .single();

  if (fetchError || !booking) {
    return { success: false, error: "Booking not found." };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (updateError) {
    return { success: false, error: "Failed to cancel booking." };
  }

  await supabase
    .from("available_slots")
    .update({ status: "available" })
    .eq("id", booking.slot_id);

  if (booking.google_event_id) {
    try {
      await deleteCalendarEvent(booking.google_event_id);
    } catch (err) {
      console.error("[calendar] deleteCalendarEvent failed:", err);
    }
  }

  void sendCancellationEmail(booking, booking.available_slots);

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin");
  return { success: true };
}
