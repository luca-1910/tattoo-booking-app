"use client";

import { useTransition } from "react";
import { logout } from "@/lib/actions/auth";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={pending}
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "rgba(255,255,255,0.7)",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: "var(--text-sm)",
        padding: "6px 14px",
        borderRadius: 4,
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}
