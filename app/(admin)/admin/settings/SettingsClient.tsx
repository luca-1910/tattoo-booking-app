"use client";

import { useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { saveSettings, connectGoogleCalendar, disconnectGoogle } from "@/lib/actions/settings";
import type { Settings } from "@/types/database";

type Props = {
  settings: Settings | null;
  googleConnected: boolean;
  oauthConnected: boolean;
  oauthError: boolean;
};

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  padding: "8px 12px",
  borderRadius: 4,
  border: "1px solid var(--color-border)",
  background: "var(--color-bg-inset)",
  color: "var(--color-fg)",
  width: "100%",
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--color-fg-muted)",
  display: "block",
  marginBottom: 4,
};

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "var(--text-xl)",
          color: "var(--color-fg)",
          marginBottom: 20,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function SettingsClient({
  settings,
  googleConnected,
  oauthConnected,
  oauthError,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [disconnectPending, startDisconnect] = useTransition();

  // Show OAuth result toasts on mount
  useEffect(() => {
    if (oauthConnected) toast.success("Google Calendar connected.");
    if (oauthError) toast.error("Google Calendar connection failed. Please try again.");
  }, [oauthConnected, oauthError]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveSettings(formData);
      if (result.success) {
        toast.success("Settings saved.");
      } else {
        toast.error(result.error ?? "Failed to save settings.");
      }
    });
  }

  function handleDisconnect() {
    startDisconnect(async () => {
      const result = await disconnectGoogle();
      if (result.success) {
        toast.success("Google Calendar disconnected.");
      } else {
        toast.error(result.error ?? "Failed to disconnect.");
      }
    });
  }

  const s = settings;

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 24px",
        fontFamily: "var(--font-ui)",
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: "var(--text-3xl)",
          color: "var(--color-fg)",
          letterSpacing: "-0.02em",
          marginBottom: 32,
        }}
      >
        Settings
      </h1>

      {/* ── Studio Details ─────────────────────────────────────────────── */}
      <form ref={formRef} onSubmit={handleSave}>
        <SectionCard title="Studio Details">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={labelStyle} htmlFor="studio_name">Studio Name *</label>
              <input
                id="studio_name"
                name="studio_name"
                type="text"
                required
                defaultValue={s?.studio_name ?? ""}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="studio_address">Studio Address *</label>
              <textarea
                id="studio_address"
                name="studio_address"
                required
                rows={3}
                defaultValue={s?.studio_address ?? ""}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="notification_email">Notification Email *</label>
              <input
                id="notification_email"
                name="notification_email"
                type="email"
                required
                defaultValue={s?.notification_email ?? ""}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="instagram_url">Instagram URL *</label>
              <input
                id="instagram_url"
                name="instagram_url"
                type="text"
                required
                defaultValue={s?.instagram_url ?? ""}
                placeholder="https://instagram.com/yourstudio"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="default_duration_min">
                Default Appointment Duration (minutes)
              </label>
              <input
                id="default_duration_min"
                name="default_duration_min"
                type="number"
                min={30}
                step={15}
                required
                defaultValue={s?.default_duration_min ?? 60}
                style={{ ...inputStyle, width: 120 }}
              />
              <p
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-fg-subtle)",
                  marginTop: 4,
                }}
              >
                Used when generating available slots from Google Calendar.
              </p>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              disabled={isPending}
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: "var(--text-sm)",
                padding: "10px 24px",
                borderRadius: 4,
                border: "none",
                background: isPending ? "var(--color-accent-hover)" : "var(--color-accent)",
                color: "#fff",
                cursor: isPending ? "not-allowed" : "pointer",
                opacity: isPending ? 0.65 : 1,
              }}
            >
              {isPending ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </SectionCard>
      </form>

      {/* ── Google Calendar ────────────────────────────────────────────── */}
      <SectionCard title="Google Calendar">
        {googleConnected ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Connected badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <CheckCircle2 size={18} style={{ color: "var(--color-approved)" }} />
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 500,
                  color: "var(--color-approved)",
                }}
              >
                Connected
              </span>
            </div>

            {/* Dashboard warning */}
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "12px 14px",
                borderRadius: 4,
                background: "var(--color-pending-bg)",
                border: "1px solid var(--color-pending)",
              }}
            >
              <AlertTriangle size={16} style={{ color: "var(--color-pending)", flexShrink: 0, marginTop: 1 }} />
              <p
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "var(--text-sm)",
                  color: "var(--color-pending)",
                  lineHeight: 1.5,
                }}
              >
                Manage all appointments through this dashboard. Changes made directly in Google Calendar will not be reflected here.
              </p>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={disconnectPending}
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: "var(--text-sm)",
                padding: "10px 20px",
                borderRadius: 4,
                border: "1px solid var(--color-border-strong)",
                background: "transparent",
                color: "var(--color-fg)",
                cursor: disconnectPending ? "not-allowed" : "pointer",
                opacity: disconnectPending ? 0.65 : 1,
                alignSelf: "flex-start",
              }}
            >
              {disconnectPending ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--color-fg-muted)",
              }}
            >
              Connect your Google Calendar to sync available slots and automatically create calendar events when bookings are approved.
            </p>
            <form action={connectGoogleCalendar}>
              <button
                type="submit"
                style={{
                  fontFamily: "var(--font-ui)",
                  fontWeight: 500,
                  fontSize: "var(--text-sm)",
                  padding: "10px 20px",
                  borderRadius: 4,
                  border: "none",
                  background: "var(--color-accent)",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Connect Google Calendar
              </button>
            </form>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
