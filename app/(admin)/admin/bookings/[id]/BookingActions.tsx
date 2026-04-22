"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { approveBooking, rejectBooking, cancelBooking } from "@/lib/actions/booking";
import type { BookingStatus } from "@/types/database";

interface Props {
  bookingId: string;
  status: BookingStatus;
  googleEventId: string | null;
  slotDisplay: string;
  rejectionReason: string | null;
  proofUrl: string;
}

export default function BookingActions({
  bookingId,
  status,
  googleEventId,
  slotDisplay,
  rejectionReason,
  proofUrl,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function handleApprove() {
    startTransition(async () => {
      const result = await approveBooking(bookingId);
      if (result.success) {
        toast.success("Booking approved.");
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectBooking(bookingId, rejectReason || undefined);
      if (result.success) {
        toast.success("Booking rejected.");
        setShowRejectForm(false);
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  function handleCancel() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        toast.success("Booking cancelled.");
        setShowCancelDialog(false);
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Payment proof */}
      <div>
        <p style={labelStyle}>Payment proof</p>
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => setLightboxOpen(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Payment proof"
            style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 220 }}
          />
          <p style={{
            padding: "6px 12px",
            background: "var(--color-bg-inset)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-xs)",
            color: "var(--color-fg-muted)",
          }}>
            Click to view full size
          </p>
        </div>
      </div>

      {/* Action panel — varies by status */}
      {status === "pending" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            onClick={handleApprove}
            disabled={pending}
            style={primaryBtnStyle(pending)}
          >
            {pending ? "Processing…" : "Approve booking"}
          </button>

          {!showRejectForm ? (
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={pending}
              style={outlineBtnStyle}
            >
              Reject booking
            </button>
          ) : (
            <div style={{
              background: "var(--color-bg-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <label style={labelStyle}>Reason (optional)</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="e.g. slot no longer available…"
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleReject}
                  disabled={pending}
                  style={{
                    flex: 1,
                    padding: "9px 16px",
                    background: "var(--color-rejected)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontFamily: "var(--font-ui)",
                    fontWeight: 500,
                    fontSize: "var(--text-sm)",
                    cursor: pending ? "not-allowed" : "pointer",
                    opacity: pending ? 0.6 : 1,
                  }}
                >
                  {pending ? "Rejecting…" : "Confirm rejection"}
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  disabled={pending}
                  style={{ ...outlineBtnStyle, flex: "none", padding: "9px 14px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {status === "approved" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            background: "var(--color-approved-bg)",
            border: "1px solid var(--color-approved)",
            borderRadius: 8,
            padding: "12px 16px",
          }}>
            <p style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: "var(--text-sm)", color: "var(--color-approved)" }}>
              ✓ Confirmed
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)", marginTop: 2 }}>
              {slotDisplay}
            </p>
          </div>

          {googleEventId && (
            <a
              href={`https://calendar.google.com/calendar/event?eid=${googleEventId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "9px 16px",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: "var(--text-sm)",
                color: "var(--color-fg)",
                textDecoration: "none",
              }}
            >
              View in Google Calendar ↗
            </a>
          )}

          {/* Calendar warning */}
          <div style={{
            background: "var(--color-pending-bg)",
            border: "1px solid var(--color-pending)",
            borderRadius: 8,
            padding: "12px 16px",
          }}>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-xs)", color: "var(--color-pending)", lineHeight: 1.5 }}>
              Manage all appointments through this dashboard. Changes made directly in Google Calendar will not be reflected here.
            </p>
          </div>

          <button
            onClick={() => setShowCancelDialog(true)}
            disabled={pending}
            style={{
              ...outlineBtnStyle,
              color: "var(--color-rejected)",
              borderColor: "var(--color-rejected)",
            }}
          >
            Cancel booking
          </button>
        </div>
      )}

      {(status === "rejected" || status === "cancelled") && (
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: "16px",
        }}>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)", marginBottom: rejectionReason ? 8 : 0 }}>
            This booking has been <strong>{status}</strong>.
          </p>
          {rejectionReason && (
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg)", fontStyle: "italic" }}>
              &ldquo;{rejectionReason}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent style={{ maxWidth: "90vw", maxHeight: "90vh", padding: 0, overflow: "hidden" }}>
          <DialogHeader style={{ padding: "16px 16px 0" }}>
            <DialogTitle style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-base)", fontWeight: 500 }}>
              Payment proof
            </DialogTitle>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proofUrl}
            alt="Payment proof full size"
            style={{ width: "100%", height: "auto", maxHeight: "80vh", objectFit: "contain", display: "block" }}
          />
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-ui)", fontWeight: 600 }}>
              Cancel this booking?
            </DialogTitle>
          </DialogHeader>
          <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-fg-muted)" }}>
            The slot will be returned to available and the client will be notified by email. This cannot be undone.
          </p>
          <DialogFooter style={{ gap: 8 }}>
            <button
              onClick={() => setShowCancelDialog(false)}
              style={outlineBtnStyle}
            >
              Keep booking
            </button>
            <button
              onClick={handleCancel}
              disabled={pending}
              style={{
                padding: "9px 16px",
                background: "var(--color-rejected)",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: "var(--text-sm)",
                cursor: pending ? "not-allowed" : "pointer",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {pending ? "Cancelling…" : "Yes, cancel"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: "var(--text-sm)",
  color: "var(--color-fg-muted)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 12px",
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--color-fg)",
  outline: "none",
  resize: "vertical",
};

function primaryBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "11px 20px",
    background: disabled ? "var(--color-border-strong)" : "var(--color-accent)",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontFamily: "var(--font-ui)",
    fontWeight: 500,
    fontSize: "var(--text-sm)",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

const outlineBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 20px",
  background: "transparent",
  color: "var(--color-fg)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: "var(--text-sm)",
  cursor: "pointer",
};
