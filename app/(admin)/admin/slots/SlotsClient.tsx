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

const badgeStyles: Record<SlotStatus, string> = {
  available: "bg-[var(--color-available-bg)] text-[var(--color-available)]",
  pending: "bg-[var(--color-pending-bg)] text-[var(--color-pending)]",
  booked: "bg-[var(--color-approved-bg)] text-[var(--color-approved)]",
};

function StatusBadge({ status }: { status: SlotStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badgeStyles[status]}`}
      style={{ fontFamily: "var(--font-ui)" }}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

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
    <div
      className="rounded-lg p-6 mb-8"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <h2
        className="text-base font-medium mb-4"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-fg)" }}
      >
        Add Slot
      </h2>
      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="date"
              className="text-sm font-medium"
              style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}
            >
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="px-3 py-2 rounded text-sm"
              style={{
                background: "var(--color-bg-inset)",
                border: "1px solid var(--color-border)",
                color: "var(--color-fg)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="start_time"
              className="text-sm font-medium"
              style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}
            >
              Start Time
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              required
              className="px-3 py-2 rounded text-sm"
              style={{
                background: "var(--color-bg-inset)",
                border: "1px solid var(--color-border)",
                color: "var(--color-fg)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="end_time"
              className="text-sm font-medium"
              style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}
            >
              End Time
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              required
              className="px-3 py-2 rounded text-sm"
              style={{
                background: "var(--color-bg-inset)",
                border: "1px solid var(--color-border)",
                color: "var(--color-fg)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>
        </div>
        {error && (
          <p className="mt-3 text-sm" style={{ color: "var(--color-rejected)", fontFamily: "var(--font-ui)" }}>
            {error}
          </p>
        )}
        <div className="mt-4">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded text-sm font-medium text-white disabled:opacity-60"
            style={{
              background: isPending ? "var(--color-accent-hover)" : "var(--color-accent)",
              fontFamily: "var(--font-ui)",
            }}
          >
            {isPending ? "Adding…" : "Add Slot"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
          className="p-1.5 rounded transition-colors"
          style={{ color: "var(--color-fg-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-rejected)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-fg-muted)")}
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
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg p-6"
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
          }}
        >
          <Dialog.Title
            className="text-base font-semibold mb-2"
            style={{ fontFamily: "var(--font-display)", color: "var(--color-fg)" }}
          >
            Delete Slot
          </Dialog.Title>
          <Dialog.Description
            className="text-sm mb-6"
            style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}
          >
            Delete <span style={{ color: "var(--color-fg)" }}>{slotLabel}</span>? This cannot be undone.
          </Dialog.Description>
          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                className="px-4 py-2 rounded text-sm font-medium"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-fg)",
                  fontFamily: "var(--font-ui)",
                }}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-60"
              style={{ background: "var(--color-accent)", fontFamily: "var(--font-ui)" }}
            >
              {isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1"
              style={{ color: "var(--color-fg-muted)" }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </Dialog.Close>
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
    <div
      className="rounded-lg p-6 mt-8"
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <CalendarDays size={16} style={{ color: "var(--color-fg-muted)" }} />
        <h2
          className="text-base font-medium"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-fg)" }}
        >
          Sync from Google Calendar
        </h2>
      </div>
      <p className="text-sm mb-4" style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}>
        Import free time blocks from your calendar as available slots (9 AM – 6 PM working hours).
      </p>

      {/* Warning */}
      <div
        className="flex gap-3 rounded p-3 mb-5 text-sm"
        style={{
          background: "var(--color-pending-bg)",
          border: "1px solid var(--color-pending)",
          color: "var(--color-pending)",
          fontFamily: "var(--font-ui)",
        }}
      >
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <span>
          Manage all appointments through this dashboard. Changes made directly in Google Calendar
          will not be reflected here.
        </span>
      </div>

      <form onSubmit={handleSync}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="sync-from"
              className="text-sm font-medium"
              style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}
            >
              From
            </label>
            <input
              id="sync-from"
              type="date"
              required
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="px-3 py-2 rounded text-sm"
              style={{
                background: "var(--color-bg-inset)",
                border: "1px solid var(--color-border)",
                color: "var(--color-fg)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="sync-to"
              className="text-sm font-medium"
              style={{ color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}
            >
              To
            </label>
            <input
              id="sync-to"
              type="date"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="px-3 py-2 rounded text-sm"
              style={{
                background: "var(--color-bg-inset)",
                border: "1px solid var(--color-border)",
                color: "var(--color-fg)",
                fontFamily: "var(--font-ui)",
                outline: "none",
              }}
            />
          </div>
        </div>

        {result !== null && (
          <p className="mt-3 text-sm" style={{ color: "var(--color-approved)", fontFamily: "var(--font-ui)" }}>
            {result.count === 0
              ? "No new slots found in that date range."
              : `${result.count} slot${result.count === 1 ? "" : "s"} added from your Google Calendar.`}
          </p>
        )}

        <div className="mt-4">
          <button
            type="submit"
            disabled={isPending || !from || !to}
            className="px-5 py-2.5 rounded text-sm font-medium disabled:opacity-60"
            style={{
              border: "1px solid var(--color-border-strong)",
              color: "var(--color-fg)",
              fontFamily: "var(--font-ui)",
              background: "transparent",
            }}
          >
            {isPending ? "Syncing…" : "Sync available times"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Slot list ─────────────────────────────────────────────────────────────────

export default function SlotsClient({ slots: initialSlots }: Props) {
  // Local state so delete triggers a re-render without a full page reload
  const [slots, setSlots] = useState(initialSlots);

  function removeSlot(id: string) {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }

  const grouped = groupByDate(slots);

  return (
    <div
      className="max-w-3xl mx-auto px-6 py-10"
      style={{ fontFamily: "var(--font-ui)" }}
    >
      <h1
        className="text-3xl font-bold mb-8 tracking-tight"
        style={{ fontFamily: "var(--font-display)", color: "var(--color-fg)" }}
      >
        Slots
      </h1>

      <CreateSlotForm />

      {/* Slot list */}
      {slots.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
          No slots yet. Add one above or sync from Google Calendar below.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(grouped.entries()).map(([date, daySlots]) => (
            <div key={date}>
              <p
                className="text-xs font-medium uppercase tracking-widest mb-2"
                style={{ color: "var(--color-fg-muted)" }}
              >
                {formatDate(date)}
              </p>
              <div
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--color-border)" }}
              >
                {daySlots.map((slot, idx) => {
                  const clientName = getActiveClient(slot.bookings);
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between px-4 py-3"
                      style={{
                        background: "var(--color-bg-surface)",
                        borderTop: idx > 0 ? "1px solid var(--color-border)" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-sm tabular-nums" style={{ color: "var(--color-fg)" }}>
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </span>
                        <StatusBadge status={slot.status} />
                        {clientName && (
                          <span className="text-sm truncate" style={{ color: "var(--color-fg-muted)" }}>
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
    </div>
  );
}
