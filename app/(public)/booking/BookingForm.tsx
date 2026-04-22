"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { submitBooking } from "@/lib/actions/booking";
import type { AvailableSlot } from "@/types/database";
import Link from "next/link";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0);
  return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
}

function groupByDate(slots: AvailableSlot[]) {
  const groups: Record<string, AvailableSlot[]> = {};
  for (const slot of slots) {
    if (!groups[slot.date]) groups[slot.date] = [];
    groups[slot.date].push(slot);
  }
  return groups;
}

// ── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  client_name: z.string().min(1, "Full name is required"),
  client_email: z.string().email("Enter a valid email address"),
  client_phone: z.string().min(1, "Phone number is required"),
  client_instagram: z.string().min(1, "Instagram handle is required"),
  tattoo_description: z.string().min(20, "Description must be at least 20 characters"),
  body_placement: z.string().min(1, "Body placement is required"),
  size: z.enum(["small", "medium", "large", "full_piece"], {
    error: "Please select a size",
  }),
  agreed_price: z
    .string()
    .min(1, "Agreed price is required")
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid price"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingForm({ slots }: { slots: AvailableSlot[] }) {
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusToken, setStatusToken] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onBlur" });

  const grouped = groupByDate(slots);
  const dates = Object.keys(grouped).sort();

  // ── File upload ────────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setProofPath(null);
    setProofPreview(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5 MB.");
      return;
    }

    setProofPreview(URL.createObjectURL(file));
    setUploadProgress(0);

    const supabase = createClient();
    const path = `proofs/${Date.now()}-${file.name}`;

    // Simulate progress during upload (Supabase JS client doesn't stream progress)
    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p !== null && p < 90 ? p + 10 : p));
    }, 200);

    const { error } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { upsert: false });

    clearInterval(progressInterval);

    if (error) {
      setUploadProgress(null);
      setUploadError("Upload failed. Please try again.");
      return;
    }

    setUploadProgress(100);
    setProofPath(path);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    if (!selectedSlot) {
      setSubmitError("Please select a time slot.");
      return;
    }
    if (!proofPath) {
      setSubmitError("Please upload your payment proof.");
      return;
    }

    setSubmitError(null);

    const result = await submitBooking({
      slot_id: selectedSlot.id,
      client_name: values.client_name,
      client_email: values.client_email,
      client_phone: values.client_phone,
      client_instagram: values.client_instagram,
      tattoo_description: values.tattoo_description,
      body_placement: values.body_placement,
      size: values.size,
      agreed_price: Number(values.agreed_price),
      payment_proof_url: proofPath,
      notes: values.notes,
    });

    if (!result.success) {
      setSubmitError(result.error);
      return;
    }

    setStatusToken(result.status_token);
  }

  // ── Success state ──────────────────────────────────────────────────────────

  if (statusToken) {
    return (
      <div
        style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          padding: 32,
          maxWidth: 480,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--text-2xl)",
            color: "var(--color-fg)",
            marginBottom: 12,
          }}
        >
          Booking submitted!
        </h2>
        <p style={{ color: "var(--color-fg-muted)", marginBottom: 24 }}>
          You&apos;ll receive a confirmation email shortly.
        </p>
        <Link
          href={`/status/${statusToken}`}
          style={{
            display: "inline-block",
            background: "var(--color-accent)",
            color: "#fff",
            fontFamily: "var(--font-ui)",
            fontWeight: 500,
            fontSize: "var(--text-sm)",
            padding: "10px 20px",
            borderRadius: 4,
            textDecoration: "none",
          }}
        >
          View booking status
        </Link>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      {/* ── Step 1: Slot selection ── */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={sectionHeadingStyle}>Select a date &amp; time</h2>

        {dates.length === 0 ? (
          <p style={{ color: "var(--color-fg-muted)" }}>
            No slots available right now.{" "}
            <a
              href={process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-accent)" }}
            >
              Follow us on Instagram
            </a>{" "}
            to be notified when new dates open.
          </p>
        ) : (
          dates.map((date) => (
            <div key={date} style={{ marginBottom: 24 }}>
              <p style={dateHeadingStyle}>{formatDate(date)}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {grouped[date].map((slot) => {
                  const active = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 4,
                        border: `1px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                        background: active ? "var(--color-accent-soft)" : "var(--color-bg-surface)",
                        color: active ? "var(--color-accent)" : "var(--color-fg)",
                        fontFamily: "var(--font-ui)",
                        fontWeight: active ? 500 : 400,
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Step 2: Booking details (shown once slot selected) ── */}
      {selectedSlot && (
        <section
          style={{
            background: "var(--color-bg-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            padding: 24,
          }}
        >
          <h2 style={{ ...sectionHeadingStyle, marginBottom: 24 }}>Your details</h2>

          <div style={gridStyle}>
            <Field label="Full name" error={errors.client_name?.message}>
              <input {...register("client_name")} type="text" style={inputStyle} />
            </Field>

            <Field label="Email" error={errors.client_email?.message}>
              <input {...register("client_email")} type="email" style={inputStyle} />
            </Field>

            <Field label="Phone" error={errors.client_phone?.message}>
              <input {...register("client_phone")} type="tel" style={inputStyle} />
            </Field>

            <Field label="Instagram handle" error={errors.client_instagram?.message}>
              <input
                {...register("client_instagram")}
                type="text"
                placeholder="@handle"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Tattoo description" error={errors.tattoo_description?.message}>
            <textarea
              {...register("tattoo_description")}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <div style={gridStyle}>
            <Field label="Body placement" error={errors.body_placement?.message}>
              <input {...register("body_placement")} type="text" style={inputStyle} />
            </Field>

            <Field label="Size" error={errors.size?.message}>
              <select {...register("size")} style={inputStyle}>
                <option value="">Select size</option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="full_piece">Full piece</option>
              </select>
            </Field>

            <Field label="Agreed price (R$)" error={errors.agreed_price?.message}>
              <input
                {...register("agreed_price")}
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </Field>
          </div>

          {/* Payment proof upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Payment proof</label>
            <div
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 4,
                padding: 16,
                background: "var(--color-bg-inset)",
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "block", marginBottom: proofPreview ? 12 : 0 }}
              />
              {proofPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={proofPreview}
                  alt="Payment proof preview"
                  style={{
                    maxHeight: 120,
                    maxWidth: "100%",
                    borderRadius: 4,
                    marginTop: 8,
                    objectFit: "contain",
                  }}
                />
              )}
              {uploadProgress !== null && uploadProgress < 100 && (
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      height: 4,
                      background: "var(--color-border)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${uploadProgress}%`,
                        background: "var(--color-accent)",
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                  <p style={{ ...hintStyle, marginTop: 4 }}>Uploading…</p>
                </div>
              )}
              {uploadProgress === 100 && (
                <p style={{ ...hintStyle, color: "var(--color-approved)", marginTop: 6 }}>
                  ✓ Uploaded
                </p>
              )}
              {uploadError && <p style={errorStyle}>{uploadError}</p>}
            </div>
          </div>

          <Field label="Additional notes (optional)" error={errors.notes?.message}>
            <textarea
              {...register("notes")}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          {submitError && (
            <p style={{ ...errorStyle, marginBottom: 16 }}>{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || uploadProgress !== 100}
            style={{
              width: "100%",
              padding: "12px 20px",
              background:
                isSubmitting || uploadProgress !== 100
                  ? "var(--color-border-strong)"
                  : "var(--color-accent)",
              color: "#fff",
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: "var(--text-sm)",
              borderRadius: 4,
              border: "none",
              cursor: isSubmitting || uploadProgress !== 100 ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting…" : "Submit booking"}
          </button>
        </section>
      )}
    </form>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {error && <p style={errorStyle}>{error}</p>}
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "var(--text-xl)",
  color: "var(--color-fg)",
  letterSpacing: "-0.02em",
  marginBottom: 16,
};

const dateHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: "var(--text-sm)",
  color: "var(--color-fg-muted)",
  marginBottom: 8,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

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
  background: "var(--color-bg-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 4,
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-base)",
  color: "var(--color-fg)",
  outline: "none",
};

const errorStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--color-rejected)",
  marginTop: 4,
};

const hintStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontSize: "var(--text-sm)",
  color: "var(--color-fg-subtle)",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "0 16px",
};
