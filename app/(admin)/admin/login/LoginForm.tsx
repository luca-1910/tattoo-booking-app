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
        background: pending ? "var(--color-border-strong)" : "var(--color-accent)",
        color: "#fff",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: "var(--text-sm)",
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
    <form action={action} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label style={labelStyle}>Email</label>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
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
          style={inputStyle}
        />
      </div>

      {state?.error && (
        <p style={{ fontFamily: "var(--font-ui)", fontSize: "var(--text-sm)", color: "var(--color-rejected)", margin: 0 }}>
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

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
