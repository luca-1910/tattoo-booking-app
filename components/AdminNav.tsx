"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const links = [
  { href: "/admin", label: "Bookings" },
  { href: "/admin/slots", label: "Slots" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/settings", label: "Settings" },
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function AdminNav({ active }: { active?: string }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav style={{
      background: "var(--color-fg)",
      height: 56,
      display: "flex",
      alignItems: "center",
      paddingLeft: 24,
      paddingRight: 24,
      gap: 0,
      position: "sticky",
      top: 0,
      zIndex: 50,
    }}>
      {/* Brand */}
      <Link href="/admin" style={{ textDecoration: "none", display: "flex", alignItems: "baseline", gap: 6, marginRight: "auto" }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 16,
          color: "#fff",
          letterSpacing: "-0.01em",
        }}>
          MISSMAY
        </span>
        <span style={{
          fontFamily: "var(--font-ui)",
          fontWeight: 400,
          fontSize: 14,
          color: "rgba(255,255,255,0.4)",
        }}>
          · Admin
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: "flex", alignItems: "stretch", height: "100%", gap: 0 }}>
        {links.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-ui)",
                fontWeight: 500,
                fontSize: 14,
                color: active ? "#fff" : "rgba(255,255,255,0.6)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                borderBottom: active ? "2px solid var(--color-accent)" : "2px solid transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div style={{ marginLeft: 16 }}>
        <LogoutButton />
      </div>
    </nav>
  );
}
