"use client";

import { useTransition } from "react";
import { logout } from "@/lib/actions/auth";

export default function LogoutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={pending}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)"; }}
      style={{
        background: "transparent",
        border: "none",
        color: "rgba(255,255,255,0.6)",
        fontFamily: "var(--font-ui)",
        fontWeight: 500,
        fontSize: 14,
        padding: "6px 0",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.6 : 1,
        transition: "color 0.15s",
      }}
    >
      {pending ? "Signing out…" : "Logout"}
    </button>
  );
}
