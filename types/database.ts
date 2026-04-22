export type SlotStatus = "available" | "pending" | "booked";
export type SlotSource = "manual" | "google_calendar";
export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";
export type TattooSize = "small" | "medium" | "large" | "full_piece";

export interface AvailableSlot {
  id: string;
  created_at: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  source: SlotSource;
  google_event_id: string | null;
}

export interface Booking {
  id: string;
  created_at: string;
  slot_id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  client_instagram: string;
  tattoo_description: string;
  body_placement: string;
  size: TattooSize;
  agreed_price: number;
  payment_proof_url: string;
  notes: string | null;
  status: BookingStatus;
  rejection_reason: string | null;
  status_token: string;
  google_event_id: string | null;
}

export interface PortfolioImage {
  id: string;
  created_at: string;
  url: string;
  caption: string | null;
  category: string;
  sort_order: number;
}

export interface Settings {
  id: string;
  studio_name: string;
  studio_address: string;
  notification_email: string;
  default_duration_min: number;
  google_refresh_token: string | null;
  instagram_url: string;
}
