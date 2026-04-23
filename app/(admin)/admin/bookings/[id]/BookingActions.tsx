"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, AlertTriangle } from "lucide-react";
import { approveBooking, rejectBooking, cancelBooking } from "@/lib/actions/booking";

type Booking = {
  id: string;
  status: string;
  google_event_id: string | null;
  rejection_reason: string | null;
};

type Props = {
  booking: Booking;
  proofUrl: string | null;
};

// ── Shared button styles ──────────────────────────────────────────────────────

function primaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    fontSize: "var(--text-sm)",
    padding: "10px 20px",
    borderRadius: 4,
    border: "none",
    background: disabled ? "var(--color-accent-hover)" : "var(--color-accent)",
    color: "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
    width: "100%",
  };
}

function secondaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    fontSize: "var(--text-sm)",
    padding: "10px 20px",
    borderRadius: 4,
    border: "1px solid var(--color-border-strong)",
    background: "transparent",
    color: "var(--color-fg)",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.65 : 1,
    width: "100%",
  };
}

// ── Payment proof lightbox ────────────────────────────────────────────────────

function ProofLightbox({ proofUrl }: { proofUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "block",
          width: "100%",
          padding: 0,
          border: "1px solid var(--color-border)",
          borderRadius: 4,
          overflow: "hidden",
          cursor: "zoom-in",
          background: "none",
          marginTop: 16,
        }}
        title="View payment proof"
      >
        <Image
          src={proofUrl}
          alt="Payment proof"
          width={400}
          height={240}
          style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }}
        />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay
            className="fixed inset-0 z-50"
            style={{ background: "rgba(26,23,20,0.9)" }}
          />
          <Dialog.Content
            className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-4 outline-none"
          >
            <Image
              src={proofUrl}
              alt="Payment proof (full size)"
              width={1200}
              height={900}
              style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain", borderRadius: 4 }}
            />
            <Dialog.Close asChild>
              <button
                style={{
                  position: "fixed",
                  top: 20,
                  right: 20,
                  padding: 8,
                  background: "rgba(255,255,255,0.15)",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  color: "#fff",
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

// ── Cancel confirmation dialog ────────────────────────────────────────────────

function CancelDialog({
  bookingId,
  onCancelled,
}: {
  bookingId: string;
  onCancelled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        toast.success("Booking cancelled.");
        setOpen(false);
        onCancelled();
      } else {
        toast.error(result.error ?? "Failed to cancel booking.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button style={secondaryBtn()}>Cancel appointment</button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(26,23,20,0.5)" }}
        />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4 outline-none"
        >
          <div
            style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 24,
            }}
          >
            <Dialog.Title
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "var(--text-lg)",
                color: "var(--color-fg)",
                marginBottom: 8,
              }}
            >
              Cancel Appointment
            </Dialog.Title>
            <Dialog.Description
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--color-fg-muted)",
                marginBottom: 24,
              }}
            >
              This will cancel the booking, free the slot, and delete the Google Calendar event. A cancellation email will be sent to the client.
            </Dialog.Description>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Dialog.Close asChild>
                <button
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    padding: "8px 16px",
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                    background: "transparent",
                    color: "var(--color-fg)",
                    cursor: "pointer",
                  }}
                >
                  Keep
                </button>
              </Dialog.Close>
              <button
                onClick={handleCancel}
                disabled={isPending}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: "var(--text-sm)",
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.65 : 1,
                }}
              >
                {isPending ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Main actions panel ────────────────────────────────────────────────────────

export default function BookingActions({ booking, proofUrl }: Props) {
  const [status, setStatus] = useState(booking.status);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleApprove() {
    startTransition(async () => {
      const result = await approveBooking(booking.id);
      if (result.success) {
        toast.success("Booking approved. Calendar event created.");
        setStatus("approved");
      } else {
        toast.error(result.error ?? "Failed to approve booking.");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectBooking(booking.id, rejectReason || undefined);
      if (result.success) {
        toast.success("Booking rejected.");
        setRejectOpen(false);
        setStatus("rejected");
      } else {
        toast.error(result.error ?? "Failed to reject booking.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Payment proof */}
      {proofUrl && (
        <div
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 20,
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-xs)",
              fontWeight: 500,
              color: "var(--color-fg-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Payment Proof
          </p>
          <ProofLightbox proofUrl={proofUrl} />
        </div>
      )}

      {/* Actions */}
      <div
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: 20,
        }}
      >
        {status === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={handleApprove}
              disabled={isPending}
              style={primaryBtn(isPending)}
            >
              {isPending ? "Approving…" : "Approve booking"}
            </button>

            {/* Reject — inline expand */}
            {!rejectOpen ? (
              <button
                onClick={() => setRejectOpen(true)}
                style={secondaryBtn()}
              >
                Reject booking
              </button>
            ) : (
              <div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (optional)"
                  rows={3}
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "var(--text-sm)",
                    padding: "8px 12px",
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-inset)",
                    color: "var(--color-fg)",
                    width: "100%",
                    resize: "vertical",
                    outline: "none",
                    marginBottom: 8,
                  }}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setRejectOpen(false)}
                    style={{ ...secondaryBtn(), width: "auto", padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isPending}
                    style={{ ...primaryBtn(isPending), width: "auto", padding: "8px 16px", flexGrow: 1 }}
                  >
                    {isPending ? "Rejecting…" : "Confirm rejection"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {status === "approved" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--color-approved)",
                background: "var(--color-approved-bg)",
                padding: "10px 14px",
                borderRadius: 4,
                fontWeight: 500,
              }}
            >
              ✓ Approved — calendar event created
            </div>

            {booking.google_event_id && (
              <a
                href={`https://calendar.google.com/calendar/event?eid=${booking.google_event_id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-fg-muted)",
                  textDecoration: "underline",
                }}
              >
                View in Google Calendar →
              </a>
            )}

            <div
              style={{
                display: "flex",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 4,
                background: "var(--color-pending-bg)",
                border: "1px solid var(--color-pending)",
              }}
            >
              <AlertTriangle
                size={14}
                style={{ color: "var(--color-pending)", flexShrink: 0, marginTop: 2 }}
              />
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--text-xs)",
                  color: "var(--color-pending)",
                  lineHeight: 1.5,
                }}
              >
                Manage all appointments through this dashboard. Changes made directly in Google Calendar will not be reflected here.
              </p>
            </div>

            <CancelDialog
              bookingId={booking.id}
              onCancelled={() => setStatus("cancelled")}
            />
          </div>
        )}

        {status === "rejected" && (
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-rejected)",
              background: "var(--color-rejected-bg)",
              padding: "10px 14px",
              borderRadius: 4,
            }}
          >
            This booking was rejected.
          </div>
        )}

        {status === "cancelled" && (
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--color-cancelled)",
              background: "var(--color-cancelled-bg)",
              padding: "10px 14px",
              borderRadius: 4,
            }}
          >
            This booking was cancelled.
          </div>
        )}
      </div>
    </div>
  );
}
