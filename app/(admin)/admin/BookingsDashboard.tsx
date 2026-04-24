"use client";

import { useState } from "react";
import Link from "next/link";
import type { Booking, AvailableSlot, BookingStatus } from "@/types/database";

export type BookingWithSlot = Booking & { available_slots: AvailableSlot };

type SortKey = "slot_date" | "created_at";
type SortDir = "asc" | "desc";

const STATUS_TABS: { value: "all" | BookingStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_STYLE: Record<BookingStatus, { color: string; bg: string }> = {
  pending:   { color: "var(--color-pending)",   bg: "var(--color-pending-bg)" },
  approved:  { color: "var(--color-approved)",  bg: "var(--color-approved-bg)" },
  rejected:  { color: "var(--color-rejected)",  bg: "var(--color-rejected-bg)" },
  cancelled: { color: "var(--color-cancelled)", bg: "var(--color-cancelled-bg)" },
};

const SIZE_LABEL: Record<string, string> = {
  small: "Small", medium: "Medium", large: "Large", full_piece: "Full piece",
};

function formatSlotDate(slot: AvailableSlot): string {
  const [y, m, d] = slot.date.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTime(t: string): string {
  const [h, min] = t.split(":").map(Number);
  const d = new Date(); d.setHours(h, min, 0);
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 4,
      background: s.bg,
      color: s.color,
      fontFamily: "var(--font-ui)",
      fontWeight: 500,
      fontSize: 12,
      textTransform: "capitalize",
    }}>
      {status}
    </span>
  );
}

export default function BookingsDashboard({ bookings }: { bookings: BookingWithSlot[] }) {
  const [activeTab, setActiveTab] = useState<"all" | BookingStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("slot_date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const now = new Date();
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const confirmedThisMonth = bookings.filter(b => {
    if (b.status !== "approved") return false;
    const d = new Date(b.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const filtered = activeTab === "all" ? bookings : bookings.filter(b => b.status === activeTab);

  const sorted = [...filtered].sort((a, b) => {
    let av: string, bv: string;
    if (sortKey === "slot_date") {
      av = `${a.available_slots.date}T${a.available_slots.start_time}`;
      bv = `${b.available_slots.date}T${b.available_slots.start_time}`;
    } else {
      av = a.created_at;
      bv = b.created_at;
    }
    return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function tabCount(tab: "all" | BookingStatus) {
    return tab === "all" ? bookings.length : bookings.filter(b => b.status === tab).length;
  }

  const sortIcon = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : " ↕";

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
        <StatCard label="Pending review" value={pendingCount} pending />
        <StatCard label="Confirmed this month" value={confirmedThisMonth} />
        <StatCard label="Total bookings" value={bookings.length} />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--color-border)" }}>
        {STATUS_TABS.map(tab => {
          const active = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding: "8px 0",
                marginRight: 24,
                background: "none",
                border: "none",
                borderBottom: active ? "2px solid var(--color-fg)" : "2px solid transparent",
                marginBottom: -1,
                color: active ? "var(--color-fg)" : "var(--color-fg-muted)",
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {tab.label}
              <span style={{
                background: "var(--color-bg-inset)",
                color: "var(--color-fg-muted)",
                borderRadius: 4,
                padding: "1px 6px",
                fontSize: 12,
                fontWeight: 500,
              }}>
                {tabCount(tab.value)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop table */}
      <div style={{ overflowX: "auto" }} className="dash-desktop-table">
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-ui)", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <Th>Client</Th>
              <Th>Instagram</Th>
              <Th sortable onClick={() => toggleSort("slot_date")}>
                Slot{sortIcon("slot_date")}
              </Th>
              <Th>Size</Th>
              <Th>Price</Th>
              <Th>Status</Th>
              <Th sortable onClick={() => toggleSort("created_at")}>
                Received{sortIcon("created_at")}
              </Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-fg-muted)", fontFamily: "var(--font-ui)" }}>
                  No bookings found.
                </td>
              </tr>
            )}
            {sorted.map(b => (
              <tr
                key={b.id}
                className="dash-row"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <Td>{b.client_name}</Td>
                <Td style={{ color: "var(--color-fg-muted)" }}>{b.client_instagram}</Td>
                <Td>
                  <span style={{ whiteSpace: "nowrap" }}>
                    {formatSlotDate(b.available_slots)}<br />
                    <span style={{ color: "var(--color-fg-muted)", fontSize: 12 }}>
                      {formatTime(b.available_slots.start_time)} – {formatTime(b.available_slots.end_time)}
                    </span>
                  </span>
                </Td>
                <Td>{SIZE_LABEL[b.size]}</Td>
                <Td style={{ whiteSpace: "nowrap" }}>R$ {Number(b.agreed_price).toFixed(2)}</Td>
                <Td><StatusBadge status={b.status} /></Td>
                <Td style={{ color: "var(--color-fg-muted)", whiteSpace: "nowrap" }}>
                  {new Date(b.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </Td>
                <Td>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      border: "1px solid var(--color-border)",
                      borderRadius: 4,
                      color: "var(--color-fg)",
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500,
                      fontSize: 13,
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                    }}
                  >
                    View
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="dash-mobile-cards" style={{ display: "none" }}>
        {sorted.length === 0 && (
          <p style={{ color: "var(--color-fg-muted)", textAlign: "center", padding: 32, fontFamily: "var(--font-ui)" }}>
            No bookings found.
          </p>
        )}
        {sorted.map(b => (
          <div key={b.id} style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 16,
            marginBottom: 12,
          }}>
            {/* Top: name + status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: 16,
                color: "var(--color-fg)",
              }}>
                {b.client_name}
              </span>
              <StatusBadge status={b.status} />
            </div>
            {/* Mid: date + size */}
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--color-fg-muted)", marginBottom: 4 }}>
              {formatSlotDate(b.available_slots)} · {formatTime(b.available_slots.start_time)}
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: 14, color: "var(--color-fg-muted)", marginBottom: 12 }}>
              {SIZE_LABEL[b.size]}
            </p>
            {/* Bottom: price + view */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-ui)", fontWeight: 500, fontSize: 14, color: "var(--color-fg)" }}>
                R$ {Number(b.agreed_price).toFixed(2)}
              </span>
              <Link
                href={`/admin/bookings/${b.id}`}
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  border: "1px solid var(--color-border)",
                  borderRadius: 4,
                  color: "var(--color-fg)",
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: 13,
                  textDecoration: "none",
                }}
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .dash-row:hover { background: var(--color-bg-inset); }
        @media (max-width: 700px) {
          .dash-desktop-table { display: none !important; }
          .dash-mobile-cards  { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, pending }: { label: string; value: number; pending?: boolean }) {
  return (
    <div style={{
      background: "var(--color-bg-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 8,
      padding: 24,
    }}>
      <p style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 48,
        lineHeight: 1,
        color: pending ? "var(--color-pending)" : "var(--color-fg)",
        marginBottom: 10,
      }}>
        {value}
      </p>
      <p style={{
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 12,
        color: "var(--color-fg-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}>
        {label}
      </p>
    </div>
  );
}

function Th({ children, sortable, onClick }: { children?: React.ReactNode; sortable?: boolean; onClick?: () => void }) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "10px 16px",
        textAlign: "left",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 11,
        color: "var(--color-fg-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        cursor: sortable ? "pointer" : "default",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <td style={{ padding: "12px 16px", color: "var(--color-fg)", verticalAlign: "middle", ...style }}>
      {children}
    </td>
  );
}
