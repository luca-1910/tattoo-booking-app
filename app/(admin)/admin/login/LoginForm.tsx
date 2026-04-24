"use client";

import { useFormState, useFormStatus } from "react-dom";
import { login } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        width: "100%",
        padding: "11px 20px",
        background: pending ? "var(--color-accent-hover)" : "var(--color-accent)",
        color: "#fff",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 14,
        borderRadius: 4,
        border: "none",
        cursor: pending ? "not-allowed" : "pointer",
        marginTop: 8,
      }}
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useFormState(login, null);

  return (
    <div>
      <h1 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 32,
        color: "var(--color-fg)",
        letterSpacing: "-0.02em",
        lineHeight: 1.2,
        marginBottom: 32,
      }}>
        Welcome back
      </h1>

      <form action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Password</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-field"
            style={inputStyle}
          />
        </div>

        <SubmitButton />

        {state?.error && (
          <p style={{
            fontFamily: "var(--font-ui)",
            fontWeight: 400,
            fontSize: 14,
            color: "var(--color-rejected)",
            margin: 0,
          }}>
            {state.error}
          </p>
        )}
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-ui)",
  fontWeight: 500,
  fontSize: 14,
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
  fontSize: 16,
  color: "var(--color-fg)",
  outline: "none",
};
