"use server";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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
    .select("status_token")
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

  return { success: true, status_token: booking.status_token };
}

export async function approveBooking() {
  // TODO: approve booking
}

export async function rejectBooking() {
  // TODO: reject booking
}

export async function cancelBooking() {
  // TODO: cancel booking
}
