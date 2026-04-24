"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X, AlertTriangle, CalendarDays } from "lucide-react";
import { createSlot, deleteSlot, syncSlotsFromCalendar } from "@/lib/actions/slots";
import type { SlotStatus } from "@/types/database";

type SlotRow = {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  source: string;
  bookings: Array<{ client_name: string; status: string }> | null;
};

type Props = {
  slots: SlotRow[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function getActiveClient(bookings: SlotRow["bookings"]): string | null {
  if (!bookings) return null;
  const active = bookings.find((b) => b.status === "pending" || b.status === "approved");
  return active?.client_name ?? null;
}

function groupByDate(slots: SlotRow[]): Map<string, SlotRow[]> {
  const map = new Map<string, SlotRow[]>();
  for (const slot of slots) {
    const group = map.get(slot.date) ?? [];
    group.push(slot);
    map.set(slot.date, group);
  }
  return map;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const badgeStyles: Record<SlotStatus, { bg: string; color: string }> = {
  available: { bg: "var(--color-available-bg)", color: "var(--color-available)" },
  pending:   { bg: "var(--color-pending-bg)",   color: "var(--color-pending)"   },
  booked:    { bg: "var(--color-approved-bg)",  color: "var(--color-approved)"  },
};

function StatusBadge({ status }: { status: SlotStatus }) {
  const s = badgeStyles[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      background: s.bg,
      color: s.color,
      fontFamily: "var(--font-ui)",
      fontWeight: 500,
      fontSize: 12,
      textTransform: "capitalize",
    }}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Shared input style ────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: "var(--color-bg-inset)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  color: "var(--color-fg)",
  fontFamily: "var(--font-ui)",
  fontSize: 14,
  padding: "8px 12px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

// ── Create slot form ──────────────────────────────────────────────────────────

function CreateSlotForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSlot(formData);
      if (result.success) {
        toast.success("Slot created.");
        formRef.current?.reset();
      } else {
        setError(result.error ?? "Failed to create slot.");
      }
    });
  }

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      padding: 24,
      marginBottom: 32,
    }}>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 11,
        color: "var(--color-fg-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 16,
      }}>
        Add a slot
      </p>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="slots-form-grid">
          <div>
            <label htmlFor="date" style={fieldLabelStyle}>Date</label>
            <input id="date" name="date" type="date" required style={inputStyle} />
          </div>
          <div>
            <label htmlFor="start_time" style={fieldLabelStyle}>Start time</label>
            <input id="start_time" name="start_time" type="time" required style={inputStyle} />
          </div>
          <div>
            <label htmlFor="end_time" style={fieldLabelStyle}>End time</label>
            <input id="end_time" name="end_time" type="time" required style={inputStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: "8px 20px",
                borderRadius: 4,
                border: "none",
                background: isPending ? "var(--color-accent-hover)" : "var(--color-accent)",
                color: "#fff",
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {isPending ? "Adding…" : "Add slot"}
            </button>
          </div>
        </div>
        {error && (
          <p style={{ marginTop: 12, fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--color-rejected)" }}>
            {error}
          </p>
        )}
      </form>
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: 13,
  color: "var(--color-fg-muted)",
  marginBottom: 6,
};

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  slotId,
  slotLabel,
  onDeleted,
}: {
  slotId: string;
  slotLabel: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSlot(slotId);
      if (result.success) {
        toast.success("Slot deleted.");
        setOpen(false);
        onDeleted();
      } else {
        toast.error(result.error ?? "Failed to delete slot.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          title="Delete slot"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: 4,
            color: "var(--color-fg-subtle)",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-rejected)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "var(--color-fg-subtle)"; }}
        >
          <Trash2 size={15} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40"
          style={{ background: "rgba(26,23,20,0.5)" }}
        />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm px-4 outline-none"
        >
          <div style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 24,
          }}>
            <Dialog.Title style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              color: "var(--color-fg)",
              marginBottom: 8,
            }}>
              Delete Slot
            </Dialog.Title>
            <Dialog.Description style={{
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              color: "var(--color-fg-muted)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}>
              Delete <span style={{ color: "var(--color-fg)" }}>{slotLabel}</span>? This cannot be undone.
            </Dialog.Description>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Dialog.Close asChild>
                <button style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid var(--color-border)",
                  background: "transparent",
                  color: "var(--color-fg)",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: "pointer",
                }}>
                  Cancel
                </button>
              </Dialog.Close>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 14,
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.65 : 1,
                }}
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
            <Dialog.Close asChild>
              <button
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-fg-muted)",
                  padding: 4,
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Google Calendar sync section ──────────────────────────────────────────────

function SyncSection() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<{ count: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSync(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await syncSlotsFromCalendar(from, to);
      if (res.success) {
        setResult({ count: res.count ?? 0 });
        toast.success(
          res.count === 0
            ? "No new slots found in that range."
            : `${res.count} slot${res.count === 1 ? "" : "s"} added from your Google Calendar.`
        );
      } else {
        toast.error(res.error ?? "Sync failed.");
      }
    });
  }

  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      padding: 24,
      marginTop: 32,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <CalendarDays size={16} style={{ color: "var(--color-fg-muted)" }} />
        <h2 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 18,
          color: "var(--color-fg)",
          letterSpacing: "-0.01em",
        }}>
          Sync from Google Calendar
        </h2>
      </div>

      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 400,
        fontSize: 14,
        color: "var(--color-fg-muted)",
        marginBottom: 20,
        lineHeight: 1.6,
      }}>
        Import free time blocks from your calendar as available slots (9 AM – 6 PM working hours).
      </p>

      {/* Warning notice */}
      <div style={{
        display: "flex",
        gap: 10,
        padding: 12,
        borderRadius: 4,
        background: "var(--color-bg-inset)",
        border: "1px solid var(--color-border)",
        marginBottom: 20,
      }}>
        <AlertTriangle size={14} style={{ color: "var(--color-pending)", flexShrink: 0, marginTop: 2 }} />
        <p style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 400,
          fontSize: 13,
          color: "var(--color-fg-muted)",
          lineHeight: 1.5,
        }}>
          Manage all appointments through this dashboard. Changes made directly in Google Calendar will not be reflected here.
        </p>
      </div>

      <form onSubmit={handleSync}>
        <div className="slots-form-grid">
          <div>
            <label htmlFor="sync-from" style={fieldLabelStyle}>From</label>
            <input
              id="sync-from"
              type="date"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="sync-to" style={fieldLabelStyle}>To</label>
            <input
              id="sync-to"
              type="date"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              type="submit"
              disabled={isPending || !from || !to}
              style={{
                padding: "8px 20px",
                borderRadius: 4,
                border: "1px solid var(--color-border-strong)",
                background: "transparent",
                color: "var(--color-fg)",
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                cursor: (isPending || !from || !to) ? "not-allowed" : "pointer",
                opacity: (isPending || !from || !to) ? 0.5 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {isPending ? "Syncing…" : "Sync available times"}
            </button>
          </div>
        </div>

        {result !== null && (
          <div style={{
            marginTop: 16,
            borderLeft: "3px solid var(--color-approved)",
            background: "var(--color-approved-bg)",
            padding: "10px 14px",
            borderRadius: 4,
          }}>
            <p style={{
              fontFamily: "var(--font-ui)",
              fontSize: 14,
              color: "var(--color-approved)",
            }}>
              {result.count === 0
                ? "No new slots found in that date range."
                : `${result.count} slot${result.count === 1 ? "" : "s"} added from your Google Calendar.`}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

// ── Slot list ─────────────────────────────────────────────────────────────────

export default function SlotsClient({ slots: initialSlots }: Props) {
  const [slots, setSlots] = useState(initialSlots);

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  const grouped = groupByDate(slots);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", fontFamily: "var(--font-ui)" }}>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 36,
        color: "var(--color-fg)",
        letterSpacing: "-0.02em",
        lineHeight: 1.1,
        marginBottom: 8,
      }}>
        Availability
      </h1>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 400,
        fontSize: 16,
        color: "var(--color-fg-muted)",
        marginBottom: 32,
        lineHeight: 1.6,
      }}>
        Manage appointment slots. Add manually or sync from Google Calendar.
      </p>

      <CreateSlotForm />

      {/* Slot list */}
      {slots.length === 0 ? (
        <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--color-fg-muted)" }}>
          No slots yet. Add one above or sync from Google Calendar below.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Array.from(grouped.entries()).map(([date, daySlots]) => (
            <div key={date}>
              <p style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 20,
                color: "var(--color-fg)",
                letterSpacing: "-0.01em",
                paddingBottom: 10,
                borderBottom: "1px solid var(--color-border)",
                marginBottom: 8,
              }}>
                {formatDate(date)}
              </p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {daySlots.map((slot, idx) => {
                  const clientName = getActiveClient(slot.bookings);
                  return (
                    <div
                      key={slot.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: idx < daySlots.length - 1 ? "1px solid var(--color-border)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span style={{
                          fontFamily: "var(--font-ui)",
                          fontWeight: 500,
                          fontSize: 14,
                          color: "var(--color-fg)",
                          whiteSpace: "nowrap",
                        }}>
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </span>
                        <StatusBadge status={slot.status} />
                        {clientName && (
                          <span style={{
                            fontFamily: "var(--font-ui)",
                            fontWeight: 400,
                            fontSize: 14,
                            color: "var(--color-fg-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {clientName}
                          </span>
                        )}
                      </div>
                      {slot.status === "available" && (
                        <DeleteDialog
                          slotId={slot.id}
                          slotLabel={`${formatDate(date)} ${formatTime(slot.start_time)}`}
                          onDeleted={() => removeSlot(slot.id)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <SyncSection />

      <style>{`
        .slots-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
          align-items: end;
        }
        @media (max-width: 640px) {
          .slots-form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
