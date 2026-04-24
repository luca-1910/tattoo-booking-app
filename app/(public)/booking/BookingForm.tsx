"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { submitBooking } from "@/lib/actions/booking";
import type { AvailableSlot } from "@/types/database";
import Link from "next/link";
import { Upload, CheckCircle, Loader2, ChevronDown } from "lucide-react";

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
  return d.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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

const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/missmay.tattoos";

// ── Component ─────────────────────────────────────────────────────────────────

export default function BookingForm({ slots }: { slots: AvailableSlot[] }) {
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [proofPath, setProofPath] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [proofFilename, setProofFilename] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [statusToken, setStatusToken] = useState<string | null>(null);
  const [clientFirstName, setClientFirstName] = useState<string | null>(null);
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
    setProofFilename(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Only image files are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be under 5 MB.");
      return;
    }

    setProofPreview(URL.createObjectURL(file));
    setProofFilename(file.name);
    setUploadProgress(0);

    const supabase = createClient();
    const path = `proofs/${Date.now()}-${file.name}`;

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

    setClientFirstName(values.client_name.split(" ")[0]);
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
          padding: "40px 32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <CheckCircle
            size={56}
            strokeWidth={1.5}
            style={{ color: "var(--color-approved)" }}
          />
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 32,
            letterSpacing: "-0.02em",
            color: "var(--color-fg)",
            marginBottom: 12,
          }}
        >
          Booking received
        </h2>

        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 400,
            fontSize: 16,
            color: "var(--color-fg-muted)",
            lineHeight: 1.6,
            maxWidth: 360,
            margin: "0 auto 32px",
          }}
        >
          Thanks {clientFirstName}. Phoebe will review your request and be in
          touch via email shortly.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            href={`/status/${statusToken}`}
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 500,
              fontSize: 14,
              padding: "10px 20px",
              borderRadius: 4,
              background: "var(--color-accent)",
              color: "#fff",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Track your booking →
          </Link>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 400,
              fontSize: 14,
              color: "var(--color-fg-muted)",
              textDecoration: "none",
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>

      {/* ── Step 1: Slot selection ── */}
      <section style={{ marginBottom: 48 }}>
        <p style={stepLabelStyle}>01 — CHOOSE A DATE</p>

        {dates.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontWeight: 400,
              fontSize: 16,
              color: "var(--color-fg-muted)",
              lineHeight: 1.6,
            }}
          >
            No dates available right now.{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--color-accent)", textDecoration: "none" }}
            >
              Follow Phoebe on Instagram
            </a>{" "}
            to be notified when new dates drop.
          </p>
        ) : (
          dates.map((date) => (
            <div key={date} style={{ marginBottom: 28 }}>
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
                        padding: "10px 20px",
                        borderRadius: 4,
                        border: `1px solid ${
                          active ? "var(--color-accent)" : "var(--color-border)"
                        }`,
                        background: active
                          ? "var(--color-accent-soft)"
                          : "var(--color-bg-surface)",
                        color: active
                          ? "var(--color-accent)"
                          : "var(--color-fg)",
                        fontFamily: "var(--font-ui)",
                        fontWeight: active ? 500 : 400,
                        fontSize: "var(--text-sm)",
                        cursor: "pointer",
                        outline: "none",
                        transition: "border-color 0.15s, background 0.15s, color 0.15s",
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

      {/* ── Step 2: Booking details (revealed after slot selected) ── */}
      {selectedSlot && (
        <section>
          <p style={stepLabelStyle}>02 — YOUR DETAILS</p>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "0 16px" }}>
            <Field label="Full name" error={errors.client_name?.message}>
              <input
                {...register("client_name")}
                type="text"
                style={inputStyle}
                className="input-field"
              />
            </Field>

            <Field label="Email" error={errors.client_email?.message}>
              <input
                {...register("client_email")}
                type="email"
                style={inputStyle}
                className="input-field"
              />
            </Field>

            <Field label="Phone" error={errors.client_phone?.message}>
              <input
                {...register("client_phone")}
                type="tel"
                style={inputStyle}
                className="input-field"
              />
            </Field>

            <Field label="Instagram handle" error={errors.client_instagram?.message}>
              <input
                {...register("client_instagram")}
                type="text"
                placeholder="@handle"
                style={inputStyle}
                className="input-field"
              />
            </Field>
          </div>

          <Field
            label="Tattoo description"
            error={errors.tattoo_description?.message}
          >
            <textarea
              {...register("tattoo_description")}
              rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              className="input-field"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "0 16px" }}>
            <Field label="Body placement" error={errors.body_placement?.message}>
              <input
                {...register("body_placement")}
                type="text"
                style={inputStyle}
                className="input-field"
              />
            </Field>

            <Field label="Size" error={errors.size?.message}>
              <div style={{ position: "relative" }}>
                <select
                  {...register("size")}
                  style={{ ...inputStyle, paddingRight: 36 }}
                  className="input-field select-no-arrow"
                >
                  <option value="">Select size</option>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="full_piece">Full piece</option>
                </select>
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "var(--color-fg-muted)",
                    display: "flex",
                  }}
                >
                  <ChevronDown size={16} />
                </div>
              </div>
            </Field>

            <Field label="Agreed price (R$)" error={errors.agreed_price?.message}>
              <input
                {...register("agreed_price")}
                type="number"
                min="0"
                step="0.01"
                style={inputStyle}
                className="input-field"
              />
            </Field>
          </div>

          {/* Payment proof upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Payment proof</label>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: "2px dashed var(--color-border)",
                borderRadius: 4,
                padding: "28px 24px",
                cursor: "pointer",
                background: "var(--color-bg-surface)",
                textAlign: "center",
                transition: "border-color 0.15s",
              }}
            >
              {!proofPreview ? (
                <>
                  <Upload
                    size={24}
                    style={{
                      color: "var(--color-fg-subtle)",
                      display: "block",
                      margin: "0 auto 8px",
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontWeight: 500,
                      fontSize: 14,
                      color: "var(--color-fg-muted)",
                    }}
                  >
                    Upload payment screenshot
                  </p>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proofPreview}
                    alt="Payment proof preview"
                    style={{
                      width: 52,
                      height: 52,
                      objectFit: "cover",
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {uploadProgress !== null && uploadProgress < 100 ? (
                      <>
                        <p
                          style={{
                            fontFamily: "var(--font-ui)",
                            fontSize: 13,
                            color: "var(--color-fg-muted)",
                            marginBottom: 6,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {proofFilename}
                        </p>
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
                      </>
                    ) : (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 8 }}
                      >
                        <p
                          style={{
                            fontFamily: "var(--font-ui)",
                            fontSize: 13,
                            color: "var(--color-fg)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {proofFilename}
                        </p>
                        <CheckCircle
                          size={18}
                          style={{ color: "var(--color-approved)", flexShrink: 0 }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {uploadError && <p style={errorStyle}>{uploadError}</p>}
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: 12,
                color: "var(--color-fg-subtle)",
                marginTop: 6,
              }}
            >
              Max 5MB
            </p>
          </div>

          <Field
            label="Additional notes (optional)"
            error={errors.notes?.message}
          >
            <textarea
              {...register("notes")}
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
              className="input-field"
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
              padding: 16,
              background:
                isSubmitting || uploadProgress !== 100
                  ? "var(--color-border-strong)"
                  : "var(--color-accent)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 16,
              borderRadius: 4,
              border: "none",
              cursor:
                isSubmitting || uploadProgress !== 100 ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              letterSpacing: "-0.01em",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit booking"
            )}
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

const stepLabelStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: 11,
  color: "var(--color-fg-muted)",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  marginBottom: 24,
};

const dateHeadingStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: 18,
  color: "var(--color-fg)",
  letterSpacing: "-0.01em",
  lineHeight: 1.2,
  marginBottom: 12,
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
